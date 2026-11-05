"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HOSTEL_BLOCKS } from "@/lib/config";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const hostelBlock = String(formData.get("hostel_block") ?? "");

  if (!displayName || !HOSTEL_BLOCKS.includes(hostelBlock)) {
    redirect("/onboarding?error=1");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, hostel_block: hostelBlock })
    .eq("id", user.id);

  if (error) redirect("/onboarding?error=1");

  redirect("/");
}
