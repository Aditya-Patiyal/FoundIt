"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, ZONES, HOLDING_OPTIONS, MAX_PHOTOS_PER_ITEM } from "@/lib/config";

export type NewItemInput = {
  title: string;
  category: string;
  public_description: string;
  zone: string;
  spot: string;
  holding: string;
  private_details: string;
  photo_paths: string[];
};

export type PostResult = { error: string } | { ok: true; id: string };

// Creates a found item. Re-verifies auth + validates input server-side (the
// client form is just for UX; this is the real gate). RLS additionally blocks
// paused users and foreign photo paths.
export async function createItem(input: NewItemInput): Promise<PostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const title = (input.title ?? "").trim();
  const zone = (input.zone ?? "").trim();
  const category = (input.category ?? "").trim();
  const holding = (input.holding ?? "").trim();

  if (!title) return { error: "Please add a short title." };
  if (!(CATEGORIES as readonly string[]).includes(category))
    return { error: "Please choose a category." };
  if (!ZONES.includes(zone)) return { error: "Please choose where you found it." };
  if (!HOLDING_OPTIONS.some((h) => h.value === holding))
    return { error: "Please choose where the item is now." };

  // Photos must be ours (storage RLS enforces this too) and within the limit.
  const photo_paths = (input.photo_paths ?? [])
    .filter((p) => typeof p === "string" && p.startsWith(`${user.id}/`))
    .slice(0, MAX_PHOTOS_PER_ITEM);

  const { data: item, error } = await supabase
    .from("items")
    .insert({
      finder_id: user.id,
      title: title.slice(0, 120),
      category,
      public_description: (input.public_description ?? "").trim().slice(0, 2000),
      zone,
      spot: (input.spot ?? "").trim().slice(0, 120) || null,
      holding,
      photo_paths,
    })
    .select("id")
    .single();

  if (error || !item) {
    return { error: "Couldn't post the item. Please try again." };
  }

  const privateDetails = (input.private_details ?? "").trim();
  if (privateDetails) {
    await supabase
      .from("item_private")
      .insert({ item_id: item.id, private_details: privateDetails.slice(0, 2000) });
  }

  revalidatePath("/browse");
  return { ok: true, id: item.id };
}
