import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Holding } from "@/lib/config";

// Data Access Layer for items (Next data-security guide). Only ever selects
// PUBLIC columns — item_private is never read here, so the private details
// cannot leak to Browse or Item detail.

export type ItemCard = {
  id: string;
  title: string;
  category: string;
  zone: string;
  spot: string | null;
  holding: Holding;
  photo_paths: string[];
  created_at: string;
};

export type ItemDetail = ItemCard & {
  public_description: string;
  found_at: string | null;
  status: string;
};

const CARD_COLS = "id, title, category, zone, spot, holding, photo_paths, created_at";

// Strip characters that have meaning in PostgREST filter syntax so a search
// term can't break the query (not SQL — PostgREST parameterizes — but the
// filter grammar uses , ( ) * % etc.).
function cleanTerm(q: string): string {
  return q
    .replace(/[,()*%\\:]/g, " ")
    .trim()
    .slice(0, 80);
}

export async function getItems(opts: {
  q?: string;
  category?: string;
  zone?: string;
}): Promise<ItemCard[]> {
  const supabase = await createClient();
  let query = supabase
    .from("items")
    .select(CARD_COLS)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(100);

  if (opts.category && opts.category !== "All") {
    query = query.eq("category", opts.category);
  }
  if (opts.zone && opts.zone !== "All") {
    query = query.eq("zone", opts.zone);
  }
  const term = opts.q ? cleanTerm(opts.q) : "";
  if (term) {
    query = query.or(`title.ilike.%${term}%,public_description.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ItemCard[];
}

export async function getItem(id: string): Promise<ItemDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(`${CARD_COLS}, public_description, found_at, status`)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as unknown as ItemDetail;
}
