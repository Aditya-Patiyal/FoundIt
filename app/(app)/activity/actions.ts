"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Finder confirms they handed an unclaimed item to the official office
// (README §6). Re-verifies the caller owns the item; the items UPDATE policy
// (finder-only) is the real gate. Sets status so it leaves Browse and the
// reminder list.
export async function markHandedToOffice(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: owned } = await supabase
    .from("items")
    .select("id")
    .eq("id", itemId)
    .eq("finder_id", user.id)
    .maybeSingle();
  if (!owned) return;

  await supabase
    .from("items")
    .update({ status: "handed_to_office" })
    .eq("id", itemId)
    .eq("finder_id", user.id);

  revalidatePath("/activity");
  revalidatePath(`/item/${itemId}`);
  revalidatePath("/browse");
}
