import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { APP_NAME } from "@/lib/config";

// Screen 11 (Me) — minimal for now: profile + sign out. Notification toggles,
// alerts and blocked people come in later steps.
export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, college_email, hostel_block, status")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-xl font-bold text-ink">Me</h1>

      <div className="mt-4 rounded-card bg-surface p-5 shadow-sm">
        <p className="text-lg font-semibold text-ink">{profile?.display_name}</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Email</dt>
            <dd className="text-ink">{profile?.college_email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Hostel block</dt>
            <dd className="text-ink">{profile?.hostel_block}</dd>
          </div>
        </dl>
      </div>

      <form action={signOut} className="mt-5">
        <button
          type="submit"
          className="w-full rounded-btn border border-black/10 px-4 py-3 font-semibold text-ink hover:bg-black/[0.03]"
        >
          Sign out
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">{APP_NAME}</p>
    </main>
  );
}
