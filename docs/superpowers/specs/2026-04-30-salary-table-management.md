# Salary Table Management — Design Spec

## Goal

Allow HR configurers to create salary tables and manage their rows (create, edit, delete) directly from the Designer, without needing Flyway seed migrations.

## Scope

Two repos are affected: `b4rrhh_backend` (new REST API) and `b4rrhh_designer` (UI).

---

## Data Model

### PayrollObject (existing)

Represents the table itself. Relevant fields:
- `ruleSystemCode` — e.g. `"ESP"`
- `objectCode` — user-defined identifier, e.g. `"SB_99002405011982"`
- `objectTypeCode` — `TABLE` (or `CONSTANT`)
- `active` — boolean

### PayrollTableRow (existing, `payroll.payroll_table_row`)

Represents one row in a table. Fields:
- `id` — surrogate Long (used as path param for update/delete)
- `ruleSystemCode`
- `tableCode` — matches the `objectCode` of the parent PayrollObject
- `searchCode` — lookup key used by the payroll engine, e.g. `"99002405-G1"`
- `startDate` — LocalDate, row validity start
- `endDate` — LocalDate, nullable (null = open-ended)
- `monthlyValue` — BigDecimal (10.2)
- `annualValue` — BigDecimal (10.2)
- `dailyValue` — BigDecimal (10.2)
- `hourlyValue` — BigDecimal (10.2)
- `active` — boolean

Business key (unique constraint): `(ruleSystemCode, tableCode, searchCode, startDate)`.

---

## Backend

### New Endpoints

All under base path `/payroll-engine` (consistent with existing concepts/objects/assignments API).

#### Create table

```
POST /payroll-engine/{ruleSystemCode}/tables
Body: { "objectCode": "SB_..." }
Response 201: { "ruleSystemCode", "objectCode", "active": true }
```

Creates a `PayrollObject` with `objectTypeCode = TABLE`. Rejects duplicate `objectCode` with 409.

#### List rows

```
GET /payroll-engine/{ruleSystemCode}/tables/{tableCode}/rows
Response 200: [ { id, searchCode, startDate, endDate, monthlyValue, annualValue, dailyValue, hourlyValue, active }, ... ]
```

Returns all rows for the table, ordered by `searchCode ASC, startDate ASC`.

#### Create row

```
POST /payroll-engine/{ruleSystemCode}/tables/{tableCode}/rows
Body: { searchCode, startDate, endDate?, monthlyValue, annualValue, dailyValue, hourlyValue }
Response 201: { id, searchCode, startDate, endDate, monthlyValue, annualValue, dailyValue, hourlyValue, active: true }
```

Rejects duplicates (same `searchCode + startDate`) with 409.

#### Update row

```
PUT /payroll-engine/{ruleSystemCode}/tables/{tableCode}/rows/{rowId}
Body: { searchCode?, startDate?, endDate?, monthlyValue?, annualValue?, dailyValue?, hourlyValue?, active? }
Response 200: updated row
```

Partial update — only provided fields are changed. Returns 404 if `rowId` not found.

#### Delete row

```
DELETE /payroll-engine/{ruleSystemCode}/tables/{tableCode}/rows/{rowId}
Response 204
```

Returns 404 if not found.

### Backend Architecture

Follows the hexagonal architecture already established in the project.

**`table` vertical** — inside `payroll_engine` bounded context:

```
domain/port/
  PayrollTableCreationPort            (save PayrollObject of type TABLE)
application/usecase/
  CreatePayrollTableCommand           { ruleSystemCode, objectCode }
  CreatePayrollTableUseCase
application/service/
  CreatePayrollTableService           (calls PayrollObjectRepository)
infrastructure/web/
  PayrollTableManagementController
  CreatePayrollTableRequest           { objectCode }
  PayrollTableResponse                { ruleSystemCode, objectCode, active }
  PayrollTableAlreadyExistsException  → 409
```

**`table.row` vertical** — inside `payroll_engine` bounded context:

