# FoundIt (working name: "Wapas"): campus lost and found for Manipal University Jaipur

> **Read this first, Claude Code.** This README is the full brief for the project: what we're building, why, the decisions already made, the data model, the screens, the build order and what is still undecided. Follow it. Where it says "open question", ask the owner instead of guessing. Last updated 5 Nov 2026.

---

## 1. One-paragraph summary

A free, student-run web app (installable PWA) for **Manipal University Jaipur (MUJ)**. Anyone who **finds** an item posts a photo and description and **keeps the item with them**. Anyone who **lost** something browses the listings, presses **"This is mine"**, and answers a few questions that only the real owner could answer. The finder compares the answers with a **private note** (only the finder sees it), accepts or rejects, and then both chat inside the app and meet in a public place. Both confirm the handover, and the app stores a **return record**. If nobody claims an item within **7 days**, the finder is reminded to hand it over to the official lost-and-found office. There is **no college involvement, no admin coordination and no payment**.

## 2. Owner, constraints and working style

- **Owner:** a MUJ student who can code ("yes I can and I have" the tools). Time is not a constraint ("no limit").
- **Free only.** Free tiers and open-source tools. Ask before adding anything that costs money.
- **No college/admin/security-desk involvement.** Do not design flows that need the college's help. The only link to officials is a *reminder* to the finder to hand unclaimed items to them.
- **Student project, not a business.** No pricing, no revenue features.
- **App name is not decided.** Use "Wapas" as a placeholder everywhere and keep it in ONE config constant so it's easy to change. (Do not use "FoundIt": foundit.in is Monster India's job site, rebranded in 2022.)
- **College email domain is unknown.** Keep it in an env var `ALLOWED_EMAIL_DOMAIN` (placeholder `[college email domain]`). Ask the owner.
- **Style:** short explanations, simple code, no over-engineering. One person maintains this, possibly handing it to a junior later, so keep it readable and documented.

## 3. Campus context (from the owner)

- Hostel is directly opposite the college. About **15,000 students**.
- **Hostel side:** ~**12 blocks**, each **8 to 10 floors**. Lost things found by hostel staff go to a **Hostel Lost & Found office**.
- **Campus side:** ~**5 academic blocks**, plus cafeteria, gym, main gate. Items found by campus staff go to a **Lost & Found desk at the main gate**.
- **How it works today:** students post descriptions in random WhatsApp groups and hope. Or they walk to the hostel office / main-gate desk and check.
- **Hand-over rule for unclaimed items:** found in the hostel → Hostel Lost & Found office. Found on campus → main gate Lost & Found desk.
- Exact names of the 5 academic blocks and the hostel block list are **open questions**; seed placeholders "Hostel Block 1 to 12" and "Academic Block 1 to 5".

## 4. How we got here (decision history)

