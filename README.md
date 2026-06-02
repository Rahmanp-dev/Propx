<div align="center">

# 🏢 PropX

### Multi-Tenant Property Management SaaS for Indian Landlords

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

A subscription-based SaaS platform where building owners register, select packages, and manage their properties — tenants, rent, maintenance, and payments — all from one dashboard.

[Get Started](#-quick-start) · [Features](#-features) · [SaaS Architecture](#-saas-architecture) · [Pricing Plans](#-pricing-plans)

</div>

---

## ✨ Features

### 🏛️ Platform (Super Admin)
| Feature | Description |
|---------|-------------|
| 👑 **Super Admin Dashboard** | Total organizations, revenue, plan distribution, pending verifications |
| 🏢 **Organization Management** | List, filter, activate, suspend building owner accounts |
| 💳 **Subscription Payments** | Verify owner payment screenshots, approve/reject subscriptions |
| 👤 **User Management** | Full CRUD on owner users — edit, reset password, delete, view activity |
| ⚙️ **Platform Settings** | Configure platform UPI ID for receiving subscription payments |

### 🏠 Property Management (Owner Dashboard)
| Feature | Description |
|---------|-------------|
| 📊 **Real-time Dashboard** | Live stats — occupancy, revenue, pending payments, maintenance overview |
| 🏗️ **Building Management** | Add buildings with address, floors, default rents per BHK, electricity rates |
| 🏠 **Flat Management** | Manage flats with types (Studio/1BHK/2BHK/3BHK), per-flat rent, deposit, maintenance |
| 👤 **Tenant Onboarding** | Full profiles — Aadhaar, phone, auto-generated login PIN for tenant portal |
| 💰 **Financial Command Center** | Revenue charts, monthly breakdowns, collection rates, payment verification |
| ⚡ **Electricity Billing** | Per-flat meter readings, auto-calculation based on building rate-per-unit |
| 📅 **Monthly Dues Auto-Generation** | Generate rent + maintenance + electricity for all occupied flats in one click |
| 📄 **Physical PDF Receipts** | Real PDF generation engine for monthly receipts (9-grid extreme density format) |
| 🔍 **Global Master Search** | Command palette to instantly find tenants, flats, or buildings across properties |
| 🔧 **Maintenance Tracker** | Create, assign, resolve tickets — Plumbing, Electrical, Carpentry, etc. |
| 📱 **WhatsApp Business API** | Rent reminders, receipts, maintenance updates, broadcast messages |
| 🔍 **Tenant Inquiry Pipeline** | Track leads from WhatsApp, Website, Walk-in, Referral |
| 🔔 **Notification Center** | Real-time alerts for payments, overdue rent, lease expiry, vacancies |
| 💳 **Multi UPI/Bank Accounts** | Configure multiple UPI IDs and bank accounts (for tax-split payments) |
| 📸 **Payment Verification** | Tenants upload UPI screenshots, owners verify manually |

### 📱 Tenant Portal
| Feature | Description |
|---------|-------------|
| 🔐 **Phone + PIN Login** | Auto-generated PIN when assigned to flat — no OTP needed |
| 💰 **UPI Payments** | See owner's UPI ID, tap to pay via GPay/PhonePe, upload proof |
| 📸 **Screenshot Upload** | Upload payment proof via Cloudinary (or local fallback) |
| 🔧 **Maintenance Requests** | Raise and track maintenance tickets |
| 📊 **Payment History** | View all past payments and receipts |
| 🚪 **Simple Logout** | Clean logout button — returns to tenant login portal |

### 🏗️ SaaS Features
| Feature | Description |
|---------|-------------|
| 📝 **Owner Registration** | 4-step form: details → plan → UPI payment → confirmation |
| 🔒 **Multi-Tenancy** | Complete data isolation — each org sees only their data |
| 💳 **UPI-First Payments** | No Razorpay needed — direct UPI with screenshot verification |
| ☁️ **Cloudinary Storage** | Screenshots stored in Cloudinary (with local fallback) |
| 📲 **PWA — Installable App** | Install on phone home screen, works offline |

---

## 🏛️ SaaS Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Super Admin (You)                   │
│  /super-admin/dashboard → Manage all organizations   │
│  Verify payments, activate/suspend accounts          │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Org: Limra  │ │  Org: Skyline│ │  Org: Green  │
│  (Owner A)   │ │  (Owner B)   │ │  (Owner C)   │
│  3 buildings │ │  1 building  │ │  5 buildings │
│  24 flats    │ │  10 flats    │ │  80 flats    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
  Tenant Portal    Tenant Portal    Tenant Portal
  (Phone + PIN)    (Phone + PIN)    (Phone + PIN)
```

### Data Isolation

All queries are scoped by `organizationId`:
- **Super Admin** → sees everything (no filter)
- **Owner** → sees only their organization's buildings, flats, tenants, payments
- **Tenant** → sees only their own data via phone + PIN

---

## 💰 Pricing Plans

| Plan | Monthly | Annual (Save 17%) | Max Units |
|------|---------|-------------------|-----------|
| **⚡ Starter** | ₹499 | ₹4,999 | 20 |
| **🛡️ Builder** (Popular) | ₹1,199 | ₹11,999 | 60 |
| **👑 Portfolio** | ₹2,499 | ₹24,999 | Unlimited |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://typescriptlang.org/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Components** | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://radix-ui.com/) |
| **Database** | [MongoDB](https://mongodb.com/) |
| **ORM** | [Prisma 5](https://prisma.io/) |
| **Charts** | [Recharts 3](https://recharts.org/) |
| **Auth** | [NextAuth.js v5](https://authjs.dev/) |
| **Image Storage** | [Cloudinary](https://cloudinary.com/) (with local fallback) |
| **Messaging** | [WhatsApp Business API](https://business.whatsapp.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** running locally or a MongoDB Atlas connection string
- **Cloudinary** account (optional — local file storage works as fallback)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/propx.git
cd propx
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings. See [Environment Variables](#-environment-variables) for details.

### 3. Set Up Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Seed Production Data

```bash
node seed-production.js
```

This creates:
- **Super Admin**: `admin@propx.in` / `admin123`
- **Sample Owner**: `pasha@limra.in` / `owner123` (Organization: Limra Property Group)
- 3 buildings, 24 flats, 19 tenants, 114 payments, maintenance records

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Login Credentials

### Super Admin (Platform Owner)

| Field | Value |
|-------|-------|
| **URL** | [http://localhost:3000/login](http://localhost:3000/login) |
| **Email** | `admin@propx.in` |
| **Password** | `admin123` |
| **Redirects to** | `/super-admin/dashboard` |

### Building Owner (Sample)

| Field | Value |
|-------|-------|
| **URL** | [http://localhost:3000/login](http://localhost:3000/login) |
| **Email** | `pasha@limra.in` |
| **Password** | `owner123` |
| **Redirects to** | `/dashboard` |

### Tenant Portal

| Field | Value |
|-------|-------|
| **URL** | [http://localhost:3000/tenant-portal](http://localhost:3000/tenant-portal) |
| **Login** | Phone number + PIN |
| **PIN** | Auto-generated when tenant is assigned a flat (shown in owner's tenant view) |

> [!CAUTION]
> Change the default passwords immediately in production. The super admin credentials are set via `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables in `.env`.

### How Login Works

1. **Navigate to `http://localhost:3000`** — you will be automatically redirected to `/login` if not authenticated.
2. **Super Admin** uses the email/password from `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
3. **Building Owners** use the email/password they registered with (or the seeded `pasha@limra.in` / `owner123`).
4. **Tenants** use a separate portal at `/tenant-portal/login` with their phone number + a 4-digit PIN (auto-generated when the owner assigns them to a flat).
5. **Logout** is available at the bottom of every sidebar (Owner/Super Admin) and in the tenant nav bar.

---

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MongoDB connection string | ✅ |
| `AUTH_SECRET` | NextAuth.js session encryption key | ✅ |
| `ADMIN_EMAIL` | Super admin login email | ✅ |
| `ADMIN_PASSWORD` | Super admin login password | ✅ |
| `NEXT_PUBLIC_APP_URL` | Base URL of the application | ✅ |
| `PLATFORM_UPI_ID` | Your UPI ID for receiving subscription payments | ✅ |
| `PLATFORM_UPI_NAME` | Display name for platform UPI | ❌ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for image uploads | ❌ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ❌ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ❌ |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp API access token | ❌ |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone number ID | ❌ |
| `RAZORPAY_KEY_ID` | Razorpay API Key (optional, UPI-first by default) | ❌ |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret | ❌ |

> [!NOTE]
> WhatsApp, Razorpay, and Cloudinary are optional. The app uses UPI-first payments by default and falls back to local file storage when Cloudinary is not configured.

---

## 📋 Workflows

### New Owner Onboarding
1. Owner visits `/register`
2. Fills in details → selects plan (Starter/Builder/Portfolio)
3. Sees your UPI ID → pays → uploads screenshot
4. You login as Super Admin → `/super-admin/payments` → Verify payment
5. Owner's org is activated → they can login and manage properties

### Tenant Rent Collection
1. Owner generates monthly dues (Rental Engine)
2. Tenant receives payment link `/pay/{id}` (via WhatsApp or sharing)
3. Tenant sees owner's UPI ID + "Pay via UPI App" button
4. After paying → uploads screenshot + optional UTR number
5. Owner sees in finance dashboard → Verifies → Payment marked PAID

### Owner Payment Config
1. Owner logs in → `/settings` → Payment Collection Settings
2. Add multiple UPI IDs (e.g., personal + business) for tax splitting
3. Add bank accounts for NEFT/IMPS
4. Set a default method shown first on tenant pages
5. These details appear on all tenant payment pages

---

## 📁 Project Structure

```
propx/
├── prisma/
│   └── schema.prisma           # MongoDB schema with multi-tenancy
├── public/
│   ├── uploads/                # Local file uploads (fallback)
│   ├── icons/                  # PWA icons
│   └── manifest.json           # PWA manifest
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Owner dashboard (org-scoped)
│   │   │   ├── buildings/      # Building CRUD + settings
│   │   │   ├── dashboard/      # Main dashboard with stats
│   │   │   ├── finance/        # Financial command center
│   │   │   ├── flats/          # Flat management + details
│   │   │   ├── inquiries/      # Tenant inquiry pipeline
│   │   │   ├── maintenance/    # Maintenance ticket tracker
│   │   │   ├── settings/       # Payment config, WhatsApp settings
│   │   │   ├── tenants/        # Tenant management
│   │   │   └── whatsapp/       # WhatsApp messaging center
│   │   ├── super-admin/        # ★ Platform admin panel
│   │   │   ├── dashboard/      # Platform stats & revenue
│   │   │   ├── organizations/  # Org list + detail + verify
│   │   │   ├── payments/       # Subscription payment verification
│   │   │   ├── users/          # User management CRUD
│   │   │   └── settings/       # Platform UPI config
│   │   ├── register/           # ★ Owner registration (4-step)
│   │   ├── api/
│   │   │   ├── upload/         # ★ File upload (Cloudinary/local)
│   │   │   └── webhook/        # Razorpay + WhatsApp webhooks
│   │   ├── tenant-portal/      # Tenant self-service
│   │   ├── pay/[id]/           # ★ UPI payment page
│   │   └── login/              # Admin/Owner login
│   ├── components/
│   │   ├── layout/             # Sidebar, super-admin-sidebar
│   │   ├── ui/                 # shadcn/ui components
│   │   └── shared/             # Reusable components
│   └── lib/
│       ├── actions/            # Server actions (org-scoped)
│       │   ├── super-admin.ts  # ★ Platform management
│       │   ├── registration.ts # ★ Owner registration
│       │   ├── payment-proof.ts# ★ Screenshot upload/verify
│       │   └── ...             # All org-scoped actions
│       ├── auth.ts             # NextAuth.js (multi-role)
│       ├── cloudinary.ts       # ★ Cloudinary upload client
│       ├── mongo.ts            # MongoDB client (writes)
│       ├── prisma.ts           # Prisma client (reads)
│       └── tenant-auth.ts      # Tenant phone+PIN auth (AES-256-GCM encrypted cookies)
├── middleware.ts               # ★ NextAuth route protection (edge middleware)
├── seed-production.js          # Database seeder (multi-tenant)
└── README.md
```

> ★ = New in SaaS upgrade

---

## 🧑‍💻 Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Regenerate Prisma client
npx prisma generate

# Push schema changes to MongoDB
npx prisma db push

# Re-seed database (WARNING: drops existing data)
node seed-production.js
```

---

## 📝 Design Decisions

- **Multi-tenancy via organizationId** — Shared database, shared collections, `organizationId` as discriminator. All queries scoped through auth session.
- **UPI-first payments** — Direct UPI transfer + screenshot verification instead of payment gateway dependency. Razorpay is optional.
- **Cloudinary with fallback** — Screenshots upload to Cloudinary when configured, local `public/uploads/` otherwise.
- **Phone + PIN for tenants** — Auto-generated when assigned to flat. Simpler than OTP for India market.
- **Multi UPI/Bank accounts** — Owners can split payments across accounts for tax optimization.
- **MongoDB (clientPromise) for writes, Prisma for reads** — raw MongoDB for complex updates, Prisma for type-safe reads.
- **Server Actions** — all mutations via `'use server'` with `revalidatePath` for instant UI updates.

---

## 🔄 Changelog

### v2.2 — Production Polish & Scalability (Latest)
- 📄 **Real PDF Generation** — Replaced native browser print with a true physical PDF engine (`html-to-image` + `jsPDF`) for downloadable receipts.
- 🖨️ **9-Grid Density Layout** — Engineered an extreme density 3x3 layout to fit exactly 9 highly detailed receipts on a single A4 PDF page.
- 🔍 **Global Master Search** — Integrated a fast command-palette search mounted in the top-bar to instantly find any tenant, flat, or building.
- ⚡ **Real-Time Filtering** — Upgraded building flat lists with instant client-side search filtering by flat number or tenant name.
- 🗂️ **UI/UX Refinements** — Added permanent "Receipts" access to core navigation sidebars and refined data tables.
- 🛠️ **Next.js 16 Hardening** — Resolved Server Component `searchParams` Promise unwrap errors and illegal event handlers for bulletproof production builds.

### v2.1 — Security Audit & UI Overhaul
- 🔒 **Middleware Protection** — Added `middleware.ts` for route-level NextAuth enforcement
- 🔒 **Super Admin Action Guards** — All server actions require authenticated SUPER_ADMIN role
- 🔒 **Encrypted Tenant Cookies** — AES-256-GCM encrypted session cookies (no more plain-text)
- 🔒 **Secure PIN Generation** — Random 4-digit PINs instead of predictable phone number slices
- 🔒 **NextAuth API Route** — Added missing `/api/auth/[...nextauth]` handler
- 🎨 **Premium Login Page** — Split-screen design with glassmorphism and gradient branding
- 🎨 **Redesigned Sidebars** — Premium gradient sidebars with active state indicators for both Owner and Super Admin
- 🎨 **Desktop Top Bar** — Welcome greeting with user info on dashboard layouts
- 🎨 **Visible Logout** — Clear logout button at the bottom of every sidebar (Owner + Super Admin + Tenant)
- 🎨 **Dark Mode Border Fixes** — Explicit border colors across all shadcn/ui components
- 🗑️ **Dead Code Cleanup** — Removed obsolete `portal-shell.tsx`
- ♿ **Accessibility** — ARIA labels on tenant navigation icons

### v2.0 — Multi-Tenant SaaS
- ★ **Owner Registration** — 4-step registration with plan selection and UPI payment
- ★ **Super Admin Panel** — Dashboard, org management, user CRUD, payment verification
- ★ **Multi-Tenancy** — All data scoped by organizationId, complete isolation
- ★ **UPI-First Payments** — Deep links to GPay/PhonePe, screenshot upload, manual verification
- ★ **Cloudinary Integration** — Cloud image storage for screenshots with local fallback
- ★ **Multi UPI/Bank** — Owners can configure multiple payment accounts
- ★ **Auto Tenant Onboarding** — Phone + PIN login generated on flat assignment
- ★ **Tenant Portal Improvements** — Logout, payment proof upload
- ★ **Super Admin User Management** — Full CRUD on owner users

### v1.0 — Single Owner Property Manager
- Dashboard, buildings, flats, tenants, payments
- Electricity billing, maintenance tracker
- WhatsApp Business API integration
- Razorpay payment gateway
- Tenant self-service portal (OTP)
- PWA with offline support

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for Indian Property Owners**

PropX — Smart property management, simplified.

</div>