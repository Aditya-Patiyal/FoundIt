import { APP_NAME, APP_TAGLINE } from "@/lib/config";

// Step 0 placeholder "hello" page. Confirms the app runs, the design tokens
// load, and the PWA deploys. Real screens (README §8) start in later steps.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-card bg-surface p-8 shadow-sm">
        <p className="text-sm font-medium text-primary-on-soft">{APP_NAME}</p>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-ink">{APP_TAGLINE}</h1>
        <p className="mt-4 text-sm text-muted">
          Setup is working. This is the Step&nbsp;0 placeholder — the real screens come
          next.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-btn bg-primary px-3 py-2 text-sm font-medium text-white">
            Primary
          </span>
          <span className="rounded-btn bg-primary-soft px-3 py-2 text-sm font-medium text-primary-on-soft">
            Soft
          </span>
          <span className="rounded-btn bg-success-bg px-3 py-2 text-sm font-medium text-success">
            Success
          </span>
          <span className="rounded-btn bg-warning-bg px-3 py-2 text-sm font-medium text-warning">
            Warning
          </span>
        </div>
      </div>
    </main>
  );
}
