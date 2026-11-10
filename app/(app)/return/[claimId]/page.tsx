import { notFound } from "next/navigation";
import Link from "next/link";
import { getReturnRecord } from "@/lib/returns";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

// Screen 9 — Return record.
export default async function ReturnRecordPage({
  params,
}: PageProps<"/return/[claimId]">) {
  const { claimId } = await params;
  const record = await getReturnRecord(claimId);
  if (!record) notFound();

  const answers = Object.entries(record.answers).filter(([, v]) => v);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">
      <Link href="/browse" className="text-sm font-medium text-muted">
        ← Browse
      </Link>

      <div className="mt-3 text-center">
        <div
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            record.finalized ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
          }`}
        >
          {record.finalized ? "Returned ✓" : "Awaiting claimant confirmation"}
        </div>
        <h1 className="mt-3 text-xl font-bold text-ink">Return record</h1>
        <p className="mt-1 font-mono text-sm text-muted">#{record.recordCode}</p>
      </div>

      {/* Steps */}
      <div className="mt-5 rounded-card bg-surface p-4 shadow-sm">
        <Step
          done
          label={`${record.finderName} marked it returned`}
          at={fmt(record.finderMarkedAt)}
        />
        <Step
          done={record.finalized}
          label={`${record.claimantName} confirmed receipt`}
          at={fmt(record.claimantConfirmedAt)}
        />
      </div>

      {/* Record card */}
      <div className="mt-4 rounded-card bg-surface p-4 shadow-sm">
        <dl className="space-y-2 text-sm">
          <Row label="Item" value={`${record.itemTitle} (${record.itemCategory})`} />
          <Row label="Found at" value={record.place} />
          <Row label="Posted" value={fmt(record.postedAt)} />
          <Row label="Finder" value={record.finderName} />
          <Row label="Claimant" value={record.claimantName} />
        </dl>

        {answers.length > 0 && (
          <div className="mt-4 border-t border-black/10 pt-3">
            <p className="text-xs font-semibold text-muted">Claim answers (saved)</p>
            <dl className="mt-2 space-y-2 text-sm">
              {answers.map(([k, v]) => (
                <Row key={k} label={k} value={v as string} />
              ))}
            </dl>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        This is a record of the handover between two students — a deterrent and a history,
        not legal proof of ownership.
      </p>
    </main>
  );
}

function Step({ done, label, at }: { done: boolean; label: string; at: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
          done ? "bg-success text-white" : "bg-black/10 text-muted"
        }`}
      >
        {done ? "✓" : "•"}
      </span>
      <div>
        <p className="text-sm text-ink">{label}</p>
        <p className="text-xs text-muted">{at}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
