import Link from "next/link";

// Shown when a sign-in link is expired, already used, or invalid.
export default function AuthCodeError() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-card bg-surface p-6 text-center shadow-sm">
        <h1 className="text-lg font-bold text-ink">That link didn&apos;t work</h1>
        <p className="mt-2 text-sm text-muted">
          Sign-in links can only be used once and expire after a while. Please request a
          fresh one.
        </p>
        <Link
          href="/sign-in"
          className="mt-5 inline-block w-full rounded-btn bg-primary px-4 py-3 font-semibold text-white hover:opacity-95"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
