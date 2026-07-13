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

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Features](#features)
- [Technologies](#technologies)
- [User Roles](#user-roles)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Introduction

Place2place is a full-stack farm-to-consumer marketplace that bridges the gap between local producers and end consumers. It provides a seamless platform where producers can list fresh products like dairy, spices, honey, and eggs, customers can browse and order directly, and distribution centers can manage last-mile delivery — all in one place.

The platform is built with **Next.js** on the frontend and **Express.js with TypeScript** on the backend, with **PostgreSQL** as the database powered by **Prisma ORM**. Authentication is fully passwordless using OTP delivered via email or SMS, and the order system uses a smart producer assignment queue to ensure every order is handled efficiently.

```
Place2place/
├── web/          →  Next.js 16 frontend     (port 3000)
├── server/       →  Express + TS REST API   (port 4000)
├── database/     →  Prisma schema + SQL migrations
└── package.json  →  Root Prisma client
```

---

## Installation

To set up and run the project locally, follow these steps:

**1. Clone the repository:**

```bash
git clone https://github.com/beesumahesh27-hue/Place2place.git
cd Place2place
```

**2. Install dependencies:**

```bash
# Root Prisma client
npm install

# Backend dependencies
cd server && npm install && cd ..

# Frontend dependencies
cd web && npm install && cd ..
```

**3. Set up environment variables:**

For the **server**, create a `.env` file based on the example template:

```bash
cp server/.env.example server/.env
```

Then fill in the required values in `server/.env`:

```env
PORT=4000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

DATABASE_URL="postgresql://postgres:password@localhost:5432/place2place"

JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d

OTP_EXPIRES_MINUTES=5
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password      # Use a Gmail App Password, not your real password
FAST2SMS_API_KEY=your-fast2sms-key
```

For the **web**, create a `.env.local` file:

```bash
cp web/.env.local.example web/.env.local
```

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
FAST2SMS_API_KEY=your-fast2sms-key
```

> **No keys?** The app runs in dev mode — the OTP is printed in the server terminal and shown as a banner in the browser. No external service needed to get started.

**4. Set up the database:**

```bash
cd server

npm run db:migrate    # Run all migrations
npm run db:generate   # Generate Prisma client
npm run db:seed       # (Optional) Load sample data
```

**5. Start the development servers:**

Open two terminals and run:

```bash
# Terminal 1 — API server
cd server
npm run dev

# Terminal 2 — Web frontend
cd web
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000 |
| Health check | http://localhost:4000/health |

**6. Build for production:**

```bash
# Build the web app
cd web && npm run build

# Build the server
cd server && npm run build
```

---

## Features

- **Passwordless OTP login:** Users sign in using a one-time password delivered to their email or mobile number — no passwords to remember or manage.

- **Product catalog:** Producers list products across multiple categories including dairy, turmeric, cashews, honey, eggs, snacks, and more, with images and videos.

- **Cart and checkout:** Customers add products to a cart, select a delivery address, choose a payment method, and place orders in a smooth multi-step flow.

- **Smart order assignment queue:** When an order is placed, it is automatically routed to the nearest available producer. Each producer has a set time window to accept or decline before the next one in the queue is notified.

- **Booking system:** Producers can schedule visits to apartment complexes and colonies to sell directly, with time slot selection and status tracking.

- **Real-time notifications:** Users receive in-app alerts for order status updates, low stock warnings, and new order assignment requests.

- **Role-based dashboards:** Each user type — Customer, Producer, and DC — sees a tailored dashboard with relevant actions and data.

- **Media uploads:** Producers can attach product images and videos to their listings to give customers a better view of what they are buying.

- **Secure API:** The backend is protected with JWT authentication, rate limiting, and helmet security headers.

---

## Technologies

- **Next.js:** A React framework for building fast, server-rendered web applications with file-based routing.

- **React.js:** A JavaScript library for building interactive user interfaces with reusable components.

- **TypeScript:** A strongly typed superset of JavaScript that improves code quality and developer experience across both frontend and backend.

- **Tailwind CSS:** A utility-first CSS framework for building modern, responsive UIs directly in markup.

- **Express.js:** A minimal and flexible Node.js web framework used to build the REST API.

- **PostgreSQL:** A powerful open-source relational database used to store all application data.

- **Prisma:** A next-generation ORM for Node.js and TypeScript that simplifies database access and migrations.

- **JSON Web Tokens (JWT):** Used for stateless, secure user authentication after OTP verification.

- **Nodemailer:** Used to send OTP emails via Gmail.

- **Fast2SMS:** An SMS gateway used to deliver OTPs to Indian mobile numbers.

- **Multer:** A Node.js middleware for handling file uploads such as product images and videos.

- **Zod:** A TypeScript-first schema validation library used for request validation in the API.

---

## User Roles

| Role | Description |
|---|---|
| **Customer** | Browses products, manages cart, places orders, tracks deliveries, and manages saved addresses and payment cards. |
| **Producer** | Lists and manages products with images and videos, monitors inventory, and accepts or declines incoming orders. |
| **DC (Distribution Center)** | Manages the distribution center profile, coverage areas, and handles delivery assignments from producers. |

---

## API Reference

**Base URL:** `http://localhost:4000/api/v1`

| Endpoint Prefix | Description |
|---|---|
| `/auth` | OTP send and verify, JWT token management |
| `/products` | Create, read, update, and delete product listings |
| `/orders` | Place orders, update order status, view order history |
| `/producers` | Producer profiles and order assignment handling |
| `/dc` | Distribution center profile management |
| `/bookings` | Schedule and manage producer visits |
| `/notifications` | Fetch and mark user notifications as read |

---

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes.
4. Commit your changes: `git commit -m 'Add your feature description'`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Open a Pull Request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- **Next.js** — For the powerful React framework with server-side rendering and file-based routing.
- **Prisma** — For making database access and migrations simple and type-safe.
- **Tailwind CSS** — For the utility-first approach to building beautiful UIs quickly.
- **Fast2SMS** — For providing reliable SMS OTP delivery for Indian mobile numbers.
- **Nodemailer** — For easy and reliable email delivery in Node.js.
- **Zod** — For robust schema validation that keeps the API safe and predictable.
