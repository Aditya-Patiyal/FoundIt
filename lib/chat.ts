import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ChatMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ReturnState = {
  exists: boolean;
  finderMarkedAt: string | null;
  claimantConfirmedAt: string | null;
};

export type ChatContext = {
  claimId: string;
  userId: string;
  isFinder: boolean;
  otherName: string;
  itemId: string;
  itemTitle: string;
  messages: ChatMessage[];
  returnState: ReturnState;
};

// Loads a chat thread for an accepted claim. Returns null if the viewer isn't a
// party to the claim or the claim isn't accepted (so the page can 404).
export async function getChatContext(claimId: string): Promise<ChatContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: claim } = await supabase
    .from("claims")
    .select(
      "id, item_id, claimant_id, claimant_display_name, finder_display_name, status",
    )
    .eq("id", claimId)
    .maybeSingle();
  if (!claim || claim.status !== "accepted") return null;

  const { data: item } = await supabase
    .from("items")
    .select("id, title, finder_id")
    .eq("id", claim.item_id)
    .maybeSingle();
  if (!item) return null;

  const isFinder = item.finder_id === user.id;
  const isClaimant = claim.claimant_id === user.id;
  if (!isFinder && !isClaimant) return null;

  const otherName = isFinder
    ? claim.claimant_display_name || "Claimant"
    : claim.finder_display_name || "Finder";

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: true });

  const { data: ret } = await supabase
    .from("returns")
    .select("finder_marked_at, claimant_confirmed_at")
    .eq("claim_id", claimId)
    .maybeSingle();

  return {
    claimId,
    userId: user.id,
    isFinder,
    otherName,
    itemId: item.id,
    itemTitle: item.title,
    messages: (messages ?? []) as ChatMessage[],
    returnState: {
      exists: !!ret,
      finderMarkedAt: ret?.finder_marked_at ?? null,
      claimantConfirmedAt: ret?.claimant_confirmed_at ?? null,
    },
  };
}
