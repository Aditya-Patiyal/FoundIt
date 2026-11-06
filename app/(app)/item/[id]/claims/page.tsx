import { notFound } from "next/navigation";
import Link from "next/link";
import { getFinderReview, type ClaimForReview } from "@/lib/claims";
import { photoPublicUrl } from "@/lib/photos";
import { timeAgo } from "@/lib/time";
import { decideClaim } from "./actions";

// Screen 7 — Review claims (finder only).
export default async function ReviewClaimsPage({
  params,
}: PageProps<"/item/[id]/claims">) {
  const { id } = await params;
  const review = await getFinderReview(id);
  if (!review) notFound(); // not the finder, or no such item

  const pending = review.claims.filter((c) => c.status === "pending");
  const decided = review.claims.filter((c) => c.status !== "pending");

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">
      <Link href={`/item/${id}`} className="text-sm font-medium text-muted">
        ← Back
      </Link>
      <h1 className="mt-3 text-xl font-bold text-ink">Review claims</h1>
      <p className="mt-1 text-sm text-muted">{review.title}</p>

      {/* The finder's private note, pinned on top to compare against. */}
      <div className="mt-4 rounded-card bg-warning-bg p-4 text-sm text-warning">
        <p className="font-semibold">Your private note</p>
        <p className="mt-1 whitespace-pre-wrap">
          {review.privateDetails || "You didn't add a private detail for this item."}
        </p>
        <p className="mt-2 text-xs">
          Accept a claim only if the answers match this. Meet in a public place.
        </p>
      </div>

      {review.claims.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">No claims yet.</p>
      ) : null}

      {pending.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-ink">Needs you ({pending.length})</h2>
          <div className="mt-3 space-y-3">
            {pending.map((c) => (
              <ClaimCard key={c.id} claim={c} actionable />
            ))}
          </div>
        </section>
      )}

      {decided.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-ink">Decided</h2>
          <div className="mt-3 space-y-3">
            {decided.map((c) => (
              <ClaimCard key={c.id} claim={c} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ClaimCard({
  claim,
  actionable = false,
}: {
  claim: ClaimForReview;
  actionable?: boolean;
}) {
  return (
    <div className="rounded-card bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink">
          {claim.claimant_display_name || "A student"}
        </p>
        <span className="text-xs text-muted">{timeAgo(claim.created_at)}</span>
      </div>
      {claim.claimant_block ? (
        <p className="text-xs text-muted">{claim.claimant_block}</p>
      ) : null}

      <dl className="mt-3 space-y-2 text-sm">
        <Answer label="Where lost" value={claim.lost_zone} />
        <Answer label="When" value={claim.lost_when_text} />
        <Answer label="Looks like / inside" value={claim.contents_answer} />
        <Answer label="Detail only they'd know" value={claim.secret_answer} />
      </dl>

      {claim.proof_photo_path ? (
        <a
          href={photoPublicUrl(claim.proof_photo_path)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-medium text-primary"
        >
          View attached photo
        </a>
      ) : null}

      {actionable ? (
        <div className="mt-4 flex gap-2">
          <form action={decideClaim} className="flex-1">
            <input type="hidden" name="claimId" value={claim.id} />
            <input type="hidden" name="decision" value="accept" />
            <button
              type="submit"
              className="w-full rounded-btn bg-primary px-3 py-2.5 text-sm font-semibold text-white hover:opacity-95"
            >
              Looks right
            </button>
          </form>
          <form action={decideClaim} className="flex-1">
            <input type="hidden" name="claimId" value={claim.id} />
            <input type="hidden" name="decision" value="reject" />
            <button
              type="submit"
              className="w-full rounded-btn border border-black/10 px-3 py-2.5 text-sm font-semibold text-ink hover:bg-black/[0.03]"
            >
              Doesn&apos;t match
            </button>
          </form>
        </div>
      ) : (
        <p
          className={`mt-3 text-sm font-semibold ${
            claim.status === "accepted" ? "text-success" : "text-muted"
          }`}
        >
          {claim.status === "accepted"
            ? "Accepted"
            : claim.status === "rejected"
              ? "Rejected"
              : "Withdrawn"}
        </p>
      )}
    </div>
  );
}

function Answer({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="whitespace-pre-wrap text-ink">{value}</dd>
    </div>
  );
}
