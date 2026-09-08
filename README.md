# MiniElectronicsMRP

MiniMRP is a small internal MRP (material requirements planning) system for small businesses specializing electronic products. It is designed to manage products, versions, BOMs, components, inventory, production entries, and purchasing needs without the overhead of a full ERP system.

## Status Note

- Local web development and the desktop app use the same SQLite runtime
- Docker packages that same Next.js and SQLite application for live deployments
- No separately hosted database or database credentials are required

## Main Features

- Product and version management
- BOM management per product version
- Part master data with sellers and safety stock
- Inventory tracking and stock adjustments
- Production queue with MRP-based material consumption
- Purchasing view for shortages and near-safety-stock items
- CSV export for BOM, MRP, parts, inventory, and purchasing
- Import entry points for bulk CSV/Excel workflows
- Change history for UI-driven updates

## Runtimes

- Local web version using SQLite with Next.js hot reload
- Local desktop version using the same SQLite runtime through Electron
- Docker-hosted web version using the same application and SQLite runtime

## How It Works

1.  Add inventory & components by "master data"
2.  create product and add version
3.  Import BOM list or add components
4.  Calculate MRP and add to production
5.  Shortages & safety stock purchases calculated automatically

## Project Structure

- [`app`](./app): Next.js routes and thin page-level composition
- [`features`](./features): feature-specific UI and page sections
- [`shared/ui`](./shared/ui): reusable UI building blocks shared across features
- [`lib/runtime`](./lib/runtime): shared SQLite queries, actions, authentication, and file storage
- [`lib/mappers`](./lib/mappers): calculation and transformation logic such as MRP
- [`tests`](./tests): focused logic-level tests

Note about naming: the business domain still uses the `/components` route in the UI, but the internal feature code is named `parts` to avoid confusion with reusable UI components.

## Get Started

1. Install dependencies:

```bash
npm install
```

2. No database environment variables are required.

3. Start the app:

Fast browser development with SQLite and hot reload:

```bash
npm run dev
```

The explicit equivalent is `npm run dev:web`. Neither command builds or opens Electron.

4. Open the URL printed by the command, normally `http://localhost:3000`.

windows desktop:

```bash
npm run dev:desktop
```

5. The app opens on your Windows desktop.

## Useful Scripts

- `npm run dev`
- `npm run dev:web`
- `npm run dev:desktop`
- `npm run build`
- `npm run build:desktop`
- `npm run dist:desktop`
- `npm run dist:desktop:portable`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm test`

## Desktop Executable

Download the latest Windows desktop setup.exe build here:

- [MiniMRP Desktop build](https://drive.google.com/drive/folders/1SfUiB45TfaB3CrOeAICJxxRFNlvRajh7?usp=sharing)

Build the default Windows installer with:

```bash
npm run dist:desktop
```

The generated NSIS installer is written under [dist/desktop](./dist/desktop). The expected artifact name is `MiniMRP-Setup-<version>.exe`.

Build the portable fallback executable with:

```bash
npm run dist:desktop:portable
```

The generated portable `.exe` is also written under [dist/desktop](./dist/desktop). The expected artifact name is `MiniMRP-Portable-<version>.exe`.

For day-to-day desktop development without packaging, use:

```bash
npm run dev:desktop
```
