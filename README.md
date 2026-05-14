# AgroShield

Trustless crop treatment marketplace for farmers and vendors. Includes AI-powered diagnosis (Gemini 2.0 Flash), Prisma + PostgreSQL, JWT auth, and Trustless Work escrow on Stellar testnet.

## Tech Stack

- Next.js 15 App Router (TypeScript)
- Prisma ORM + PostgreSQL
- Google Gemini 2.0 Flash (vision diagnosis)
- JWT auth (jose)
- bcryptjs (password hashing)
- Trustless Work REST API (testnet escrow)

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Trustless Work testnet API key
- Gemini API key
- Stellar wallet (Freighter) for signing XDR on the frontend

## Environment Variables

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_gemini_key
DATABASE_URL=your_postgres_url
JWT_SECRET=agroshield-jwt-secret-2026
TRUSTLESS_WORK_API_KEY=your_trustless_work_testnet_key
PLATFORM_WALLET_ADDRESS=GDEMO...your_platform_wallet
```

## Install

```
npm install
```

## Prisma Setup

```
npx prisma generate
npx prisma db push
```

## Run Locally

```
npm run dev
```

Open http://localhost:3000

## Core API Routes

Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

Diagnosis
- POST /api/diagnose

Cases
- POST /api/cases/create
- GET /api/cases
- GET /api/cases/[id]

Bids
- POST /api/bids/create
- GET /api/bids/[caseId]

Escrow (Trustless Work)
- POST /api/escrow/create
- POST /api/escrow/confirm
- POST /api/escrow/fund
- GET /api/escrow/status/[id]
- POST /api/escrow/release

Treatment Flow
- POST /api/mark-treatment-done
- POST /api/verify-treatment

Disputes
- POST /api/disputes/create
- GET /api/disputes/[id]
- POST /api/disputes/resolve

## Trustless Work Flow (Important)

Trustless Work returns unsigned XDR transactions. The backend returns these unsigned XDRs to the frontend. The frontend signs using Freighter and submits to Trustless Work /helper/send-transaction.

Escrow type used: SINGLE-RELEASE

Role mapping:
- Farmer = Depositor + Approver
- Vendor = Service Provider + Receiver
- Platform = Fee recipient + Dispute resolver

## Notes

- All passwords are stored as bcrypt hashes.
- JWTs expire after 7 days.
- Diagnosis data is stored as JSON string and parsed on read.
- Trustless Work errors fall back to a demo unsigned XDR so the demo can still proceed.
