import Link from "next/link";
import { getActivity } from "@/lib/activity";
import { markHandedToOffice } from "./actions";
import { timeAgo } from "@/lib/time";

// Screen 6 — Activity. Three groups: things that need you (claims to review +
// 7-day hand-over reminders), claims you've made, and returns you're part of.
export default async function ActivityPage() {
  const { review, reminders, myClaims, returns } = await getActivity();

  const needsYou = review.length + reminders.length;
  const empty =
    needsYou === 0 && myClaims.length === 0 && returns.length === 0;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-xl font-bold text-ink">Activity</h1>

      {empty && (
        <div className="mt-6 rounded-card bg-surface p-6 text-center shadow-sm">
          <p className="text-sm text-muted">
            Nothing here yet. When someone claims your item, or you claim one,
            it shows up here.
          </p>
          <Link
            href="/browse"
            className="mt-4 inline-block rounded-btn bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            Browse found items
          </Link>
        </div>
      )}

      {/* ---- Needs you ---- */}
      {needsYou > 0 && (
        <section className="mt-5">
          <h2 className="text-sm font-semibold text-muted">Needs you</h2>
          <div className="mt-2 space-y-3">
            {review.map((r) => (
              <Link
                key={r.itemId}
                href={`/item/${r.itemId}/claims`}
                className="flex items-center justify-between gap-3 rounded-card bg-surface p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{r.title}</p>
                  <p className="text-sm text-muted">
                    {r.pendingCount} {r.pendingCount === 1 ? "claim" : "claims"} to
                    review
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-on-soft">
                  Review
                </span>
              </Link>
            ))}

            {reminders.map((rem) => (
              <div
                key={rem.itemId}
                className="rounded-card bg-warning-bg p-4 shadow-sm"
              >
                <p className="font-semibold text-ink">{rem.title}</p>
                <p className="mt-1 text-sm text-warning">
                  Unclaimed for over a week. If you can&apos;t find the owner,
                  please hand it to the <strong>{rem.office}</strong>.
                </p>
                <p className="mt-1 text-xs text-muted">
                  Found at {rem.zone} · posted {timeAgo(rem.createdAt)}
                </p>
                <form action={markHandedToOffice} className="mt-3">
                  <input type="hidden" name="itemId" value={rem.itemId} />
                  <button
                    type="submit"
                    className="w-full rounded-btn border border-warning/40 bg-surface px-4 py-2.5 text-sm font-semibold text-warning hover:bg-warning/5"
                  >
                    I handed it over
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- My claims ---- */}
      {myClaims.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-muted">My claims</h2>
          <div className="mt-2 space-y-3">
            {myClaims.map((c) => (
              <div key={c.claimId} className="rounded-card bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/item/${c.itemId}`} className="min-w-0">
                    <p className="truncate font-semibold text-ink">{c.itemTitle}</p>
                    <p className="text-xs text-muted">Claimed {timeAgo(c.createdAt)}</p>
                  </Link>
                  <ClaimBadge status={c.status} />
                </div>
                {c.status === "accepted" && (
                  <Link
                    href={`/chat/${c.claimId}`}
                    className="mt-3 block rounded-btn bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Open chat{c.finderName ? ` with ${c.finderName}` : ""}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Returned ---- */}
      {returns.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-muted">Returned</h2>
          <div className="mt-2 space-y-3">
            {returns.map((r) => (
              <Link
                key={r.claimId}
                href={`/return/${r.claimId}`}
                className="flex items-center justify-between gap-3 rounded-card bg-surface p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{r.itemTitle}</p>
                  <p className="text-xs text-muted">
                    You were the {r.role}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    r.finalized
                      ? "bg-success-bg text-success"
                      : "bg-warning-bg text-warning"
                  }`}
                >
                  {r.finalized ? "Returned ✓" : "Pending"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ClaimBadge({ status }: { status: MyClaimStatus }) {
  const map: Record<MyClaimStatus, { label: string; cls: string }> = {
    pending: { label: "Waiting", cls: "bg-warning-bg text-warning" },
    accepted: { label: "Accepted", cls: "bg-success-bg text-success" },
    rejected: { label: "Not matched", cls: "bg-black/5 text-muted" },
    withdrawn: { label: "Withdrawn", cls: "bg-black/5 text-muted" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

type MyClaimStatus = "pending" | "accepted" | "rejected" | "withdrawn";
