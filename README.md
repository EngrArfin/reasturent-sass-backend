# Restaurant POS & Management SaaS - Backend API

A high-performance Multi-Tenant Restaurant POS & Management SaaS Backend built with **NestJS**, **Prisma ORM**, and **PostgreSQL**.

---

## 📚 Documentation & Role Scopes

- 📄 **[Supervisor Access & Project Scope Guide](file:///c:/ProgramHuntJob/reasturent-sass-backend/SUPERVISOR_ACCESS_SCOPE.md)** - রেস্তোরাঁ সুপারভাইজার/মালিকের সকল পারমিশন ও প্রজেক্ট স্কোপের পূর্ণাঙ্গ তালিকা।
- 🌐 **Swagger API Documentation**: Available locally at `http://localhost:5000/api` or `/docs`.

---

## 👥 Role Hierarchy & Capabilities Overview

```
                   ┌───────────────────────────────────┐
                   │           SUPER_ADMIN             │
                   │ (Global Platform Admin & Billing) │
                   └─────────────────┬─────────────────┘
                                     │
                                     ▼
                   ┌───────────────────────────────────┐
                   │           SUPERVISOR              │
                   │  (Restaurant Owner / Supervisor)  │
                   └─────────────────┬─────────────────┘
                                     │
                                     ▼
                   ┌───────────────────────────────────┐
                   │             MANAGER               │
                   │   (Floor Operations & Staffing)   │
                   └─────────────────┬─────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
   ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
   │    CASHIER    │         │    SERVER     │         │    KITCHEN    │
   │ (POS Billing) │         │ (Floor & Map) │         │ (KDS Tickets) │
   └───────────────┘         └───────────────┘         └───────────────┘
```

---

## 🚀 Key Modules & Endpoints Scoped for Supervisor

| Module | Route Prefix | Supervisor Scope & Capabilities |
| :--- | :--- | :--- |
| **Staff & Approvals** | `/users` | Staff CRUD, masked PINs, exclusive approval (`PATCH /users/:id/approval`) |
| **Sales Overview** | `/overview` | Daily sales, transactions, active terminals & pending orders |
| **Food Orders** | `/orders` | Order creation, lifecycle tracking (`PENDING` -> `SERVED` -> `COMPLETED`) |
| **Cashier Hub** | `/cashier` | Table bill calculations, checkout via Cash, Card, and MFS (bKash/Nagad) |
| **Kitchen KDS** | `/kitchen` | Real-time ticket stream, bumping ticket stages, KPI metrics |
| **Waiter Floor** | `/serve` | Floor table occupancy map, direct order dispatch to kitchen |
| **Floor Tables** | `/tables` | Seating capacity, zones, status management, table setup |
| **Inventory & Barcode** | `/products` | Stock levels, automatic barcode/SKU generation, QR/barcode scanning |
| **Food Menu** | `/menu-items` | Menu catalog, item categories, stock availability toggling |
| **Vouchers** | `/vouchers` | Promotional discount vouchers and automated calculations |
| **Support** | `/tickets` | Diagnostic tickets submission and live chat with Super Admin |

---

## 🛠️ Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database ORM**: Prisma ORM with PostgreSQL
- **Authentication**: JWT (JSON Web Tokens) with Passport & `bcryptjs`
- **Security**: Role-Based Access Control (RBAC) via `@Roles()` decorator & `RolesGuard`
- **API Documentation**: Swagger / OpenAPI `@nestjs/swagger`

---

## 💻 Setup & Development

```bash
# Install dependencies
npm install

# Setup environment variables (.env)
# DATABASE_URL="postgresql://..."
# JWT_SECRET="..."

# Run database migrations
npx prisma migrate dev

# Run in watch mode
npm run start:dev
```
