"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  APP_NAME,
  APP_TAGLINE,
  ALLOWED_EMAIL_DOMAIN,
  isCollegeEmail,
} from "@/lib/config";

type Status = "idle" | "sending" | "sent" | "error";

const STEPS = [
  "Find something? Post a photo and keep it with you.",
  "Lost something? Browse and prove it's yours.",
  "Match, chat, and meet in a public place to return it.",
];

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // UI-side domain gate (the database trigger is the real gate, README §11).
    if (!isCollegeEmail(email)) {
      setStatus("error");
      setError(`Please use your @${ALLOWED_EMAIL_DOMAIN} college email.`);
      return;
    }

    setStatus("sending");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });

    if (authError) {
      setStatus("error");
      setError("Couldn't send the link. Please try again in a minute.");
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-card bg-surface p-6 shadow-sm">
          <p className="text-sm font-semibold text-primary-on-soft">{APP_NAME}</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-ink">
            {APP_TAGLINE}
          </h1>

          {status === "sent" ? (
            <div className="mt-6 rounded-btn bg-success-bg p-4 text-sm text-success">
              <p className="font-semibold">Check your email</p>
              <p className="mt-1">
                We sent a sign-in link to <strong>{email}</strong>. Open it on this device
                to continue.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6">
              <label htmlFor="email" className="block text-sm font-medium text-ink">
                College email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder={`you@${ALLOWED_EMAIL_DOMAIN}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-btn border border-black/10 bg-white px-3 py-3 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />

              {status === "error" && error ? (
                <p className="mt-2 text-sm text-danger">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-4 w-full rounded-btn bg-primary px-4 py-3 font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-5 rounded-card bg-surface p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-ink">How it works</h2>
          <ol className="mt-3 space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-on-soft">
                  {i + 1}
                </span>
                <span className="text-sm text-muted">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-4 px-2 text-center text-xs text-muted">
          Only students with an @{ALLOWED_EMAIL_DOMAIN} email can sign in. We store your
          name, email and hostel block — nothing more.
        </p>
      </div>
    </main>
  );
}
