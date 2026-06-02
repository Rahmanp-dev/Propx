# PropX: The Future of Property Management
**A Comprehensive White Paper on the PropX SaaS Platform**

---

## 1. Executive Summary
PropX is a modern, Next.js 16-powered Software-as-a-Service (SaaS) designed specifically to revolutionize multi-tenant property management for Indian landlords. By streamlining the entire property lifecycle—from tenant onboarding and real-time rent collection to electricity billing and physical PDF receipts—PropX replaces fragmented WhatsApp groups and Excel spreadsheets with a single, unified command center.

---

## 2. Platform Architecture

### Multi-Tenancy & Data Isolation
PropX employs a robust multi-tenant architecture. The underlying database dynamically scopes all operations via `organizationId`. 
* **Super Admins** manage platform subscriptions, organization activation, and platform-wide metrics.
* **Building Owners** operate within strict data silos, ensuring that buildings, flats, and tenant financial data remain 100% private to their organization.

### Technology Stack
* **Framework**: Next.js 16 (App Router)
* **Language**: TypeScript 5
* **UI & Styling**: React 19, Tailwind CSS 4, shadcn/ui
* **Database & ORM**: MongoDB 8, Prisma 5
* **Authentication**: NextAuth.js v5 (Edge Middleware Protected)
* **Cloud Infrastructure**: Cloudinary (Image storage with automatic local fallbacks)

---

## 3. Core Feature Modules

### 👑 Super Admin & SaaS Platform Management
PropX enables developers or platform owners to monetize the software through a multi-tier SaaS model (Starter, Builder, Portfolio).
* **Global Dashboard**: Track active organizations, MRR (Monthly Recurring Revenue), and system health.
* **Subscription Management**: Approve or reject owner payment proofs to activate or suspend accounts.
* **User Management**: Full CRUD operations across all platform users and roles.

### 🏢 Building & Flat Management
* **Hierarchical Structure**: Owners can group flats under distinct buildings, each with its own address and default utility configurations.
* **Granular Flat Controls**: Define exact configuration (Studio, 1BHK, 3BHK), monthly rent, maintenance baseline, and deposit amounts.
* **Live Filtering**: Global command palette search and real-time flat filtering by tenant name or flat number.

### 👥 Tenant Onboarding & Portal
* **Automated Onboarding**: Adding a tenant immediately auto-generates a secure, 4-digit PIN for the Tenant Portal.
* **Self-Service Portal**: Tenants log in via their Phone Number + PIN to view dues, past receipts, and raise maintenance requests without downloading an app.
* **Secure Sessions**: Tenant sessions are encrypted using highly secure AES-256-GCM cookies.

### 💰 Financial Command Center
PropX eliminates manual financial reconciliation:
* **Rental Engine**: Auto-generate monthly dues for rent, maintenance, and ad-hoc ledger entries across all occupied flats in a single click.
* **Electricity Auto-Billing**: Record meter readings for each flat; PropX automatically calculates the bill based on the building's rate-per-unit.
* **Dashboard Analytics**: Visualize revenue trends, pending dues, and collection rates via interactive Recharts.

### 💳 UPI-First Payments
PropX is heavily optimized for the Indian payment ecosystem:
* **Zero-Commission UPI**: Tenants pay directly via GPay, PhonePe, or Paytm by scanning the owner's configured UPI QR.
* **Multi-Account Splitting**: Owners can configure multiple bank accounts and UPI IDs to route payments for tax optimization.
* **Digital Proof Verification**: Tenants upload payment screenshots directly to Cloudinary, triggering a verification alert on the Owner's dashboard.

### 📄 Real PDF Receipts (9-Grid Extreme Density)
* **True Physical PDFs**: Moving away from browser-native printing, PropX utilizes a custom `html-to-image` and `jsPDF` pipeline to programmatically generate physical PDF files.
* **Extreme Density Formatting**: Receipts are automatically mathematically mapped into a 3x3 grid (business card size), fitting 9 high-detail receipts precisely onto a single A4 page for economical printing and distribution.

### 🔧 Operations & Maintenance Tracker
* **Ticketing System**: Tenants can raise categorized maintenance requests (Plumbing, Electrical, Carpentry).
* **Lifecycle Management**: Owners track open requests, mark items in-progress, assign costs, and analyze average resolution times.

---

## 4. Security & Compliance
* **Edge Middleware**: Deep route protection prevents unauthorized access across different organization boundaries.
* **Action Guards**: All Server Actions are validated server-side against role-based access controls (RBAC).

---

## 5. Conclusion
PropX delivers an enterprise-grade experience tailored to the specific operational needs of property managers. By merging high-performance Next.js architectures with deeply localized features like UPI-first payments and offline-ready PWAs, PropX sets a new standard for PropTech software.
