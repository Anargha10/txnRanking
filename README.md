# Transaction Ranking System

A production-grade full-stack application built with **Next.js 15**, **TypeScript**, **TailwindCSS**, **Prisma**, and **PostgreSQL (Neon)**. It processes transactions, calculates fair user rankings, and serves a modern responsive frontend — all deployed on **Vercel**.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Ranking Formula](#ranking-formula)
- [Duplicate Prevention](#duplicate-prevention)
- [Concurrency Handling](#concurrency-handling)
- [Abuse Prevention](#abuse-prevention)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Limitations](#limitations)
- [License](#license)

---

## Project Overview

This platform allows users to submit transactions and receive a dynamically calculated rank based on a fair scoring algorithm. The system is designed to handle concurrent submissions, prevent duplicate transactions, and discourage abuse through carefully designed rate limits and ranking caps.

### Key Features

- **Atomic Transaction Processing**: All stats updates and score recalculations happen in a single database transaction.
- **Duplicate Prevention**: Database-level unique constraint on `transactionId` with `409 Conflict` response.
- **Fair Ranking**: Logarithmic volume scoring + capped activity scoring prevents manipulation.
- **Rate Limiting**: IP-based throttling prevents abuse (30 requests/minute).
- **Modern UI**: Responsive, polished interface with loading states, error handling, and success feedback.
- **Pagination**: Leaderboard supports pagination for large user bases.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS 3.4 |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 6 |
| Validation | Zod |
| Deployment | Vercel |

---

## Architecture

```
app/
├── api/
│   ├── transaction/route.ts      # POST /api/transaction
│   ├── summary/[userId]/route.ts # GET /api/summary/:userId
│   └── ranking/route.ts          # GET /api/ranking
├── page.tsx                      # Home (Transaction Form)
├── ranking/page.tsx              # Leaderboard page
├── summary/page.tsx              # User lookup page
├── layout.tsx                    # Root layout
└── globals.css                   # Tailwind + custom styles

components/
├── TransactionForm.tsx           # Transaction submission form
├── RankingTable.tsx              # Paginated leaderboard
├── UserSummary.tsx               # User stats lookup
└── Navbar.tsx                    # Navigation bar

lib/
├── prisma.ts                     # Prisma client singleton
├── ranking.ts                    # Score calculation algorithm
├── validation.ts                 # Zod schemas
├── api-response.ts               # Standardized API responses
└── rate-limit.ts                 # In-memory rate limiting

prisma/
├── schema.prisma                 # Database schema
└── seed.ts                       # Demo data seed script

types/
└── index.ts                      # Shared TypeScript interfaces
```

---

## Database Schema

### User

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | PK, auto-generated |
| `username` | String | Unique, indexed |
| `totalAmount` | Decimal(18,2) | Default 0 |
| `totalTransactions` | Int | Default 0 |
| `score` | Decimal(18,4) | Default 0 |
| `createdAt` | DateTime | Default now |
| `updatedAt` | DateTime | Auto-updated |

### Transaction

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | PK, auto-generated |
| `transactionId` | String | **Unique**, indexed |
| `amount` | Decimal(18,2) | > 0 |
| `type` | String | purchase, deposit, transfer, withdrawal |
| `userId` | UUID | FK → User(id) |
| `createdAt` | DateTime | Default now |

### Why `transactionId` must be unique

The `transactionId` is the external identifier provided by the client (e.g., `txn_123`). Making it unique at the database level:

1. **Guarantees idempotency** — submitting the same transaction twice always returns the same result (or a 409 Conflict).
2. **Prevents race conditions** — the database's unique constraint is the single source of truth, not application-level checks.
3. **Simplifies error handling** — Prisma throws `P2002` on duplicates, which we map cleanly to a `409` response.

---

## API Documentation

### POST /api/transaction

Creates a new transaction, updates user stats, and recalculates score.

#### Request Body

```json
{
  "transactionId": "txn_123",
  "username": "anargha",
  "amount": 500,
  "type": "purchase"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "uuid",
      "transactionId": "txn_123",
      "amount": "500.00",
      "type": "purchase",
      "userId": "uuid",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "user": {
      "userId": "uuid",
      "username": "anargha",
      "totalAmount": "1500.00",
      "totalTransactions": 3,
      "score": "1560.5000"
    }
  },
  "meta": { "timestamp": "2024-01-15T10:00:00Z" }
}
```

#### Error Responses

| Status | Code | Reason |
|--------|------|--------|
| 400 | `BAD_REQUEST` | Invalid JSON body |
| 422 | `UNPROCESSABLE_ENTITY` | Validation failed (Zod schema) |
| 409 | `CONFLICT` | Duplicate `transactionId` |
| 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

### GET /api/summary/:userId

Returns a user's summary and current rank.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "username": "anargha",
    "totalAmount": "1500.00",
    "totalTransactions": 3,
    "score": "1560.5000",
    "rank": 5
  },
  "meta": { "timestamp": "2024-01-15T10:00:00Z" }
}
```

---

### GET /api/ranking

Returns paginated user rankings ordered by score descending.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Results per page (max 100) |
| `offset` | integer | 0 | Skip N results |

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": "uuid",
        "username": "alice",
        "totalAmount": "25000.00",
        "totalTransactions": 50,
        "score": "3450.0000",
        "rank": 1
      }
    ],
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

---

## Ranking Formula

### Why not `score = totalAmount`?

A linear amount-only score has critical flaws:
- A single large transaction dominates the leaderboard.
- No incentive for engagement or consistent activity.
- Easy to game with one big deposit.

### Our Formula

```
volumeScore = log10(totalAmount + 1) * 500
activityScore = min(totalTransactions, 50) * 15
score = volumeScore + activityScore
```

### Breakdown

| Component | Purpose | Details |
|-----------|---------|---------|
| `volumeScore` | Rewards spending | Logarithmic scaling: $10 → ~500, $100 → ~1000, $1000 → ~1500, $10000 → ~2000. Prevents whale dominance. |
| `activityScore` | Rewards engagement | Hard cap at 50 transactions. Each transaction up to 50 adds 15 points. Prevents spam farming. |

### Example Scores

| User | Amount | Transactions | Volume | Activity | **Score** |
|------|--------|--------------|--------|----------|-----------|
| A | $100 | 5 | ~1000 | 75 | **1075** |
| B | $1,000 | 25 | ~1500 | 375 | **1875** |
| C | $10,000 | 50 | ~2000 | 750 | **2750** |
| D | $100 | 100 | ~1000 | 750 | **1750** (spam capped) |
| E | $0.01 | 1,000 | ~1 | 750 | **751** (micro-tx blocked) |

### Abuse Prevention in Ranking

1. **Logarithmic volume**: Prevents infinite score growth from large amounts.
2. **Activity cap**: Hard stop at 50 transactions prevents volume spam.
3. **Minimum amount**: Transactions must be > $0, and micro-transactions contribute almost nothing to volume score.

---

## Duplicate Prevention

### Strategy: Database-Level Unique Constraint

The `transactionId` field has a `@unique` constraint in Prisma:

```prisma
model Transaction {
  transactionId String @unique
}
```

### Why this is the correct approach

1. **Atomicity**: The database checks uniqueness in a single atomic operation. No race condition between "check" and "insert".
2. **No pre-check needed**: We do not query for duplicates before inserting. This eliminates the classic race window.
3. **Clean error mapping**: Prisma throws `P2002` on conflict, which we catch and map to HTTP `409 Conflict`.

### What NOT to do

```typescript
// ❌ BAD: Race condition vulnerable
const existing = await prisma.transaction.findUnique({ ... });
if (existing) return 409; // Another request could insert between check and insert
await prisma.transaction.create({ ... });
```

```typescript
// ✅ GOOD: Let the database enforce it
try {
  await prisma.transaction.create({ ... });
} catch (err) {
  if (err.code === "P2002") return 409;
}
```

---

## Concurrency Handling

### Problem: Lost Updates

Without proper isolation, concurrent requests for the same user can cause:
1. **Read the same totalAmount** (e.g., $1000).
2. **Both increment by $500**.
3. **One overwrites the other**, resulting in $1500 instead of $2000.

### Solution: Prisma `$transaction` with Serializable Isolation

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Create transaction record (locked by write)
  const transaction = await tx.transaction.create({ ... });

  // 2. Update user stats atomically using Prisma's increment operators
  const updatedUser = await tx.user.update({
    where: { id: user.id },
    data: {
      totalAmount: { increment: amount },
      totalTransactions: { increment: 1 },
    },
  });

  // 3. Recalculate score from updated values
  const newScore = calculateScore(
    updatedUser.totalAmount,
    updatedUser.totalTransactions
  );

  // 4. Write final score
  await tx.user.update({
    where: { id: user.id },
    data: { score: newScore },
  });
}, {
  isolationLevel: "Serializable",
  maxWait: 5000,
  timeout: 10000,
});
```

### Why this works

1. **Prisma `increment` operators**: These translate to SQL `SET totalAmount = totalAmount + $1`, which is inherently atomic. No read-modify-write race.
2. **Serializable isolation**: The database guarantees that concurrent transactions appear to execute sequentially, not interleaved.
3. **Transaction timeout**: If a transaction cannot acquire locks within 10 seconds, it rolls back and retries.

---

## Abuse Prevention

| Layer | Mechanism | Details |
|-------|-----------|---------|
| **Rate Limiting** | IP-based throttling | 30 requests per minute per IP. Returns `429 Too Many Requests` with `Retry-After` headers. |
| **Input Validation** | Zod schemas | Strict type checking, length limits, regex patterns, enum constraints. |
| **Transaction Amount** | Minimum floor | Must be > $0. Prevents zero-value abuse. |
| **Ranking Caps** | Activity ceiling | Max 50 transactions count toward score. Prevents micro-transaction spam. |
| **Username Normalization** | Lowercase + trim | Prevents username impersonation with case variations. |

---

## Setup Instructions

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd assignment
npm install
```

### 2. Set up Neon PostgreSQL database

1. Go to [https://neon.tech](https://neon.tech) and create a free account.
2. Create a new project and database.
3. Copy the connection string (it looks like `postgresql://user:password@host/dbname?sslmode=require`).

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Generate Prisma client and run migrations

```bash
# Generate Prisma client from schema
npm run db:generate

# Create and apply database migrations
npm run db:migrate

# (Optional) Seed demo data
npm run db:seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon) |
| `NEXT_PUBLIC_APP_URL` | No | Public URL of the app (used in metadata) |

---

## Deployment

### Vercel Deployment

1. **Push to GitHub**: Create a repository and push your code.

2. **Import to Vercel**:
   - Go to [https://vercel.com](https://vercel.com).
   - Click "Add New Project" and import your GitHub repo.

3. **Set Environment Variables**:
   - In the Vercel dashboard, go to **Settings → Environment Variables**.
   - Add `DATABASE_URL` with your Neon connection string.
   - Add `NEXT_PUBLIC_APP_URL` with your production domain.

4. **Configure Build Command** (Vercel auto-detects, but verify):
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. **Deploy**: Click "Deploy". Vercel will build and deploy your app.

6. **Post-Deploy Database Migration**:
   - After first deploy, run the migration from your local machine:
     ```bash
     npx prisma migrate deploy
     ```
   - Or add a Vercel deploy hook that runs `npm run db:deploy`.

### Prisma Migration Commands Reference

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create a new migration (dev environment)
npx prisma migrate dev --name <migration-name>

# Deploy pending migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio
```

---

## Limitations

1. **Rate Limiting**: The current implementation uses an in-memory store. In a multi-instance deployment (e.g., Vercel with multiple edge regions), this should be replaced with Redis or a distributed cache.
2. **Authentication**: There is no user authentication. All endpoints are public. Adding JWT or OAuth would be the next step for production.
3. **Pagination**: The ranking endpoint uses offset-based pagination. For very large datasets (millions of users), cursor-based pagination would be more performant.
4. **Caching**: Rankings are computed on every request. Adding Redis or Next.js ISR caching could improve performance significantly.
5. **Database Locking**: Serializable isolation is the safest but can reduce throughput under extreme concurrency. For higher throughput, consider optimistic locking with a `version` field on the User model.

---

## License

MIT License — built for demonstration and educational purposes.
