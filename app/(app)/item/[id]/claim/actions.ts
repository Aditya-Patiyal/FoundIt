"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NewClaimInput = {
  itemId: string;
  lost_zone: string;
  lost_when_text: string;
  contents_answer: string;
  secret_answer: string;
  proof_photo_path: string | null;
};

export type ClaimResult = { error: string } | { ok: true };

// Submits a claim. Re-verifies auth; the DB trigger enforces the hard rules
// (not your own item, no duplicate, 3/day cap, active profile).
export async function createClaim(input: NewClaimInput): Promise<ClaimResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const secret = (input.secret_answer ?? "").trim();
  if (!secret) {
    return { error: "Please add one detail only the owner would know." };
  }

  // Snapshot the claimant's name/block so the finder can see them (profiles
  // RLS is own-row-only).
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, hostel_block")
    .eq("id", user.id)
    .single();

  const proof =
    typeof input.proof_photo_path === "string" &&
    input.proof_photo_path.startsWith(`${user.id}/`)
      ? input.proof_photo_path
      : null;

  const { error } = await supabase.from("claims").insert({
    item_id: input.itemId,
    claimant_id: user.id,
    claimant_display_name: profile?.display_name ?? "",
    claimant_block: profile?.hostel_block ?? null,
    lost_zone: input.lost_zone || null,
    lost_when_text: (input.lost_when_text ?? "").trim().slice(0, 200) || null,
    contents_answer: (input.contents_answer ?? "").trim().slice(0, 1000) || null,
    secret_answer: secret.slice(0, 1000),
    proof_photo_path: proof,
  });

  if (error) {
    // Our trigger raises friendly messages with SQLSTATE P0001.
    if (error.code === "P0001") return { error: error.message };
    return { error: "Couldn't send your claim. Please try again." };
  }

  revalidatePath(`/item/${input.itemId}`);
  return { ok: true };
}
