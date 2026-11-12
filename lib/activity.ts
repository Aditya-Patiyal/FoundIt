import "server-only";
import { createClient } from "@/lib/supabase/server";
import { REMINDER_DAYS, officeForZone } from "@/lib/config";

// Everything the Activity screen (screen 6) shows for the current user:
//  - review:    my items that have claims waiting for my decision
//  - reminders: my unclaimed items I've held past REMINDER_DAYS (hand-over nudge)
//  - myClaims:  claims I've made on other people's items
//  - returns:   handovers I'm part of (as finder or claimant)

export type ReviewItem = {
  itemId: string;
  title: string;
  pendingCount: number;
};

export type ReminderItem = {
  itemId: string;
  title: string;
  zone: string;
  office: string;
  createdAt: string;
};

export type MyClaim = {
  claimId: string;
  itemId: string;
  itemTitle: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  finderName: string | null;
  createdAt: string;
};

export type ReturnedItem = {
  claimId: string;
  itemTitle: string;
  finalized: boolean;
  role: "finder" | "claimant";
};

export type Activity = {
  review: ReviewItem[];
  reminders: ReminderItem[];
  myClaims: MyClaim[];
  returns: ReturnedItem[];
};

const EMPTY: Activity = { review: [], reminders: [], myClaims: [], returns: [] };

export async function getActivity(): Promise<Activity> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  // Titles get reused across sections; collect every item id we touch and look
  // them up once at the end.
  const titles = new Map<string, string>();

  // --- My items (as finder) -------------------------------------------------
  const { data: myItems } = await supabase
    .from("items")
    .select("id, title, zone, status, holding, created_at")
    .eq("finder_id", user.id);

  const items = myItems ?? [];
  for (const it of items) titles.set(it.id, it.title);
  const myItemIds = items.map((it) => it.id);

  // Claims on my items — count the pending ones per item, and note which items
  // have any live claim (pending/accepted) so they don't also get a reminder.
  const pendingByItem = new Map<string, number>();
  const itemsWithLiveClaim = new Set<string>();
  if (myItemIds.length > 0) {
    const { data: claimsOnMine } = await supabase
      .from("claims")
      .select("item_id, status")
      .in("item_id", myItemIds);
    for (const c of claimsOnMine ?? []) {
      if (c.status === "pending") {
        pendingByItem.set(c.item_id, (pendingByItem.get(c.item_id) ?? 0) + 1);
        itemsWithLiveClaim.add(c.item_id);
      } else if (c.status === "accepted") {
        itemsWithLiveClaim.add(c.item_id);
      }
    }
  }

  const review: ReviewItem[] = items
    .filter((it) => (pendingByItem.get(it.id) ?? 0) > 0)
    .map((it) => ({
      itemId: it.id,
      title: it.title,
      pendingCount: pendingByItem.get(it.id) ?? 0,
    }));

  // Reminder: still open, still with me, posted over REMINDER_DAYS ago, and no
  // live claim in flight.
  const cutoff = Date.now() - REMINDER_DAYS * 24 * 60 * 60 * 1000;
  const reminders: ReminderItem[] = items
    .filter(
      (it) =>
        it.status === "open" &&
        it.holding === "with_finder" &&
        !itemsWithLiveClaim.has(it.id) &&
        new Date(it.created_at).getTime() < cutoff,
    )
    .map((it) => ({
      itemId: it.id,
      title: it.title,
      zone: it.zone,
      office: officeForZone(it.zone),
      createdAt: it.created_at,
    }));

  // --- Claims I've made (as claimant) --------------------------------------
  const { data: mine } = await supabase
    .from("claims")
    .select("id, item_id, status, finder_display_name, created_at")
    .eq("claimant_id", user.id)
    .order("created_at", { ascending: false });

  // --- Returns I'm part of (as finder or claimant) -------------------------
  const { data: rets } = await supabase
    .from("returns")
    .select("claim_id, item_id, finder_id, claimant_confirmed_at")
    .or(`finder_id.eq.${user.id},claimant_id.eq.${user.id}`)
    .order("finder_marked_at", { ascending: false });

  // Look up any titles for items I didn't post, before building the lists so we
  // can resolve each row's title by its own item id (no fragile index math).
  const needTitles = new Set<string>();
  for (const c of mine ?? []) if (!titles.has(c.item_id)) needTitles.add(c.item_id);
  for (const r of rets ?? []) if (!titles.has(r.item_id)) needTitles.add(r.item_id);
  if (needTitles.size > 0) {
    const { data: more } = await supabase
      .from("items")
      .select("id, title")
      .in("id", [...needTitles]);
    for (const it of more ?? []) titles.set(it.id, it.title);
  }

  const myClaims: MyClaim[] = (mine ?? [])
    .filter((c) => c.status !== "withdrawn")
    .map((c) => ({
      claimId: c.id,
      itemId: c.item_id,
      itemTitle: titles.get(c.item_id) ?? "Item",
      status: c.status,
      finderName: c.finder_display_name || null,
      createdAt: c.created_at,
    }));

  const returns: ReturnedItem[] = (rets ?? []).map((r) => ({
    claimId: r.claim_id,
    itemTitle: titles.get(r.item_id) ?? "Item",
    finalized: !!r.claimant_confirmed_at,
    role: r.finder_id === user.id ? "finder" : "claimant",
  }));

  return { review, reminders, myClaims, returns };
}
