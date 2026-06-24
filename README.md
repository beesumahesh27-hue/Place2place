# Place2place

A full-stack farm-to-consumer marketplace connecting customers, local producers, and distribution centers. Customers browse and order fresh produce; producers manage inventory and fulfill orders; DCs handle last-mile delivery.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, TypeScript |
| Backend | Express.js, TypeScript, JWT auth |
| Database | PostgreSQL, Prisma ORM |
| Auth | OTP login via Email (Gmail) or SMS (Fast2SMS) |
| Uploads | Multer (product images & videos) |

---

## Project Structure

```
Place2place/
├── web/          # Next.js frontend  →  http://localhost:3000
├── server/       # Express API       →  http://localhost:4000
├── database/     # Prisma schema + SQL migrations
└── package.json  # Root-level Prisma client
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

---

## Environment Setup

### Server

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

DATABASE_URL="postgresql://postgres:password@localhost:5432/place2place"

JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=7d

OTP_EXPIRES_MINUTES=5

EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password   # Gmail App Password (not your real password)

FAST2SMS_API_KEY=your-fast2sms-api-key
```

### Web

```bash
cp web/.env.local.example web/.env.local
```

Edit `web/.env.local`:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
FAST2SMS_API_KEY=your-fast2sms-api-key
```

> **Dev mode:** If OTP keys are not set, the OTP is printed in the server terminal and shown as a yellow banner in the browser.

---

## Database Setup

```bash
# Install root dependencies (Prisma client)
npm install

# Install server dependencies
cd server && npm install && cd ..

# Run migrations
cd server && npm run db:migrate

# Generate Prisma client
npm run db:generate

# (Optional) Seed sample data
npm run db:seed
```

---

## Running Locally

Open two terminals:

**Terminal 1 — API server**
```bash
cd server
npm run dev
# Running at http://localhost:4000
```

**Terminal 2 — Web frontend**
```bash
cd web
npm install   # first time only
npm run dev
# Running at http://localhost:3000
```

---

## User Roles

| Role | What they do |
|---|---|
| **Customer** | Browse products, add to cart, checkout, track orders, manage addresses |
| **Producer** | List products (dairy, spices, etc.), manage inventory, accept/decline orders |
| **DC** | Manage distribution center profile, handle delivery assignments |

---

## Key Features

- **OTP authentication** — passwordless login via email or SMS
- **Product catalog** — categories include dairy, turmeric, cashews, honey, eggs, and more
- **Cart & checkout** — address selection, payment method, order confirmation
- **Order assignment queue** — orders are routed to producers by rank; producers accept or decline within a time window
- **Booking system** — schedule producer visits to apartments or colonies
- **Notifications** — real-time alerts for order status, stock levels, and assignments
- **Role dashboards** — separate views for Customer, Producer, and DC users
- **Image & video uploads** — producers can attach media to product listings

---

## Useful Database Commands

```bash
cd server
npm run db:migrate    # apply new migrations
npm run db:generate   # regenerate Prisma client after schema changes
npm run db:seed       # seed sample data
npm run db:studio     # open Prisma Studio (visual DB browser)
npm run db:reset      # reset database and re-run all migrations
```

---

## API

Base URL: `http://localhost:4000/api/v1`

Health check: `GET http://localhost:4000/health`

Key route groups:
- `/auth` — OTP send/verify, JWT refresh
- `/products` — CRUD for product listings
- `/orders` — place orders, update status
- `/producers` — producer profiles and assignments
- `/dc` — distribution center profiles
- `/bookings` — schedule and manage visits
- `/notifications` — read and mark notifications
