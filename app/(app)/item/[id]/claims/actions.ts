"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Finder accepts or rejects a claim. Re-verifies the caller is the item's
// finder (authorization, not just authentication).
export async function decideClaim(formData: FormData) {
  const claimId = String(formData.get("claimId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!claimId || (decision !== "accept" && decision !== "reject")) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: claim } = await supabase
    .from("claims")
    .select("id, item_id")
    .eq("id", claimId)
    .maybeSingle();
  if (!claim) return;

  // Must be the finder of this claim's item.
  const { data: owned } = await supabase
    .from("items")
    .select("id")
    .eq("id", claim.item_id)
    .eq("finder_id", user.id)
    .maybeSingle();
  if (!owned) return;

  // On accept, reveal the finder's name to the claimant (README §11) by
  // snapshotting it onto the claim — profiles RLS is own-row-only.
  const update: {
    status: "accepted" | "rejected";
    decided_at: string;
    finder_display_name?: string;
  } = {
    status: decision === "accept" ? "accepted" : "rejected",
    decided_at: new Date().toISOString(),
  };
  if (decision === "accept") {
    const { data: me } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    update.finder_display_name = me?.display_name ?? "";
  }

  await supabase.from("claims").update(update).eq("id", claimId);

  revalidatePath(`/item/${claim.item_id}/claims`);
  revalidatePath(`/item/${claim.item_id}`);
}
