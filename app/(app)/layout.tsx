import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";

// Shell for the signed-in app: enforces onboarding and shows the bottom tab bar.
// (Auth itself is enforced by middleware.)
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("hostel_block")
    .eq("id", user.id)
    .single();
  if (!profile?.hostel_block) redirect("/onboarding");

  return (
    <div className="flex flex-1 flex-col pb-16">
      {children}
      <BottomNav />
    </div>
  );
}
