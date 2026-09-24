# Restaurant Management System

> Restaurant Management System with Restaurant Web Panel, Partner Admin, Manager Admin, and Super Admin applications.

A comprehensive multi-application platform designed to handle end-to-end restaurant management, from customer food discovery and online ordering to partner operations, branch management, and platform-level administration.

---

## Architecture & Project Structure

The repository is organized into four standalone applications:

```text
restaurant-management-system/
├── restaurant-web/     # Customer-facing web panel (Browsing, Ordering, Reservations)
├── partner-admin/      # Restaurant partner/owner administration portal
├── manager-admin/      # Branch/restaurant manager operations portal
├── super-admin/        # System-wide platform super administrator portal
├── .gitignore          # Root ignore rules for node_modules, .env, builds, and logs
└── README.md           # Repository documentation and setup instructions
```

---

## Four Applications Overview

### 1. Restaurant Web (`restaurant-web/`)
- **Target Users:** Customers and diners
- **Key Features:**
  - Interactive restaurant catalog, categories, and food menu browsing
  - Menu item customization, addons, and special instructions
  - Real-time shopping cart, checkout, and promocode redemption
  - Live order tracking and order history
  - Table booking and digital waiter calling

### 2. Partner Admin (`partner-admin/`)
- **Target Users:** Restaurant owners, franchisees, and brand partners
- **Key Features:**
  - Restaurant profile, branch setup, operating hours, and location
  - Comprehensive food menu catalog, categories, variations, and pricing
  - Order fulfillment management, status updates, and digital invoices
  - Partner revenue tracking, sales statistics, and payout summaries

### 3. Manager Admin (`manager-admin/`)
- **Target Users:** Branch managers, kitchen staff, and store operations
- **Key Features:**
  - Real-time order dispatch board (Pending, Accepted, Preparing, Ready, Delivered)
  - Table management, counter ordering, and billing operations
  - Daily inventory toggling (item in-stock / out-of-stock)
  - Daily shift management, kitchen receipts, and branch-level analytics

### 4. Super Admin (`super-admin/`)
- **Target Users:** Platform administrators and system executives
- **Key Features:**
  - Partner verification, onboarding, and restaurant store approvals
  - Platform-wide transaction tracking, commission splits, and settlement management
  - Role-based access control (RBAC), user permissions, and audit logs
  - Global system settings, currencies, and platform configuration

---

## Technologies Used

- **Frontend Core:** React.js, React DOM
- **Languages:** JavaScript (ES6+), TypeScript
- **State Management & Data Flow:** Redux Toolkit / Context API, React Hooks
- **Routing:** React Router DOM (v5/v6)
- **Styling & UI:** SCSS, Bootstrap, Reactstrap, Framer Motion, Feather Icons
- **Backend & Cloud Services:** Firebase (Authentication, Cloud Firestore, Cloud Storage, Cloud Functions)
- **Build Tools:** Create React App (`react-scripts`), `react-app-rewired`

---

## Environment Variable Setup

For security, credentials and API keys are not stored in the repository. Each application contains a `.env.example` file that details the required environment variables.

### Variables Reference

| Variable Name | Description | Example / Note |
|---|---|---|
| `SKIP_PREFLIGHT_CHECK` | Bypasses dependency conflict warnings during build | `true` |
| `REACT_APP_BASENAME` | Application base routing path | `""` or `"/admin"` |
| `REACT_APP_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSy...` |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase Authentication Domain | `your-app.firebaseapp.com` |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase Project ID | `your-app-id` |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Firebase Cloud Storage Bucket | `your-app.firebasestorage.app` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging Sender ID | `1234567890` |
| `REACT_APP_FIREBASE_APP_ID` | Firebase Web Application ID | `1:...:web:...` |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | Firebase Analytics Measurement ID | `G-...` |

### Setting Up Local Environment

For each application you want to run, copy the `.env.example` template to `.env` and fill in your values:

```bash
# Example for restaurant-web:
cd restaurant-web
cp .env.example .env
# Fill in your Firebase credentials in .env
```

Repeat the same for `partner-admin`, `manager-admin`, and `super-admin`.

---

## Installation & Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.x or higher recommended)
- [npm](https://www.npmjs.com/) (v7.x or higher) or [yarn](https://yarnpkg.com/)

### 1. Restaurant Web Panel
```bash
cd restaurant-web
npm install
npm start
```
Default URL: `http://localhost:3000`

### 2. Partner Admin
```bash
cd partner-admin
npm install
npm start
```
Default URL: `http://localhost:3000` (or alternate port if 3000 is occupied)

### 3. Manager Admin
```bash
cd manager-admin
npm install
npm start
```
Default URL: `http://localhost:3000`

### 4. Super Admin
```bash
cd super-admin
npm install
npm start
```
Default URL: `http://localhost:3000`

---

## Build Commands

To create production-ready optimized bundles for deployment:

```bash
# Customer Web Panel
cd restaurant-web && npm run build

# Partner Admin
cd partner-admin && npm run build

# Manager Admin
cd manager-admin && npm run build

# Super Admin
cd super-admin && npm run build
```

Production output will be generated inside each application's `build/` directory.

---

## Security Notes

1. **Zero Secret Exposure:** No Firebase API keys, service account JSON files, private keys, database passwords, or JWT secrets are committed to this repository.
2. **Environment Isolation:** All sensitive credentials are strictly loaded through environment variables (`REACT_APP_*`) and local `.env` files which are ignored by Git.
3. **Frontend vs Backend Security:** Frontend clients use scoped public API access governed by Firebase Security Rules. Admin operations must be secured via Cloud Functions or backend services using verified JWT authentication.

---

## License

Proprietary and Confidential. Unauthorized copying, distribution, or modification is strictly prohibited.
