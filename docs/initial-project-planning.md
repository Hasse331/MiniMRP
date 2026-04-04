# MiniMRP – Initial Project Planning

## 1. Project Overview

MiniMRP is a lightweight, open-source MRP system for small businesses, focusing on:

- Component and material management
- BOM versioning
- Inventory tracking (net and gross requirements)
- Excel import/export
- Backend flexibility: designed to work with Supabase initially, but can be adapted to Firebase or a custom backend (database, auth, API) in the future

#### Design Philosophy

MiniMRP follows a minimalist approach: do one thing really well—material and inventory management—while keeping complexity and maintenance low. The system is designed for reusability and modularity, ensuring that components, BOMs, and inventory logic can be easily extended or adapted in the future without bloating the core functionality. Front-end code is designed to be reusable for both web deployment and optional local/offline UI, e.g., wrapped in Electron.

## 2. Goals

- Simple, easy-to-use back-office for small business owners
- Open-source and general-purpose

## 3. Architecture

- **Front-end:** Next.js, with simple routing from any frontoffice `/admin` route
- **Back-end:** Supabase (PostgreSQL, auth, API) as the initial implementation
- **Data storage:** Supabase tables for components, categories, products, BOMs, inventory
- **Deployment:** Cloud (Vercel); front-end code can also run locally via optional lightweight wrapper (Electron) for offline/local use
- **Offline mode / local UI:** idea for easy-to-use local hosting with minimal setup and no technical knowledge required

## 4. Features

- Component catalog and categories
- Product BOMs with versioning
  - Product files like: .cad, .sch, etc. for each version
- Inventory tracking (current stock, net/gross requirements)
- Excel import for bulk data
- Modular and scalable design for future expansion
- Budgeting/cost management
- Component lead time-based production scheduling (production start date estimation)

## 5. Future Considerations

- Multi-tenant support
- Optional ERP modules (HR, accounting, purchasing) (MiniMRP -> MiniERP)
- Potential support for alternative backends if needed
