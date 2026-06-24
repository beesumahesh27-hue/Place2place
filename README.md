<div align="center">

# 🌾 Place2place

**A farm-to-consumer marketplace connecting local producers, customers, and distribution centers.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## Overview

Place2place bridges the gap between local farmers/producers and end consumers. Producers list fresh products, customers order directly, and distribution centers handle last-mile delivery — all in one platform.

---

## Architecture

```
Place2place/
├── web/          →  Next.js 16 frontend     (port 3000)
├── server/       →  Express + TS REST API   (port 4000)
├── database/     →  Prisma schema + SQL migrations
└── package.json  →  Root Prisma client
```

---

## Tech Stack

| | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, TypeScript |
| **Backend** | Express.js, TypeScript, JWT |
| **Database** | PostgreSQL 14+, Prisma ORM |
| **Auth** | Passwordless OTP — Email (Gmail) / SMS (Fast2SMS) |
| **Storage** | Multer — product images & videos |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

---

### 1. Clone & Install

```bash
git clone https://github.com/beesumahesh27-hue/Place2place.git
cd Place2place

# Root Prisma client
npm install

# Backend dependencies
cd server && npm install && cd ..

# Frontend dependencies
cd web && npm install && cd ..
```

---

### 2. Configure Environment

**Server** — copy and fill in `server/.env`:

```bash
cp server/.env.example server/.env
```

```env
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

DATABASE_URL="postgresql://postgres:password@localhost:5432/place2place"

JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d

OTP_EXPIRES_MINUTES=5
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password      # Not your real password — use a Gmail App Password
FAST2SMS_API_KEY=your-fast2sms-key
```

**Web** — copy and fill in `web/.env.local`:

```bash
cp web/.env.local.example web/.env.local
```

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
FAST2SMS_API_KEY=your-fast2sms-key
```

> **No keys?** The app runs in dev mode — OTP is printed in the server terminal and shown as a banner in the browser.

---

### 3. Set Up the Database

```bash
cd server

npm run db:migrate    # run migrations
npm run db:generate   # generate Prisma client
npm run db:seed       # (optional) seed sample data
```

---

### 4. Run Locally

Open **two terminals**:

```bash
# Terminal 1 — API
cd server && npm run dev

# Terminal 2 — Web
cd web && npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000 |
| Health check | http://localhost:4000/health |

---

## User Roles

| Role | Capabilities |
|---|---|
| **Customer** | Browse products, cart, checkout, order tracking, address & card management |
| **Producer** | List products with images/videos, manage inventory, accept or decline orders |
| **DC** | Manage distribution center profile and delivery assignments |

---

## Features

- **Passwordless OTP login** via email or SMS
- **Product catalog** across dairy, spices, honey, eggs, nuts, and more
- **Cart & checkout** with address selection and payment method
- **Smart order assignment** — orders are queued to producers by rank; each producer has a time window to accept or decline before the next is notified
- **Booking system** — producers can schedule visits to apartments and colonies
- **Real-time notifications** — order updates, stock alerts, assignment requests
- **Role-based dashboards** — tailored views for each user type
- **Media uploads** — product images and videos via Multer

---

## API Reference

**Base URL:** `http://localhost:4000/api/v1`

| Prefix | Description |
|---|---|
| `/auth` | OTP send/verify, JWT |
| `/products` | Product CRUD |
| `/orders` | Place and manage orders |
| `/producers` | Producer profiles and assignments |
| `/dc` | Distribution center profiles |
| `/bookings` | Schedule and track visits |
| `/notifications` | User notifications |

---

## Database Commands

```bash
cd server

npm run db:migrate    # apply migrations
npm run db:generate   # regenerate Prisma client after schema changes
npm run db:seed       # load sample data
npm run db:studio     # open Prisma Studio (visual DB browser)
npm run db:reset      # wipe and re-run all migrations
```

---

## License

[MIT](LICENSE)
