import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HOSTEL_BLOCKS } from "@/lib/config";
import { completeOnboarding } from "./actions";

// First-run profile setup: confirm name + pick hostel block (README §11 profiles).
export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, hostel_block")
    .eq("id", user.id)
    .single();

  // Already onboarded → go home.
  if (profile?.hostel_block) redirect("/");

  const params = await searchParams;
  const hasError = params?.error != null;
  const suggestedName = profile?.display_name ?? user.email?.split("@")[0] ?? "";

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-card bg-surface p-6 shadow-sm">
        <h1 className="text-xl font-bold text-ink">Set up your profile</h1>
        <p className="mt-1 text-sm text-muted">
          This is shown to a finder only after they accept your claim.
        </p>

        <form action={completeOnboarding} className="mt-5 space-y-4">
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-ink">
              Your name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              maxLength={60}
              defaultValue={suggestedName}
              className="mt-1.5 w-full rounded-btn border border-black/10 bg-white px-3 py-3 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label htmlFor="hostel_block" className="block text-sm font-medium text-ink">
              Hostel block
            </label>
            <select
              id="hostel_block"
              name="hostel_block"
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-btn border border-black/10 bg-white px-3 py-3 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              <option value="" disabled>
                Select your block
              </option>
              {HOSTEL_BLOCKS.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </select>
          </div>

          {hasError ? (
            <p className="text-sm text-danger">
              Please enter your name and pick a hostel block.
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-btn bg-primary px-4 py-3 font-semibold text-white hover:opacity-95"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
