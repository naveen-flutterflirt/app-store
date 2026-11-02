# BizBox App Store & Platform Architecture (v1.0)
**FlutterFlirt Private Limited** · *Architectural Implementation*

---

## 📌 Overview
BizBox transforms traditional retail and restaurant POS machines into an extensible, app-driven platform.
- **Bare minimum core:** The physical Pi 5 device boots only with core POS billing and Device Manager.
- **Everything else is an App:** Kitchen Display (KDS), QR Ordering, Inventory Recipes, WhatsApp marketing, and AI are installed as standalone apps.
- **Zero-trust security:** Apps never touch the database directly; they communicate via scoped OAuth APIs, are scanned via CI (Trivy, Syft SBOM), and run in sandboxed containers (`k3s`).

---

## 📂 Repository Directory Layout (Page 14 Monorepo Blueprint)

```
App_Store/
├── apps/
│   ├── store/             # Next.js: Public App Store (store.bizbox.in)
│   ├── console/           # Next.js: BizBox Console for business owners & App Shell
│   ├── developer/         # Next.js: Developer Console (dev.bizbox.in)
│   ├── admin/             # Next.js: Internal Review Queue & Store Dashboard
│   └── api/               # NestJS: Core API Gateway (51 endpoints)
├── packages/
│   ├── app-sdk/           # @bizbox/app-sdk: SDK client used by all apps
│   ├── cli/               # @bizbox/cli: Developer CLI tool
│   ├── ui/                # @bizbox/ui: FlutterFlirt design tokens & components
│   └── api-client/        # @bizbox/api-client: Generated from OpenAPI spec
├── edge/
│   └── agent/             # BizBox Agent daemon for Raspberry Pi 5
├── database/
│   ├── schema.sql         # 18 PostgreSQL tables, triggers, and RLS policies
│   └── seed_launch_catalog.sql # 22 launch apps + pilot partner apps
├── openapi/
│   └── appstore_openapi.yaml # Complete 51-endpoint OpenAPI 3.1 specification
├── scripts/
│   └── db-init.sh         # Database setup script
├── docker-compose.yml     # Local environment (Postgres 16, Redis, NATS, MinIO)
└── .env.example           # Environment variables template
```

---

## 🚀 Environment Setup Instructions

### 1. Requirements
- **Node.js**: `v20.0.0` or higher (detected: `v26.5.0`)
- **npm**: `v10.0.0` or higher (detected: `v11.17.0`)
- **PostgreSQL 16**: (or Docker)

### 2. Option A: Spin Up Local Stack using Docker
If you have Docker Desktop running:
```bash
docker compose up -d
```
This automatically boots:
- PostgreSQL 16 on port `5432` and applies `database/schema.sql` and `database/seed_launch_catalog.sql`
- Redis on port `6379`
- NATS message broker on port `4222`
- MinIO S3 object store on ports `9000` & `9001`

### 3. Option B: Native PostgreSQL Setup
If running PostgreSQL natively:
```bash
chmod +x scripts/db-init.sh
./scripts/db-init.sh
```

---

## 📦 Phased Roadmap Execution

- [x] **Phase 1 Setup (Current)**
  - Monorepo structure configured.
  - Complete PostgreSQL 16 schema with 18 tables, `guard_publish()` trigger, and rollout logic (`schema.sql`).
  - Seed catalog with all 22 launch apps (`seed_launch_catalog.sql`).
  - OpenAPI 3.1 specification for 51 endpoints (`appstore_openapi.yaml`).
  - Manifest schema (`bizbox-app.schema.json`) and `@bizbox/app-sdk`.
  - `@bizbox/cli` developer command-line binary.
  - Storefront home page and sandboxed App Shell page.
- [ ] **Phase 2: Edge & Deployment** (BizBox agent, desired state, k3s sandbox, cosign verification).
- [ ] **Phase 3: Billing** (Razorpay subscriptions, UPI AutoPay, trials, GST invoicing).
- [ ] **Phase 4: Developer Ecosystem** (Developer console, CI checks: SBOM & CVE scanner, payouts).

