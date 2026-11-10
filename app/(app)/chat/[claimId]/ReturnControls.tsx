"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReturnState } from "@/lib/chat";
import { markReturned, confirmReceived } from "./return-actions";

export default function ReturnControls({
  claimId,
  isFinder,
  otherName,
  returnState,
}: {
  claimId: string;
  isFinder: boolean;
  otherName: string;
  returnState: ReturnState;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const finalized = returnState.exists && !!returnState.claimantConfirmedAt;

  function run(action: () => Promise<{ error?: string }>) {
    setError("");
    startTransition(async () => {
      const res = await action();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  // Finalized → both sides see the record link.
  if (finalized) {
    return (
      <Link
        href={`/return/${claimId}`}
        className="mt-2 block w-full rounded-btn bg-success-bg py-2 text-center text-sm font-semibold text-success"
      >
        Returned ✓ — view record
      </Link>
    );
  }

  // Finder marked it, waiting on the claimant.
  if (returnState.exists) {
    return isFinder ? (
      <p className="mt-2 text-center text-xs text-muted">
        Marked returned. Waiting for {otherName} to confirm.
      </p>
    ) : (
      <>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => confirmReceived(claimId))}
          className="mt-2 w-full rounded-btn bg-primary py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Confirming…" : "Confirm I got it back"}
        </button>
        {error ? <p className="mt-1 text-center text-xs text-danger">{error}</p> : null}
      </>
    );
  }

  // Not started yet.
  return isFinder ? (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => markReturned(claimId))}
        className="mt-2 w-full rounded-btn border border-black/10 py-2 text-sm font-semibold text-ink hover:bg-black/[0.03] disabled:opacity-60"
      >
        {pending ? "Marking…" : "Mark as returned"}
      </button>
      {error ? <p className="mt-1 text-center text-xs text-danger">{error}</p> : null}
    </>
  ) : (
    <p className="mt-2 text-center text-xs text-muted">
      After you meet, the finder marks it returned and you confirm.
    </p>
  );
}