```
domain/port/
  PayrollTableRowManagementPort       (findAllByTableCode, save, findById, delete)
application/usecase/
  ListTableRowsQuery                  { ruleSystemCode, tableCode }
  CreateTableRowCommand               { ruleSystemCode, tableCode, searchCode,
                                        startDate, endDate, monthlyValue,
                                        annualValue, dailyValue, hourlyValue }
  UpdateTableRowCommand               { rowId, all fields nullable }
application/service/
  ListTableRowsService
  CreateTableRowService
  UpdateTableRowService
  DeleteTableRowService
infrastructure/persistence/
  PayrollTableRowManagementAdapter    (implements port using existing JPA repo)
infrastructure/web/
  PayrollTableRowManagementController
  CreateTableRowRequest
  UpdateTableRowRequest               (all fields optional)
  TableRowResponse                    { id, searchCode, startDate, endDate,
                                        monthlyValue, annualValue, dailyValue,
                                        hourlyValue, active }
  TableRowAlreadyExistsException      → 409
  TableRowNotFoundException           → 404
```

### Tests

- Service unit tests with Mockito for each use case (create, list, update, delete rows + create table).
- `@DataJpaTest` persistence test for `PayrollTableRowManagementAdapter`.
- Controller slice tests (`@WebMvcTest`) for happy path + error cases (404, 409).

### OpenAPI

Add all new endpoints and schemas to `openapi/payroll-engine-api.yaml`.

---

## Designer (b4rrhh_designer)

### Files

```
src/app/objects/
  ObjectsPage.tsx                     (modify: add "Nueva tabla" button, click handler, row panel)
  TableRowPanel.tsx                   (new: side panel showing rows for selected table)
  TableRowModal.tsx                   (new: create/edit modal for a single row)
  CreateTableModal.tsx                (new: simple modal to create a PayrollObject of type TABLE)
  api/
    tableRowsApi.ts                   (new: API calls for rows CRUD + table creation)
  useTableRows.ts                     (new: TanStack Query hook — list rows for a tableCode)
```

### ObjectsPage changes

- Tab "Tablas": add `+ Nueva tabla` button (top-right, alongside tab switcher).
- Clicking `+ Nueva tabla` opens `CreateTableModal`.
- Clicking a TABLE row sets `selectedTableCode` state → renders `TableRowPanel` as right panel.
- Layout becomes `flex h-full`: object list (fixed width ~280px) + `TableRowPanel` (flex-1) when a table is selected.

### TableRowPanel

- Header: `tableCode` + `+ Nueva fila` button.
- Body: table with columns `Código búsqueda | Desde | Hasta | Mensual | Anual | Diario | ✎ 🗑`.
- `✎` opens `TableRowModal` in edit mode pre-filled with the row.
- `🗑` shows inline confirm (same pattern as ConceptDetailPanel delete).
- Uses `useTableRows(ruleSystemCode, tableCode)` — invalidates on mutation.

### TableRowModal

- Opens for both create and edit.
- Fields: `searchCode` (text), `startDate` (date), `endDate` (date, optional), `monthlyValue`, `annualValue`, `dailyValue`, `hourlyValue` (numbers), `active` (checkbox).
- All four value fields are required.
- `endDate` empty = null sent to backend.
- On save: calls `tableRowsApi.createRow` or `tableRowsApi.updateRow`, then invalidates `['table-rows', ruleSystemCode, tableCode]` query.

### CreateTableModal

- Single field: `objectCode` (text input).
- On submit: calls `tableRowsApi.createTable`, then invalidates `['objects', ruleSystemCode]` query.

### tableRowsApi

```typescript
createTable(ruleSystemCode, body: { objectCode })        → POST /payroll-engine/{rc}/tables
listRows(ruleSystemCode, tableCode)                      → GET  /payroll-engine/{rc}/tables/{tc}/rows
createRow(ruleSystemCode, tableCode, body)               → POST /payroll-engine/{rc}/tables/{tc}/rows
updateRow(ruleSystemCode, tableCode, rowId, body)        → PUT  /payroll-engine/{rc}/tables/{tc}/rows/{id}
deleteRow(ruleSystemCode, tableCode, rowId)              → DELETE /payroll-engine/{rc}/tables/{tc}/rows/{id}
```

### useTableRows hook

```typescript
useTableRows(ruleSystemCode: string, tableCode: string | null)
// enabled only when tableCode is non-null
// queryKey: ['table-rows', ruleSystemCode, tableCode]
```

---

## Out of Scope

- Deleting a whole table (and its rows) — not included in this iteration.
- Reordering rows.
- Bulk import from CSV.
- Validating that referenced `searchCode` values match actual employee categories.
