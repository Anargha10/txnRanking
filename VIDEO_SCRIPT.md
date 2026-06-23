# Video Script: Transaction Ranking System — Internship Submission

> **Duration:** 3–5 minutes  
> **Tone:** Professional, confident, technically precise  
> **Goal:** Demonstrate architecture, code quality, and engineering decisions

---

## Scene 1: Introduction & Project Overview (0:00–0:30)

**[Screen: Live deployed app on Vercel, showing the homepage]**

> "Hi, I'm presenting my Transaction Ranking System — a full-stack production application built with Next.js 15, TypeScript, Prisma, and PostgreSQL on Neon, deployed on Vercel."

> "The system handles three core operations: submitting transactions, looking up user summaries, and displaying a ranked leaderboard. Beyond the features, this project demonstrates atomic concurrency handling, duplicate prevention, fair ranking algorithms, and abuse-resistant API design."

**[Click through: Home → Ranking → Summary pages]**

---

## Scene 2: Architecture & Tech Stack (0:30–1:00)

**[Screen: VS Code folder tree / architecture diagram]**

> "Let me walk through the architecture. I used Next.js 15 with the App Router, which means every page is server-rendered by default and API routes are co-located in the app directory."

> "The stack is intentionally lean: TypeScript for type safety, TailwindCSS for styling, Prisma as the ORM, and Zod for input validation. There's no separate backend server — everything runs through Next.js Route Handlers."

> "Key directories: `app/api/` contains the three route handlers, `components/` holds the React UI, `lib/` has shared utilities including the ranking algorithm, and `prisma/` defines the database schema."

**[Highlight: app/api/transaction/route.ts, lib/ranking.ts, prisma/schema.prisma]**

---

## Scene 3: Prisma Schema & Database Design (1:00–1:30)

**[Screen: prisma/schema.prisma]**

> "The database has two core models: User and Transaction. The User stores aggregates — totalAmount, totalTransactions, and the precomputed score."

> "The Transaction model stores every individual transaction, and critically, the `transactionId` field is marked as `@unique`. This is the foundation of our duplicate prevention strategy."

> "Why precompute the score on the User instead of calculating it on every ranking request? Because for large datasets, a live calculation would be O(n log n) or worse. Storing the score as a materialized value makes ranking queries O(1) per user — we just sort by score descending."

---

## Scene 4: API Routes & Validation (1:30–2:15)

**[Screen: app/api/transaction/route.ts]**

> "The POST /api/transaction route is the most complex. It accepts a JSON payload, validates it with Zod, and returns precise HTTP status codes: 400 for bad JSON, 422 for validation failures, 409 for duplicates, and 429 for rate limits."

> "Let me show the validation in action."

**[Screen: Browser — submit a transaction with missing fields, show 422 error. Submit with duplicate transactionId, show 409 error.]**

> "Zod enforces strict rules: transactionId must be alphanumeric, amount must be positive and finite, and type must be one of the allowed enum values. This prevents garbage data from ever reaching the database."

---

## Scene 5: Concurrency Handling (2:15–3:00)

**[Screen: app/api/transaction/route.ts, zoomed into the prisma.$transaction block]**

> "Now, the most critical part: concurrency. When two requests for the same user arrive simultaneously, we have a classic race condition. If both read the user's totalAmount as 1000, then both add 500, the final amount could be 1500 instead of 2000."

> "I solve this with Prisma's `$transaction` using Serializable isolation. Inside the transaction, I don't read-modify-write. Instead, I use Prisma's atomic increment operators: `{ increment: amount }`. This translates to SQL `SET totalAmount = totalAmount + $1`, which is inherently atomic at the database level."

> "After incrementing, I recalculate the score from the updated values and write it back. The entire block is wrapped in Serializable isolation, meaning the database guarantees these transactions execute as if they were sequential, not interleaved."

> "I also set a 10-second timeout and a 5-second max wait for lock acquisition, so slow transactions don't hang forever."

---

## Scene 6: Ranking Fairness & Abuse Prevention (3:00–3:45)

**[Screen: lib/ranking.ts]**

> "The ranking formula is designed to be fair and manipulation-resistant. I deliberately avoided `score = totalAmount` because that would let a single whale deposit dominate the leaderboard with no incentive for engagement."

> "Instead, the score has two components:"

> "Volume score uses logarithmic scaling: `log10(totalAmount + 1) * 500`. This means more money helps, but with diminishing returns. $10 gives ~500 points, $100 gives ~1000, $1000 gives ~1500, and $10,000 gives ~2000. It rewards spenders without letting them run away infinitely."

> "Activity score is `min(totalTransactions, 50) * 15`. The hard cap at 50 transactions is crucial — it prevents someone from farming the leaderboard with a thousand tiny $0.01 transactions."

> "Combined, a user with $100 and 5 transactions scores about 1075. A user with $100,000 and 50 transactions scores about 2750. The formula balances wealth and engagement while being nearly impossible to game."

---

## Scene 7: Duplicate Prevention Strategy (3:45–4:15)

**[Screen: prisma/schema.prisma showing @unique, then app/api/transaction/route.ts showing P2002 catch]**

> "For duplicate prevention, I rely on the database's unique constraint, not an application-level check. The classic anti-pattern is: query for existence, then insert. That has a race condition — two requests can both see 'not exists' and both insert."

> "The correct approach is: just try to insert, and let the database enforce uniqueness. If Prisma throws a P2002 error, I catch it and return a clean 409 Conflict with the transaction ID in the message. This is atomic, race-free, and requires zero extra queries."

---

## Scene 8: Deployment & Closing (4:15–4:45)

**[Screen: Vercel dashboard, live site, then Neon dashboard]**

> "The app is deployed on Vercel with a Neon PostgreSQL database. The connection string is stored as an environment variable. I used Prisma Migrate to set up the schema, and the seed script pre-populated demo data for testing."

> "The ranking page is live, the API endpoints are public, and the transaction form is fully functional. You can submit a transaction, watch the score update, and see the leaderboard reorder in real time."

> "Thank you for reviewing this project. The full source code, README, and architecture documentation are in the repository. I'd be happy to discuss any of the design decisions in more detail."

---

## Quick Reference: Key Talking Points

- **No Express, no separate backend** — pure Next.js App Router with Route Handlers.
- **Atomic everything** — Prisma `$transaction` with `Serializable` isolation.
- **Race-free duplicates** — Database `@unique` constraint, not application checks.
- **Fair ranking** — Logarithmic volume + capped activity, no linear abuse.
- **Production touches** — Rate limiting, Zod validation, standardized API responses, pagination, error states, loading states.

