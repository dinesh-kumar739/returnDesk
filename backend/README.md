# ReturnDesk

A returns desk for a small online store. Agents raise return requests, work them through a fixed lifecycle, add notes, and decide on a refund, replacement or store credit.

- **Live app:** https://return-desk-inky.vercel.app
- **API:** https://returndesk-nii6.onrender.com
- **Time spent:** roughly 9 hours

The API is on Render's free tier and sleeps when idle. The first request can take 30 to 60 seconds.

## Stack

Next.js (App Router) + Tailwind CSS, Node.js + Express, PostgreSQL (Neon) with raw SQL through `pg`, Zod for validation. JavaScript throughout.

## Run locally

Needs Node.js 20+ and a PostgreSQL database (a free Neon project works).

```bash
git clone https://github.com/dinesh-kumar739/returnDesk.git
cd returnDesk/backend
npm install
cp .env.example .env        # set DATABASE_URL
npm run db:migrate
npm run db:seed
npm run dev                 # http://localhost:4000
```

In a second terminal:

```bash
cd returnDesk/frontend
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:3000
```

On Windows PowerShell use `Copy-Item` instead of `cp`.

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | Postgres connection string |
| `PORT` | backend | API port, default 4000 |
| `FRONTEND_URL` | backend | Allowed CORS origin. Empty allows all (local use) |
| `NEXT_PUBLIC_API_URL` | frontend | API base URL, e.g. `http://localhost:4000/api` |

`db:migrate` builds the database from empty. `db:seed` wipes both tables and inserts 39 requests (37 live, 2 removed) across every status and reason, with notes. Run it only on a demo database.

## Business rules

All five rules are enforced on the server, with database constraints underneath.

| Rule | How |
|---|---|
| Status flow (Open, In Review, Approved or Rejected, Completed) | One atomic `UPDATE ... WHERE status = ANY(legal sources)`. Illegal move returns `409 ILLEGAL_TRANSITION` |
| Approval needs a resolution, refund needs an amount above zero, no amount otherwise | Zod validation (`422`) plus `CHECK` constraints |
| One live request per item on an order | Partial unique index on `(order_number, item_sku)`, returns `409 DUPLICATE_LIVE_REQUEST` |
| Locked once decided | Edit only matches Open or In Review rows, otherwise `409 REQUEST_LOCKED`. Notes are always allowed |
| Removal keeps the record | Sets `deleted_at`. Only Open or Rejected, otherwise `409 REMOVAL_NOT_ALLOWED`. Removed requests return `404` |

Notes are immutable: a database trigger rejects any update or delete on them.

## API

Success: `{ "data": ... }` (lists also have `"meta"`). Errors: `{ "error": { "code", "message", "details" } }`, always JSON. Statuses used: 400, 404, 409, 413, 422, and 500 only for unexpected failures.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/requests` | Raise a request (201) |
| GET | `/api/requests` | Search `q`, filter `status` and `reason`, `sort`, `order`, `page`, `pageSize` (max 50). All in SQL |
| GET | `/api/requests/:id` | Request with all notes |
| PATCH | `/api/requests/:id` | Edit details |
| POST | `/api/requests/:id/transition` | Change status (`to`, plus `resolution` and `refundAmount` when approving) |
| DELETE | `/api/requests/:id` | Soft delete (204) |
| GET, POST | `/api/requests/:id/notes` | List or add notes |

Every request carries `allowedActions`, and the frontend only shows those buttons, so the rules live in one place.

## Assumptions

1. The brief does not say how an item is identified. I store `item_sku` (used by the one-live-request rule) and `item_name` (for display).
2. There are no orders or customers tables. Order number and customer details are stored on the request, so quantity is not checked against an original order.
3. Name and email are required, phone is optional.
4. Details can be edited while Open or In Review, and are locked from Approved onward.
5. A removed request no longer blocks a new request for the same order and item.
6. The body is validated first (`422`), then the lifecycle (`409`). A resolution or refund amount sent with any transition other than approval is a `422`.
7. There is no login, so a note's author is a typed name.