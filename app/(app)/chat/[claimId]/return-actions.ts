"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Finder marks the item returned: creates the return record (snapshotting the
// claim answers). The claimant still has to confirm before it's final.
export async function markReturned(claimId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: claim } = await supabase
    .from("claims")
    .select(
      "id, item_id, claimant_id, claimant_display_name, lost_zone, lost_when_text, contents_answer, secret_answer, status",
    )
    .eq("id", claimId)
    .maybeSingle();
  if (!claim || claim.status !== "accepted") return { error: "Claim is not open." };

  // Must be the finder of this item.
  const { data: owned } = await supabase
    .from("items")
    .select("id")
    .eq("id", claim.item_id)
    .eq("finder_id", user.id)
    .maybeSingle();
  if (!owned) return { error: "Only the finder can do this." };

  // Already started? Then nothing to do.
  const { data: existing } = await supabase
    .from("returns")
    .select("id")
    .eq("claim_id", claimId)
    .maybeSingle();
  if (existing) {
    revalidatePath(`/chat/${claimId}`);
    return {};
  }

  const { error } = await supabase.from("returns").insert({
    item_id: claim.item_id,
    claim_id: claimId,
    finder_id: user.id,
    claimant_id: claim.claimant_id,
    answers_snapshot: {
      claimant_display_name: claim.claimant_display_name,
      lost_zone: claim.lost_zone,
      lost_when_text: claim.lost_when_text,
      contents_answer: claim.contents_answer,
      secret_answer: claim.secret_answer,
    },
  });
  if (error) return { error: "Couldn't mark it returned. Please try again." };

  revalidatePath(`/chat/${claimId}`);
  return {};
}

// Claimant confirms they got the item back → record is finalized (and a DB
// trigger flips the item to 'returned').
export async function confirmReceived(claimId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { error } = await supabase
    .from("returns")
    .update({ claimant_confirmed_at: new Date().toISOString() })
    .eq("claim_id", claimId)
    .eq("claimant_id", user.id)
    .is("claimant_confirmed_at", null);
  if (error) return { error: "Couldn't confirm. Please try again." };

  revalidatePath(`/chat/${claimId}`);
  return {};
}
