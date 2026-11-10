import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ReturnRecord = {
  recordCode: string;
  finderMarkedAt: string;
  claimantConfirmedAt: string | null;
  finalized: boolean;
  itemTitle: string;
  itemCategory: string;
  place: string;
  postedAt: string;
  finderName: string;
  claimantName: string;
  answers: Record<string, string | null>;
};

// Full return record for the record page. Returns null if the viewer isn't a
// party (RLS also enforces this).
export async function getReturnRecord(claimId: string): Promise<ReturnRecord | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ret } = await supabase
    .from("returns")
    .select(
      "item_id, claim_id, finder_id, claimant_id, finder_marked_at, claimant_confirmed_at, answers_snapshot, record_code",
    )
    .eq("claim_id", claimId)
    .maybeSingle();
  if (!ret) return null;
  if (ret.finder_id !== user.id && ret.claimant_id !== user.id) return null;

  const { data: item } = await supabase
    .from("items")
    .select("title, category, zone, spot, created_at")
    .eq("id", ret.item_id)
    .maybeSingle();

  const { data: claim } = await supabase
    .from("claims")
    .select("claimant_display_name, finder_display_name")
    .eq("id", ret.claim_id)
    .maybeSingle();

  const snapshot = (ret.answers_snapshot ?? {}) as Record<string, string | null>;
  const place = item?.spot ? `${item.zone} · ${item.spot}` : (item?.zone ?? "");

  return {
    recordCode: ret.record_code,
    finderMarkedAt: ret.finder_marked_at,
    claimantConfirmedAt: ret.claimant_confirmed_at,
    finalized: !!ret.claimant_confirmed_at,
    itemTitle: item?.title ?? "Item",
    itemCategory: item?.category ?? "",
    place,
    postedAt: item?.created_at ?? ret.finder_marked_at,
    finderName: claim?.finder_display_name || "The finder",
    claimantName: claim?.claimant_display_name || "The claimant",
    answers: {
      "Where lost": snapshot.lost_zone ?? null,
      When: snapshot.lost_when_text ?? null,
      "Looks like / inside": snapshot.contents_answer ?? null,
      "Detail only they'd know": snapshot.secret_answer ?? null,
    },
  };
}
