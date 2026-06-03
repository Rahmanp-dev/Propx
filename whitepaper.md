# PropX: The Intelligent Property Management Engine
**Comprehensive Feature White Paper (v3.0)**

## 1. Multi-Tenant Architecture & Data Isolation
PropX uses a robust multi-tenant architecture with MongoDB. Every user registers an `Organization` (Property Management Firm or Individual Owner). All subsequent resources (Buildings, Flats, Tenants, Payments, Complaints) are strictly isolated by `organizationId`. Owners only see their own data, and Tenants only see data relating to the flat they are assigned to.

## 2. Advanced Ledger & Financial System
- **Master Monthly Ledger:** Aggregates all expected, collected, and pending dues across the entire portfolio for any selected month. Timezone-aware date parsing ensures accurate cross-region queries.
- **Flat-Wise Ledger:** A granular view of individual flat payment histories, showing every invoice, receipt, part-payment, and outstanding balance for a specific unit.
- **Dynamic Invoices & Receipts:** Automatically generates dynamic PDFs based on payment status. A "Receipt" is issued for paid amounts, while an "Invoice" (with a 'Due Date' watermark) is generated for pending balances.
- **Bulk Payment Processing:** A one-click "Mark Month as Paid" feature allows owners to instantly log full cash payments for all pending invoices in a selected month.
- **Automated Dues Generation (Rent Engine):** A scheduled backend engine calculates monthly dues, pulling in rent, maintenance, and arrears.

## 3. Integrated Utility Billing (Electricity)
- **Meter Reading Capture:** Owners can input current meter readings for metered flats.
- **Automated Consumption Calculation:** The Rent Engine compares the current month's reading to the previous month's reading, calculates the consumed units, and multiplies by the building's defined rate per unit to automatically add the utility charge to the monthly invoice.
- **Data Integrity:** Resolves 0-indexed month discrepancies to ensure perfectly synchronized billing periods.

## 4. Payment Gateway & Collection Strategy
- **Per-Tenant Payment Assignment:** Owners can assign specific payment methods (Cash, Custom UPI, Default Org UPI) to individual tenants based on contractual agreements or convenience.
- **Automated PWA Payment Verifications:** Tenants can upload UTR transaction numbers or screenshots directly via the Tenant Portal.
- **Dynamic 9-Grid PDF Generation:** Generates 9-receipts-per-page A4 PDFs perfectly optimized for printing on both desktop and mobile devices.

## 5. WhatsApp Automation Engine
- **One-Click Dispatch:** WhatsApp buttons are integrated directly into the Ledger and Receipts interfaces, dynamically opening a pre-filled chat with the tenant.
- **Smart Messaging:** Differentiates between 'Invoice Reminders' for pending balances and 'Payment Receipts' for settled accounts.

## 6. Tenant Experience & Portal
- **Dedicated Progressive Web App (PWA):** Tenants have their own dedicated login portal (`/tenant-portal`).
- **Maintenance Ticketing:** Tenants can raise maintenance issues, attach photos, and track the resolution status (Pending, In Progress, Resolved).
- **Resolution Tracking:** Owners can close maintenance tickets and add internal resolution remarks for auditing.

## 7. Role-Based Access Control (RBAC)
- **Super Admin:** Can view system-wide analytics, manage all organizations, and oversee platform health.
- **Owner (Admin):** Full control over their organization's buildings, flats, and financial ledgers.
- **Tenant:** Restricted access strictly limited to their own flat's dues, payment history, and maintenance requests.

## 8. Seamless SaaS Landing & Registration
- **Public Packages Page:** A fully responsive, unauthenticated pricing page showcasing Starter, Builder, and Portfolio plans.
- **Frictionless Onboarding:** Registration seamlessly links the selected pricing plan, organization setup, and initial configuration.
