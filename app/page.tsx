import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { APP_NAME } from "@/lib/config";

// Step 1 home: a signed-in placeholder. Proper Browse screen arrives in Step 2.
// The gate here (auth + onboarding) is what Step 1 is really about.
export default async function Home() {
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

  // New users haven't picked a hostel block yet.
  if (!profile || !profile.hostel_block) redirect("/onboarding");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-card bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-on-soft">{APP_NAME}</p>
        <h1 className="mt-1 text-xl font-bold text-ink">
          You&apos;re signed in, {profile.display_name}.
        </h1>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Email</dt>
            <dd className="text-ink">{profile.college_email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Hostel block</dt>
            <dd className="text-ink">{profile.hostel_block}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Status</dt>
            <dd className="text-ink">{profile.status}</dd>
          </div>
        </dl>

        <p className="mt-5 rounded-btn bg-primary-soft p-3 text-xs text-primary-on-soft">
          Step 1 (Auth) is working. Browsing and posting items come next (Step 2).
        </p>

        <form action={signOut} className="mt-5">
          <button
            type="submit"
            className="w-full rounded-btn border border-black/10 px-4 py-3 font-semibold text-ink hover:bg-black/[0.03]"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