1. The owner shared a PDF with four startup ideas (Subscription Cemetery, Confession Wall, Settle This Debate, FoundIt). Ranking after analysis: **FoundIt > Settle This Debate > Subscription Cemetery > Confession Wall**. FoundIt won on a clear daily pain, a bounded campus, and a feasible build with Claude Code.
2. A full research and build report was written (Claude Docs: https://claude.ai/artifact/2vRCQ5gwyiNC9ftbKqdUdn, a PDF copy was sent to the owner). **That report assumed the security desk would be the hub**, with QR posters, desk-only release and a claim code.
3. **The design then changed.** The owner wants **no college or desk involvement** and the **finder keeps the item**. So the desk-hub, QR-poster, claim-code and desk-release ideas from the report are **dropped from v1**. Where the report and this README disagree, **this README wins**.
4. A similar-but-different idea (a hostel/campus issue tracker) was suggested as an alternative. The owner chose to build **FoundIt**.

## 5. Scope

### In v1
- Sign in with **college email only** (passwordless email link).
- **Post a found item:** photo(s), category, title, public description, **private details**, location (zone dropdown + optional spot), time found, "where is it now".
- **Browse and search** found items: text search + category + location filters, newest first.
- **Item detail** page.
- **Claim an item:** "This is mine" → questions → sent to the finder.
- **Finder reviews claims**, compares with the private note, accepts / rejects.
- **In-app chat** between finder and accepted claimant. No phone numbers exposed.
- **Return flow:** finder marks returned → claimant confirms → **return record** saved.
- **Activity screen:** claims needing action, my claims, returned items, 7-day reminders.
- **7-day reminder** to finders of unclaimed items to hand them to the official office, with a "I handed it over" button.
- **Safety:** report, block, rate-limit claims, auto-pause after repeated reports.
- **Notifications:** email + browser/phone push (PWA).
- **Email alerts** ("tell me when a matching item is posted"). *Optional; added in the mockup, confirm with the owner before building.*

### Explicitly NOT in v1
- WhatsApp notifications (costs money, see §10).
- AI photo matching / embeddings (see §14, a possible later phase).
- Maps (use dropdown zones instead).
- "Lost" posts (people posting what they lost). v1 is found-items-only.
- Any admin/college dashboard or security-desk flow.
- Image blurring (owner said not now; the UI only warns finders not to show ID/card numbers).
- Native apps / app stores.
- Payments or ads.

## 6. User flows

### Finder
1. Sign in → **Post found** → add photo(s), category, title, public description, **private details**, location, time, "With me".
2. Item goes live. The finder keeps the item.
3. When someone claims it, the finder gets a notification → **Review claims** → compares answers with the private note → **Looks right, open chat** / **Doesn't match** (or asks a follow-up first).
4. Chat, meet in a public place, hand over → **Mark as returned**.
5. Claimant confirms → **return record** created.
6. If nobody claims within **7 days** → reminder to hand it to the Hostel L&F office (hostel-side finds) or main gate desk (campus-side finds) → finder taps **I handed it over** → item status `handed_to_office`.

### Owner (person who lost something)
1. Sign in → **Browse** (search/filter) → open an item.
2. **This is mine** → answer questions (where lost, when, what's inside/what it looks like, one detail only the owner knows, optional older photo/receipt) → **Send to finder**.
3. Wait → if accepted, a chat opens → meet → confirm receipt.
4. Optional: **Set an alert** for items not yet posted.

## 7. Verification and anti-fraud design (this was researched; keep it)

Principle (from the research): the check should be one *"the true owner should know easily and a random claimant should not"*, and **the person holding the item verifies it, not the platform.**

1. **Public vs private split.** The finder fills a public description AND a separate **private details** field (e.g. wallpaper on a phone, what's inside a bag, a sticker under a case). Private details are **never** shown to anyone but the finder.
2. **Claim questions gate the chat.** The claimant must answer questions *before* a chat opens. Only the finder sees the answers. (Also blocks random "is this mine?" spam.)
3. **Never assume the first responder is the owner.** If several people claim, the finder sees all answers side by side.
4. **Don't share sensitive numbers.** UI warns claimants not to type card / Aadhaar / ID numbers (same rule iLost uses).
5. **Two-sided confirmation + return record.** Finder marks returned; claimant confirms. The record stores: item, finder, claimant, claim answers, timestamps, confirmation by both. It is a **deterrent and a history**, not proof of ownership. Say so in the UI (the mockup does).
6. **Abuse controls:** report button, block button, **max 3 open claims per user per day**, auto-pause an account after **N reports from distinct users** (N = 3 is a placeholder; owner to decide), paused accounts can't claim or post until reviewed.
7. **Safe handover guidance in-app:** meet in public places during daytime (cafeteria, library, main gate), not in rooms; phone numbers hidden unless a user shares them.
8. **Known limits (be honest in docs):** a dishonest claimant can still lie; a dishonest finder can keep the item; the owner is the only moderator. For serious cases (harassment, theft) the owner decides whether to involve the college. That's their call, not a requirement of the app.

## 8. Screens (interface v1)

A clickable mockup exists (private to the owner): https://claude.ai/artifact/NrQFrRRXcGk17s2PHV2Tmr — 11 phone screens (390×844). If you can't open it, use this spec. **Mobile-first.** The same layout should work responsively on laptops.

| # | Screen | What's on it |
|---|--------|--------------|
| 1 | **Sign in** | Headline "Lost it? Found it? Get it back to its owner." College-email field, "Email me a sign-in link", 3-step "How it works", privacy note. |
| 2 | **Browse** | Wordmark, notification bell, search box, category chips (All, Phones, ID cards, Wallets, Keys, Bags, Bottles, Chargers, Books, Other), location filter + sort, item cards (photo, title, place, category chip, time), "Set an alert" card, bottom tab bar. |
| 3 | **Item detail** | Photo, chips (category, "Finder is holding it"), title, place, time, "Posted by a verified MUJ student" (name hidden until the finder accepts), public description, how-claiming-works box, 7-day note, **This is mine**, Report this listing. |
| 4 | **Prove it's yours** | Item mini-row; where lost (dropdown), when, what's inside (textarea, "don't type card/Aadhaar/ID numbers"), one detail only you'd know, optional photo/receipt, privacy note + 3 claims/day, **Send to finder**. |
| 5 | **Post a found item** | Photo (up to 3), category chips, title, public description, where found (dropdown) + spot, when, **Private details (only you can see this)**, "Where is it now?" (With me / Already handed to an office), **Post item**, 7-day note. |
| 6 | **Activity** | "Needs you" (claims to review, 7-day hand-over reminders with the office mapping and **I handed it over**), "My claims" (Waiting / Accepted + Open chat), "Returned" (links to record). |
| 7 | **Review claims** | Finder's private note on top, tip to compare, one card per claimant (name, block, time, their answers) with **Looks right, open chat** / **Doesn't match** / **Ask a follow-up**, report link. |
| 8 | **Chat** | Header (name, item), safety banner (public place, daytime, not rooms), messages, meeting-spot quick chips, input, **Mark as returned**. |
| 9 | **Return record** | Confirmation steps with timestamps, record card (ID, item, found place/time, finder, claimant, handed-over time, confirmed by both, answers saved), disclaimer that it's a record not proof. |
| 10 | **Report or block** | Bottom sheet: reason list (fake claim, rude messages, not as described, spam, other), optional details, "Also block this person", **Send report**. |
| 11 | **Me** | Profile, hostel block, notification toggles (email, phone push, WhatsApp greyed "coming later"), my alerts, blocked people, sign out, delete account and data. |

**Visual style used in the mockup:** font Figtree; ground `#F4F5F7`, surface `#FFFFFF`, ink `#11151C`, muted `#566070`, primary blue `#1D4ED8` (soft `#E7EDFE`, text on soft `#1A3FB0`), success `#0B5D33` on `#E1F3E8`, warning `#7A4100` on `#FFF1D6`, danger `#B3261E`. Cards radius 16, buttons radius 12 to 14, tap targets ≥ 44 px, text contrast ≥ 4.5:1, real `<label>`/`<button>`/`<a>` elements, no emoji.

## 9. Recommended stack (all free tiers)

| Layer | Choice | Notes |
|-------|--------|-------|
| Front end | **Next.js (App Router) + TypeScript + Tailwind**, built as a **PWA** (manifest + service worker) | One codebase, installs to home screen, no app stores. |
| Backend / DB | **Supabase**: Postgres, Auth, Storage, Realtime, Row Level Security | Replaces separate Mongo/Firebase. |
| Chat | **Supabase Realtime** on a `messages` table | Keep chat per claim. |
| Images | Supabase Storage; **compress client-side** before upload (e.g. max ~1280 px, ~200 KB) | Free tier storage is small. |
| Search | Postgres full-text search + category/location filters | No AI in v1. |
| Email | Free-tier transactional provider via custom SMTP / API (e.g. Resend or Brevo; **verify current limits**) | Needed for sign-in links and notifications. |
| Push | Web Push (VAPID) with a service worker | iOS needs iOS 16.4+ **and** "Add to Home Screen". |
| Scheduled jobs | Supabase `pg_cron` (or a free scheduled function) | For the 7-day reminders and cleanup. |
| Hosting | **Vercel Hobby** (free; non-commercial use only, fine for this student project) or Cloudflare Pages | Move if it ever becomes commercial. |
| Maps | **None** | Zone dropdown instead. OSM's public tile servers are not suitable for production use. |

**Free-tier facts to plan around (verify before launch):**
- Supabase Free: ~500 MB database, ~1 GB file storage, and projects **pause after about a week of inactivity** (plan a keep-alive ping or accept it during exams/holidays). Pro is $25/month if ever needed.
- Supabase's built-in email sender is only meant for testing and is heavily rate-limited, so **set up custom SMTP before the pilot**. *(From memory; confirm in Supabase docs.)*
- ~15,000 students × photos adds up fast: enforce image compression, a max of 3 photos per item, and delete old listings (see §12).

## 10. Notifications: why not WhatsApp

- The official **WhatsApp Business API** now charges for utility template messages (Meta began charging on **1 Oct 2026**), plus a platform-provider fee and GST. Only approved templates can be sent outside the 24-hour window. Rupee rates were not confirmed.
- **Unofficial WhatsApp bots** (QR-linked) break WhatsApp's terms; bans attach to the number, sometimes permanently.
- **Decision:** v1 = **email + web push**. WhatsApp is shown as "coming later" in settings. A Telegram bot is a possible free future option (**unverified**, check before building).

Notification events: new claim on my item; my claim accepted / rejected; new chat message; return confirmation requested; item returned; 7-day hand-over reminder; matching alert.

## 11. Data model (Postgres / Supabase)

Use RLS on every table. Key rule: **private details live in their own table** so RLS can guarantee only the finder reads them.

```
profiles        id (= auth.users.id), display_name, college_email, hostel_block,
                status ('active'|'paused'), created_at
items           id, finder_id → profiles, title, category, public_description,
                zone, spot, found_at, holding ('with_finder'|'at_office'),
                status ('open'|'claim_pending'|'returned'|'handed_to_office'|'expired'),
                photo_paths text[], reminder_sent_at, created_at
item_private    item_id (pk, → items), private_details      -- finder-only via RLS
claims          id, item_id, claimant_id, lost_zone, lost_when_text,
                contents_answer, secret_answer, proof_photo_path,
                status ('pending'|'accepted'|'rejected'|'withdrawn'),
                created_at, decided_at                       -- visible to finder + claimant only
messages        id, claim_id, sender_id, body, created_at    -- only parties of an accepted claim
returns         id, item_id, claim_id, finder_id, claimant_id,
                finder_marked_at, claimant_confirmed_at,
                answers_snapshot jsonb, record_code           -- immutable once both confirmed
reports         id, reporter_id, target_user_id, item_id, claim_id, reason, details,
                status ('open'|'reviewed'), created_at
blocks          blocker_id, blocked_id, created_at           -- pk (blocker_id, blocked_id)
alerts          id, user_id, category, keywords, created_at
push_subscriptions  id, user_id, endpoint, keys jsonb
```

**Enforce in the database, not just the UI:**
- Sign-up allowed only for emails ending in `ALLOWED_EMAIL_DOMAIN` (Auth hook / trigger).
- Claimants cannot read `item_private`; only the item's finder can.
- A finder's name is hidden from the claimant until the claim is `accepted`; the claimant's name is visible to the finder when a claim is sent.
- Max **3 open claims per user per day** (check in an RPC / trigger).
- A user can't claim their own item; blocked users can't claim or message each other.
- `returns` rows can't be edited after both confirmations; claim answers are snapshotted into the record.
- Paused profiles can't insert items, claims or messages.

## 12. Retention and privacy (DPDP)

- India's **DPDP Rules** were notified on 13 Nov 2025; core duties apply from **13 May 2027**. A student project still collects personal data, so be minimal and honest.
- Store only: name, college email, hostel block, item/claim/chat data, return records. No phone numbers, no ID numbers.
- Provide **Delete my account and data** (in the mockup under Me).
- Retention suggestions (owner to confirm): delete unclaimed listings and photos ~30 days after `handed_to_office`; keep return records for a limited period (e.g. 1 year) then anonymise.
- A privacy page in plain language: what's stored, who sees what, how to delete.
- Many students are adults, but if under-18 users are possible, the DPDP rules need verifiable parental consent. **Open question** for the owner.
- Report breaches promptly (72-hour reporting window in the rules).

## 13. Build order (each step has a "done when")

0. **Setup** — repo, Next.js + TS + Tailwind, Supabase project, env vars, lint/format, README stays updated. *Done when:* app runs locally and deploys a hello page.
1. **Auth** — email link sign-in restricted to the college domain; profile row + hostel block. *Done when:* a non-college email is rejected and a college email signs in.
2. **Post + browse + detail** — items, photos with compression, public/private split with RLS, search + filters. *Done when:* a second account can see the public data but **cannot** read the private field (test it).
3. **Claim + review** — claim form, gating, finder review screen, accept/reject, 3-claims/day limit. *Done when:* the full claim → accept path works and limits are enforced server-side.
4. **Chat** — realtime messages per accepted claim, safety banner, meeting-spot chips. *Done when:* two browsers can chat live and an outsider can't read it.
5. **Return record** — mark returned → confirm → immutable record. *Done when:* a record is created only after both confirm.
6. **Activity + reminders + notifications** — Activity screen, 7-day cron, email + web push, "I handed it over". *Done when:* a test item 7 days old (fake the date) triggers the reminder.
7. **Safety** — report, block, auto-pause threshold, paused-account enforcement. *Done when:* the threshold pauses an account and blocks its actions.
8. **Polish and pilot** — PWA install, empty/error states, seed data, accessibility pass, privacy page, a short "how to use" for hostel WhatsApp groups. *Done when:* the owner can onboard the first ~50 students.

Test the RLS rules and the claim/return state machine with automated tests; everything else can be lightly tested.

## 14. Possible later phases (not now)

- **AI matching:** embed item photos + text (e.g. Gemini Embedding 2, or open SigLIP-2) and store vectors with `pgvector` to suggest likely matches. Use it as a *shortlist* only, shown as "Strong / Possible", never as a percentage. Cost from earlier research: about $0.0001 per image (unverified). Not needed until listings are many.
- "Lost" posts so owners can describe what they lost.
- Telegram or paid WhatsApp notifications.
- Photo blurring for IDs/faces.
- Handing over the admin role to a junior or a campus club.

## 15. Rollout idea

Start with **one hostel block** or a friend group, then expand. Get the first ~50 users through hostel WhatsApp groups and posters with a QR code that opens the web app. Collect feedback on: is posting fast enough, are claim questions annoying, are people meeting safely, do finders actually reply.

## 16. Open questions for the owner

1. App name (placeholder "Wapas").
2. College email domain.
3. Real names of the 5 academic blocks and the full hostel block list.
4. Report threshold for auto-pausing an account (placeholder 3).
5. Are under-18 users possible?
6. Keep the "Set an alert" email feature in v1, or drop it?
7. Retention periods (listing photos, return records).
8. What to do with serious reports (harassment, theft): handle alone, or tell the college?

## 17. Sources and what is unverified

**Used for the verification design:** iLost, "How to prove you are the owner of an item" (https://support.ilost.co/en/articles/341047-how-to-prove-you-are-the-owner-of-an-item); Lost & Found blog, "Found a phone, wallet or keys? How to return it safely" (https://lostandfound-blog.pages.dev/found-a-phone-wallet-or-keys-how-to-return-it-safely); Lost & Found Software, "Securing lost property: automated fraud prevention" (https://medium.com/lost-and-found-software/securing-lost-property-automated-fraud-prevention-dfbd8937d4f2, promotional, used only for fraud patterns).

**Used for WhatsApp:** Baat, "What the WhatsApp Business API costs in India (2026)" (https://baat.ai/blog/whatsapp-api-pricing-india); Drag, WhatsApp unofficial vs official tools (https://www.dragapp.com/blog/whatsapp-mcp-server/; the company sells a product on the official route).

**Full research report:** https://claude.ai/artifact/2vRCQ5gwyiNC9ftbKqdUdn (contains the earlier market, competitor and legal research, with its own Sources section).

**Not verified / from memory:** Telegram bot being free; Supabase default email limits; the per-image embedding cost; exact free-tier numbers for Resend/Brevo; Vercel Hobby limits. Check each before depending on it.

## 18. Instructions for Claude Code when working in this repo

- Start by reading this file. Then ask the owner the open questions you actually need for the step you're on; don't ask all at once.
- Work in the order in §13. Finish and verify one step before the next.
- Keep the app name and email domain in config/env, never hard-coded.
- Never put private details in any client-visible query. Enforce visibility with RLS and test it.
- Use free services only. If something needs a paid plan, stop and ask.
- Keep the UI faithful to §8 (mobile-first, accessible, plain language).
- Keep this README current: when a decision changes, edit the relevant section and note it in §4.
