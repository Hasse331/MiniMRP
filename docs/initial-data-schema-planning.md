# Initial data schema planning

For spectrum audio instruments as an example:

## Product

| Field | Type   | Notes            |
| ----- | ------ | ---------------- |
| id    | UUID   | Primary key      |
| name  | STRING | Product name     |
| image | STRING | File path or URL |

---

## Version

| Field          | Type          | Notes                        |
| -------------- | ------------- | ---------------------------- |
| id             | UUID          | Primary key                  |
| product_id     | FK Product.id | Reference to Product         |
| version_number | STRING        | Version identifier (e.g. v1) |

---

## ComponentMaster

| Field    | Type   | Notes                    |
| -------- | ------ | ------------------------ |
| id       | UUID   | Primary key              |
| name     | STRING | Component name           |
| category | STRING | e.g. Resistor, Capacitor |
| producer | STRING | Manufacturer             |
| value    | STRING | e.g. 10k, 100nF          |

---

## Seller

| Field     | Type   | Notes                               |
| --------- | ------ | ----------------------------------- |
| id        | UUID   | Primary key                         |
| name      | STRING | Seller name                         |
| base_url  | STRING | Base URL for link generation        |
| lead_time | NUMBER | Lead time (same for all components) |

---

## ComponentSeller

| Field        | Type                  | Notes                           |
| ------------ | --------------------- | ------------------------------- |
| component_id | FK ComponentMaster.id | Reference to component          |
| seller_id    | FK Seller.id          | Reference to seller             |
| product_url  | STRING                | Generated or stored product URL |

Primary Key: (component_id, seller_id)

---

## ComponentReference

| Field               | Type                  | Notes                                     |
| ------------------- | --------------------- | ----------------------------------------- |
| version_id          | FK Version.id         | Reference to the version                  |
| component_master_id | FK ComponentMaster.id | Reference to the component master         |
| reference           | STRING                | Circuit board reference, e.g., R1, C3, U5 |

Primary Key: (version_id, reference)

---

## Inventory

| Field              | Type                  | Notes                          |
| ------------------ | --------------------- | ------------------------------ |
| id                 | UUID                  | Primary key                    |
| component_id       | FK ComponentMaster.id | Reference to component         |
| quantity_available | NUMBER                | Current stock level            |
| purchase_price     | NUMBER                | Last or average purchase price |

---

## Attachment

| Field      | Type          | Notes                    |
| ---------- | ------------- | ------------------------ |
| id         | UUID          | Primary key              |
| version_id | FK Version.id | Reference to the version |
| file_path  | STRING        | File path or URL         |

---

## Relationships

- Product (1) → (many) Version
- Version (1) → (many) Attachment
- Version (1) → (many) ComponentReference
- ComponentReference (many) → (1) ComponentMaster
- ComponentMaster (many) → (many) Seller (via ComponentSeller)
- ComponentMaster (1) → (1) Inventory

---

## Two problems to solve

1. To make the MiniMRP system general use, schema builder system is required.

- This way MiniMRP user can define their data schemas / database as fully customized for their specialized needs
- No hardcoded customized database schemas -> instead schema builder is generating the custom database as a result

2. Other consideration is about mapping the excel mass import data to user defined schemas. This could be achieved by:

- Making user able to define the structure of the imported excel data -> mapping it to user defined schema
- Single column -> multiple DB fields is required for the project -> otherwise adding manual work for excel formatting

- Considering if there is existing libraries to solve these 2 problems, alternative option is to make these as my own reusable libraries

## Considerations

### Hybrid Schema Flexibility

To avoid complex database migrations while allowing customization, a **Hybrid JSONB** approach is recommended. Core fields (ID, name, SKU) remain as indexed SQL columns, while user-defined attributes are stored in a `metadata` JSONB column.

- **Validation:** Use **Zod** to generate dynamic schemas on-the-fly based on user settings to ensure data integrity before database insertion.

### Data Mapping

The Excel import should support **1:N transformations** (splitting "10k 0603" into "Value" and "Package") and **N:1 merging**.

- **Pipeline:** Browser-side parsing → Fuzzy-match mapping → Transformation logic → Bulk Upsert.

---

## Tech Stack vs own OSS library

| Problem            | Recommended Libraries                                  | OSS Library Potential                                                                                                               |
| :----------------- | :----------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Schema Builder** | **Zod**, **React Hook Form**, **JSON Schema**          | `@minimrp/schema-engine`: A headless utility to manage and validate dynamic JSONB fields in Supabase/Postgres.                      |
| **Excel Mapping**  | **SheetJS (xlsx)**, **Fuse.js** (for auto-suggestions) | `@minimrp/data-bridge`: A reusable "Data Onboarding" library that handles complex column splitting and merging for industrial data. |
