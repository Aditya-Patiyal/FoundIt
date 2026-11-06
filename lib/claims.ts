import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ClaimStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export type ClaimForReview = {
  id: string;
  claimant_display_name: string;
  claimant_block: string | null;
  lost_zone: string | null;
  lost_when_text: string | null;
  contents_answer: string | null;
  secret_answer: string | null;
  proof_photo_path: string | null;
  status: ClaimStatus;
  created_at: string;
};

// What the current viewer is to an item: the finder, an existing claimant, or
// a potential claimant. Drives the CTA on the item detail page.
export async function getViewerItemContext(itemId: string): Promise<{
  isFinder: boolean;
  myClaimStatus: ClaimStatus | null;
  pendingCount: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { isFinder: false, myClaimStatus: null, pendingCount: 0 };

  const { data: owned } = await supabase
    .from("items")
    .select("id")
    .eq("id", itemId)
    .eq("finder_id", user.id)
    .maybeSingle();
  const isFinder = !!owned;

  let pendingCount = 0;
  if (isFinder) {
    const { count } = await supabase
      .from("claims")
      .select("id", { count: "exact", head: true })
      .eq("item_id", itemId)
      .eq("status", "pending");
    pendingCount = count ?? 0;
  }

  const { data: mine } = await supabase
    .from("claims")
    .select("status")
    .eq("item_id", itemId)
    .eq("claimant_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    isFinder,
    myClaimStatus: (mine?.status as ClaimStatus | undefined) ?? null,
    pendingCount,
  };
}

// For the finder review screen: the private note + every claim. Returns null
// if the current user is not the item's finder (so the page can 404).
export async function getFinderReview(itemId: string): Promise<{
  title: string;
  privateDetails: string;
  claims: ClaimForReview[];
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: owned } = await supabase
    .from("items")
    .select("id, title")
    .eq("id", itemId)
    .eq("finder_id", user.id)
    .maybeSingle();
  if (!owned) return null;

  const { data: priv } = await supabase
    .from("item_private")
    .select("private_details")
    .eq("item_id", itemId)
    .maybeSingle();

  const { data: claims } = await supabase
    .from("claims")
    .select(
      "id, claimant_display_name, claimant_block, lost_zone, lost_when_text, contents_answer, secret_answer, proof_photo_path, status, created_at",
    )
    .eq("item_id", itemId)
    .order("created_at", { ascending: false });

  return {
    title: (owned as { title: string }).title,
    privateDetails: priv?.private_details ?? "",
    claims: (claims ?? []) as ClaimForReview[],
  };
}
