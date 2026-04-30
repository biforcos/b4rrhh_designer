# Salary Table Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose full CRUD for salary tables and their rows through a new REST API (backend) and a panel-based UI in the Designer (frontend).

**Architecture:** Backend adds a `table` vertical inside the `payroll_engine` bounded context — two new controllers, five new services, a domain model, and a persistence adapter that wraps the existing `PayrollTableRowRepository`. Designer extends `ObjectsPage` with a side panel and two modals, backed by a new `tableRowsApi` + TanStack Query hook.

**Tech Stack:** Java 21 + Spring Boot + JPA (backend), React 18 + TanStack Query v5 + Tailwind (designer).

---

## Repo layout

Two repos are touched in sequence:

- `b4rrhh_backend` — Tasks 1–6
- `b4rrhh_designer` — Tasks 7–12

Work on the backend first so the API is available when building the UI.

---

## File map

### Backend (`b4rrhh_backend`)

**New files:**
```
src/main/java/com/b4rrhh/payroll_engine/table/
  domain/model/PayrollTableRow.java
  domain/port/PayrollTableRowManagementPort.java
  domain/exception/PayrollTableAlreadyExistsException.java
  domain/exception/TableRowNotFoundException.java
  domain/exception/TableRowAlreadyExistsException.java
  application/usecase/CreatePayrollTableCommand.java
  application/usecase/CreatePayrollTableUseCase.java
  application/usecase/ListTableRowsUseCase.java
  application/usecase/CreateTableRowCommand.java
  application/usecase/CreateTableRowUseCase.java
  application/usecase/UpdateTableRowCommand.java
  application/usecase/UpdateTableRowUseCase.java
  application/usecase/DeleteTableRowUseCase.java
  application/service/CreatePayrollTableService.java
  application/service/ListTableRowsService.java
  application/service/CreateTableRowService.java
  application/service/UpdateTableRowService.java
  application/service/DeleteTableRowService.java
  infrastructure/persistence/PayrollTableRowManagementAdapter.java
  infrastructure/web/PayrollTableManagementController.java
  infrastructure/web/PayrollTableRowManagementController.java
  infrastructure/web/CreatePayrollTableRequest.java
  infrastructure/web/PayrollTableResponse.java
  infrastructure/web/CreateTableRowRequest.java
  infrastructure/web/UpdateTableRowRequest.java
  infrastructure/web/TableRowResponse.java
  infrastructure/web/PayrollTableExceptionHandler.java

src/test/java/com/b4rrhh/payroll_engine/table/
  application/service/CreatePayrollTableServiceTest.java
  application/service/CreateTableRowServiceTest.java
  application/service/UpdateTableRowServiceTest.java
  application/service/DeleteTableRowServiceTest.java
  infrastructure/persistence/PayrollTableRowManagementAdapterTest.java
```

**Modified files:**
```
src/main/java/com/b4rrhh/payroll/basesalary/infrastructure/persistence/repository/PayrollTableRowRepository.java
openapi/personnel-administration-api.yaml
```

### Designer (`b4rrhh_designer`)

**New files:**
```
src/app/objects/api/tableRowsApi.ts
src/app/objects/useTableRows.ts
src/app/objects/CreateTableModal.tsx
src/app/objects/TableRowModal.tsx
src/app/objects/TableRowPanel.tsx
```

**Modified files:**
```
src/app/objects/ObjectsPage.tsx
src/app/objects/api/objectsApi.ts
```

---

## Task 1: Domain model, port, and exceptions

**Repo:** `b4rrhh_backend`

**Files:**
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/domain/model/PayrollTableRow.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/domain/port/PayrollTableRowManagementPort.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/domain/exception/PayrollTableAlreadyExistsException.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/domain/exception/TableRowNotFoundException.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/domain/exception/TableRowAlreadyExistsException.java`

- [ ] **Step 1: Create `PayrollTableRow` domain model**

```java
// PayrollTableRow.java
package com.b4rrhh.payroll_engine.table.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PayrollTableRow {

    private final Long id;
    private final String ruleSystemCode;
    private final String tableCode;
    private final String searchCode;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final BigDecimal monthlyValue;
    private final BigDecimal annualValue;
    private final BigDecimal dailyValue;
    private final BigDecimal hourlyValue;
    private final boolean active;

    public PayrollTableRow(
            Long id,
            String ruleSystemCode,
            String tableCode,
            String searchCode,
            LocalDate startDate,
            LocalDate endDate,
            BigDecimal monthlyValue,
            BigDecimal annualValue,
            BigDecimal dailyValue,
            BigDecimal hourlyValue,
            boolean active
    ) {
        this.id = id;
        this.ruleSystemCode = ruleSystemCode;
        this.tableCode = tableCode;
        this.searchCode = searchCode;
        this.startDate = startDate;
        this.endDate = endDate;
        this.monthlyValue = monthlyValue;
        this.annualValue = annualValue;
        this.dailyValue = dailyValue;
        this.hourlyValue = hourlyValue;
        this.active = active;
    }

    public Long getId() { return id; }
    public String getRuleSystemCode() { return ruleSystemCode; }
    public String getTableCode() { return tableCode; }
    public String getSearchCode() { return searchCode; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public BigDecimal getMonthlyValue() { return monthlyValue; }
    public BigDecimal getAnnualValue() { return annualValue; }
    public BigDecimal getDailyValue() { return dailyValue; }
    public BigDecimal getHourlyValue() { return hourlyValue; }
    public boolean isActive() { return active; }
}
```

- [ ] **Step 2: Create `PayrollTableRowManagementPort`**

```java
// PayrollTableRowManagementPort.java
package com.b4rrhh.payroll_engine.table.domain.port;

import com.b4rrhh.payroll_engine.table.domain.model.PayrollTableRow;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PayrollTableRowManagementPort {
    List<PayrollTableRow> findAllByTableCode(String ruleSystemCode, String tableCode);
    PayrollTableRow save(PayrollTableRow row);
    Optional<PayrollTableRow> findById(Long id);
    void deleteById(Long id);
    boolean existsByBusinessKey(String ruleSystemCode, String tableCode, String searchCode, LocalDate startDate);
}
```

- [ ] **Step 3: Create domain exceptions**

```java
// PayrollTableAlreadyExistsException.java
package com.b4rrhh.payroll_engine.table.domain.exception;

public class PayrollTableAlreadyExistsException extends RuntimeException {
    public PayrollTableAlreadyExistsException(String ruleSystemCode, String objectCode) {
        super("Salary table already exists: ruleSystemCode=" + ruleSystemCode + ", objectCode=" + objectCode);
    }
}
```

```java
// TableRowNotFoundException.java
package com.b4rrhh.payroll_engine.table.domain.exception;

public class TableRowNotFoundException extends RuntimeException {
    public TableRowNotFoundException(Long id) {
        super("Table row not found: id=" + id);
    }
}
```

```java
// TableRowAlreadyExistsException.java
package com.b4rrhh.payroll_engine.table.domain.exception;

import java.time.LocalDate;

public class TableRowAlreadyExistsException extends RuntimeException {
    public TableRowAlreadyExistsException(String tableCode, String searchCode, LocalDate startDate) {
        super("Table row already exists: tableCode=" + tableCode
                + ", searchCode=" + searchCode + ", startDate=" + startDate);
    }
}
```

- [ ] **Step 4: Compile check**

Run from `b4rrhh_backend`:
```bash
mvn compile -q
```
Expected: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/b4rrhh/payroll_engine/table/
git commit -m "feat(table): domain model, management port, and exceptions"
```

---

## Task 2: Extend Spring Data repository + persistence adapter

**Repo:** `b4rrhh_backend`

**Files:**
- Modify: `src/main/java/com/b4rrhh/payroll/basesalary/infrastructure/persistence/repository/PayrollTableRowRepository.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/infrastructure/persistence/PayrollTableRowManagementAdapter.java`
- Create: `src/test/java/com/b4rrhh/payroll_engine/table/infrastructure/persistence/PayrollTableRowManagementAdapterTest.java`

- [ ] **Step 1: Write the failing DataJpaTest**

```java
// PayrollTableRowManagementAdapterTest.java
package com.b4rrhh.payroll_engine.table.infrastructure.persistence;

import com.b4rrhh.payroll_engine.table.domain.model.PayrollTableRow;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.flyway.enabled=true"
})
@Import(PayrollTableRowManagementAdapter.class)
class PayrollTableRowManagementAdapterTest {

    @TempDir
    static Path tempDir;

    @Autowired
    private PayrollTableRowManagementAdapter adapter;

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) throws IOException {
        Path migrationDirectory = Files.createDirectories(tempDir.resolve("flyway-table-row"));
        copyMigration(migrationDirectory, "V53__create_payroll_tables.sql");
        copyMigration(migrationDirectory, "V64__create_payroll_table_row_table.sql");
        registry.add("spring.flyway.locations", () -> "filesystem:" + migrationDirectory.toAbsolutePath());
    }

    @Test
    void savesAndFindsRowsByTableCode() {
        PayrollTableRow row = new PayrollTableRow(
                null, "ESP", "SB_TEST", "SB-G1",
                LocalDate.of(2024, 1, 1), null,
                new BigDecimal("1800.00"), new BigDecimal("21600.00"),
                new BigDecimal("60.00"), new BigDecimal("7.50"),
                true
        );
        adapter.save(row);

        List<PayrollTableRow> rows = adapter.findAllByTableCode("ESP", "SB_TEST");
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getSearchCode()).isEqualTo("SB-G1");
        assertThat(rows.get(0).getMonthlyValue()).isEqualByComparingTo("1800.00");
        assertThat(rows.get(0).getId()).isNotNull();
    }

    @Test
    void findsRowById() {
        PayrollTableRow saved = adapter.save(new PayrollTableRow(
                null, "ESP", "SB_TEST", "SB-G2",
                LocalDate.of(2024, 1, 1), null,
                new BigDecimal("1400.00"), new BigDecimal("16800.00"),
                new BigDecimal("46.67"), new BigDecimal("5.83"),
                true
        ));

        Optional<PayrollTableRow> found = adapter.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getSearchCode()).isEqualTo("SB-G2");
    }

    @Test
    void deletesRowById() {
        PayrollTableRow saved = adapter.save(new PayrollTableRow(
                null, "ESP", "SB_TEST", "SB-G3",
                LocalDate.of(2024, 1, 1), null,
                new BigDecimal("1200.00"), new BigDecimal("14400.00"),
                new BigDecimal("40.00"), new BigDecimal("5.00"),
                true
        ));

        adapter.deleteById(saved.getId());

        assertThat(adapter.findById(saved.getId())).isEmpty();
    }

    @Test
    void detectsDuplicateByBusinessKey() {
        adapter.save(new PayrollTableRow(
                null, "ESP", "SB_TEST", "SB-G4",
                LocalDate.of(2024, 1, 1), null,
                new BigDecimal("1000.00"), new BigDecimal("12000.00"),
                new BigDecimal("33.33"), new BigDecimal("4.17"),
                true
        ));

        boolean exists = adapter.existsByBusinessKey("ESP", "SB_TEST", "SB-G4", LocalDate.of(2024, 1, 1));
        assertThat(exists).isTrue();

        boolean notExists = adapter.existsByBusinessKey("ESP", "SB_TEST", "SB-G4", LocalDate.of(2025, 1, 1));
        assertThat(notExists).isFalse();
    }

    private static void copyMigration(Path dir, String fileName) throws IOException {
        Path target = dir.resolve(fileName);
        try (InputStream in = PayrollTableRowManagementAdapterTest.class
                .getClassLoader()
                .getResourceAsStream("db/migration/" + fileName)) {
            if (in == null) throw new IllegalStateException("Migration not found: " + fileName);
            Files.copy(in, target);
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
mvn test -Dtest=PayrollTableRowManagementAdapterTest -q
```
Expected: FAIL — `PayrollTableRowManagementAdapter` does not exist yet.

- [ ] **Step 3: Add management methods to `PayrollTableRowRepository`**

Add these two methods to the existing file (keep all existing methods):

```java
// Add to PayrollTableRowRepository (after existing methods)

List<PayrollTableRowEntity> findByRuleSystemCodeAndTableCodeOrderBySearchCodeAscStartDateAsc(
        String ruleSystemCode, String tableCode);

boolean existsByRuleSystemCodeAndTableCodeAndSearchCodeAndStartDate(
        String ruleSystemCode, String tableCode, String searchCode, LocalDate startDate);
```

Also add to the import block at the top of the file (if not already present):
```java
import java.util.List;
```

- [ ] **Step 4: Create `PayrollTableRowManagementAdapter`**

```java
// PayrollTableRowManagementAdapter.java
package com.b4rrhh.payroll_engine.table.infrastructure.persistence;

import com.b4rrhh.payroll.basesalary.infrastructure.persistence.entity.PayrollTableRowEntity;
import com.b4rrhh.payroll.basesalary.infrastructure.persistence.repository.PayrollTableRowRepository;
import com.b4rrhh.payroll_engine.table.domain.model.PayrollTableRow;
import com.b4rrhh.payroll_engine.table.domain.port.PayrollTableRowManagementPort;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
public class PayrollTableRowManagementAdapter implements PayrollTableRowManagementPort {

    private final PayrollTableRowRepository repository;

    public PayrollTableRowManagementAdapter(PayrollTableRowRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<PayrollTableRow> findAllByTableCode(String ruleSystemCode, String tableCode) {
        return repository.findByRuleSystemCodeAndTableCodeOrderBySearchCodeAscStartDateAsc(ruleSystemCode, tableCode)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public PayrollTableRow save(PayrollTableRow row) {
        PayrollTableRowEntity entity = toEntity(row);
        return toDomain(repository.save(entity));
    }

    @Override
    public Optional<PayrollTableRow> findById(Long id) {
        return repository.findById(id).map(this::toDomain);
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    @Override
    public boolean existsByBusinessKey(String ruleSystemCode, String tableCode, String searchCode, LocalDate startDate) {
        return repository.existsByRuleSystemCodeAndTableCodeAndSearchCodeAndStartDate(
                ruleSystemCode, tableCode, searchCode, startDate);
    }

    private PayrollTableRowEntity toEntity(PayrollTableRow domain) {
        PayrollTableRowEntity entity = new PayrollTableRowEntity();
        if (domain.getId() != null) entity.setId(domain.getId());
        entity.setRuleSystemCode(domain.getRuleSystemCode());
        entity.setTableCode(domain.getTableCode());
        entity.setSearchCode(domain.getSearchCode());
        entity.setStartDate(domain.getStartDate());
        entity.setEndDate(domain.getEndDate());
        entity.setMonthlyValue(domain.getMonthlyValue());
        entity.setAnnualValue(domain.getAnnualValue());
        entity.setDailyValue(domain.getDailyValue());
        entity.setHourlyValue(domain.getHourlyValue());
        entity.setActive(domain.isActive());
        return entity;
    }

    private PayrollTableRow toDomain(PayrollTableRowEntity entity) {
        return new PayrollTableRow(
                entity.getId(),
                entity.getRuleSystemCode(),
                entity.getTableCode(),
                entity.getSearchCode(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getMonthlyValue(),
                entity.getAnnualValue(),
                entity.getDailyValue(),
                entity.getHourlyValue(),
                entity.getActive()
        );
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
mvn test -Dtest=PayrollTableRowManagementAdapterTest -q
```
Expected: `Tests run: 4, Failures: 0, Errors: 0`

- [ ] **Step 6: Commit**

```bash
git add src/main/java/com/b4rrhh/payroll/basesalary/infrastructure/persistence/repository/PayrollTableRowRepository.java
git add src/main/java/com/b4rrhh/payroll_engine/table/infrastructure/persistence/PayrollTableRowManagementAdapter.java
git add src/test/java/com/b4rrhh/payroll_engine/table/infrastructure/persistence/PayrollTableRowManagementAdapterTest.java
git commit -m "feat(table): persistence adapter for table row management"
```

---

## Task 3: CreatePayrollTable service and use case

**Repo:** `b4rrhh_backend`

**Files:**
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/application/usecase/CreatePayrollTableCommand.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/application/usecase/CreatePayrollTableUseCase.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/application/service/CreatePayrollTableService.java`
- Create: `src/test/java/com/b4rrhh/payroll_engine/table/application/service/CreatePayrollTableServiceTest.java`

- [ ] **Step 1: Write the failing service test**

```java
// CreatePayrollTableServiceTest.java
package com.b4rrhh.payroll_engine.table.application.service;

import com.b4rrhh.payroll_engine.object.domain.model.PayrollObject;
import com.b4rrhh.payroll_engine.object.domain.model.PayrollObjectTypeCode;
import com.b4rrhh.payroll_engine.object.domain.port.PayrollObjectRepository;
import com.b4rrhh.payroll_engine.table.application.usecase.CreatePayrollTableCommand;
import com.b4rrhh.payroll_engine.table.domain.exception.PayrollTableAlreadyExistsException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreatePayrollTableServiceTest {

    @Mock
    private PayrollObjectRepository objectRepository;

    @InjectMocks
    private CreatePayrollTableService service;

    @Test
    void createsTableWhenCodeIsNew() {
        CreatePayrollTableCommand command = new CreatePayrollTableCommand("ESP", "SB_TEST");
        when(objectRepository.existsByBusinessKey("ESP", PayrollObjectTypeCode.TABLE, "SB_TEST"))
                .thenReturn(false);
        when(objectRepository.save(any(PayrollObject.class))).thenAnswer(inv -> {
            PayrollObject input = inv.getArgument(0);
            return new PayrollObject(10L, input.getRuleSystemCode(), input.getObjectTypeCode(),
                    input.getObjectCode(), LocalDateTime.now(), LocalDateTime.now());
        });

        PayrollObject result = service.create(command);

        ArgumentCaptor<PayrollObject> captor = ArgumentCaptor.forClass(PayrollObject.class);
        verify(objectRepository).save(captor.capture());
        assertThat(captor.getValue().getRuleSystemCode()).isEqualTo("ESP");
        assertThat(captor.getValue().getObjectTypeCode()).isEqualTo(PayrollObjectTypeCode.TABLE);
        assertThat(captor.getValue().getObjectCode()).isEqualTo("SB_TEST");
        assertThat(result.getId()).isEqualTo(10L);
    }

    @Test
    void rejectsCreationWhenCodeAlreadyExists() {
        CreatePayrollTableCommand command = new CreatePayrollTableCommand("ESP", "SB_TEST");
        when(objectRepository.existsByBusinessKey("ESP", PayrollObjectTypeCode.TABLE, "SB_TEST"))
                .thenReturn(true);

        assertThatThrownBy(() -> service.create(command))
                .isInstanceOf(PayrollTableAlreadyExistsException.class);

        verify(objectRepository, never()).save(any());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
mvn test -Dtest=CreatePayrollTableServiceTest -q
```
Expected: FAIL — classes don't exist yet.

- [ ] **Step 3: Implement command, use case, and service**

```java
// CreatePayrollTableCommand.java
package com.b4rrhh.payroll_engine.table.application.usecase;

public record CreatePayrollTableCommand(String ruleSystemCode, String objectCode) {}
```

```java
// CreatePayrollTableUseCase.java
package com.b4rrhh.payroll_engine.table.application.usecase;

import com.b4rrhh.payroll_engine.object.domain.model.PayrollObject;

public interface CreatePayrollTableUseCase {
    PayrollObject create(CreatePayrollTableCommand command);
}
```

```java
// CreatePayrollTableService.java
package com.b4rrhh.payroll_engine.table.application.service;

import com.b4rrhh.payroll_engine.object.domain.model.PayrollObject;
import com.b4rrhh.payroll_engine.object.domain.model.PayrollObjectTypeCode;
import com.b4rrhh.payroll_engine.object.domain.port.PayrollObjectRepository;
import com.b4rrhh.payroll_engine.table.application.usecase.CreatePayrollTableCommand;
import com.b4rrhh.payroll_engine.table.application.usecase.CreatePayrollTableUseCase;
import com.b4rrhh.payroll_engine.table.domain.exception.PayrollTableAlreadyExistsException;
import org.springframework.stereotype.Service;

@Service
public class CreatePayrollTableService implements CreatePayrollTableUseCase {

    private final PayrollObjectRepository objectRepository;

    public CreatePayrollTableService(PayrollObjectRepository objectRepository) {
        this.objectRepository = objectRepository;
    }

    @Override
    public PayrollObject create(CreatePayrollTableCommand command) {
        if (objectRepository.existsByBusinessKey(command.ruleSystemCode(), PayrollObjectTypeCode.TABLE, command.objectCode())) {
            throw new PayrollTableAlreadyExistsException(command.ruleSystemCode(), command.objectCode());
        }
        return objectRepository.save(new PayrollObject(
                null, command.ruleSystemCode(), PayrollObjectTypeCode.TABLE, command.objectCode(), null, null
        ));
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
mvn test -Dtest=CreatePayrollTableServiceTest -q
```
Expected: `Tests run: 2, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add src/main/java/com/b4rrhh/payroll_engine/table/application/
git add src/test/java/com/b4rrhh/payroll_engine/table/application/service/CreatePayrollTableServiceTest.java
git commit -m "feat(table): CreatePayrollTable use case and service"
```

---

## Task 4: Row services (list, create, update, delete)

**Repo:** `b4rrhh_backend`

**Files:**
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/application/usecase/ListTableRowsUseCase.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/application/usecase/CreateTableRowCommand.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/application/usecase/CreateTableRowUseCase.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/application/usecase/UpdateTableRowCommand.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/application/usecase/UpdateTableRowUseCase.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/application/usecase/DeleteTableRowUseCase.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/application/service/ListTableRowsService.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/application/service/CreateTableRowService.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/application/service/UpdateTableRowService.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/application/service/DeleteTableRowService.java`
- Create: `src/test/java/com/b4rrhh/payroll_engine/table/application/service/CreateTableRowServiceTest.java`
- Create: `src/test/java/com/b4rrhh/payroll_engine/table/application/service/UpdateTableRowServiceTest.java`
- Create: `src/test/java/com/b4rrhh/payroll_engine/table/application/service/DeleteTableRowServiceTest.java`

- [ ] **Step 1: Write failing tests for all three mutating services**

```java
// CreateTableRowServiceTest.java
package com.b4rrhh.payroll_engine.table.application.service;

import com.b4rrhh.payroll_engine.table.application.usecase.CreateTableRowCommand;
import com.b4rrhh.payroll_engine.table.domain.exception.TableRowAlreadyExistsException;
import com.b4rrhh.payroll_engine.table.domain.model.PayrollTableRow;
import com.b4rrhh.payroll_engine.table.domain.port.PayrollTableRowManagementPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreateTableRowServiceTest {

    @Mock
    private PayrollTableRowManagementPort port;

    @InjectMocks
    private CreateTableRowService service;

    @Test
    void createsRowWhenBusinessKeyIsNew() {
        CreateTableRowCommand cmd = new CreateTableRowCommand(
                "ESP", "SB_TEST", "SB-G1",
                LocalDate.of(2024, 1, 1), null,
                new BigDecimal("1800.00"), new BigDecimal("21600.00"),
                new BigDecimal("60.00"), new BigDecimal("7.50")
        );
        when(port.existsByBusinessKey("ESP", "SB_TEST", "SB-G1", LocalDate.of(2024, 1, 1)))
                .thenReturn(false);
        when(port.save(any())).thenAnswer(inv -> {
            PayrollTableRow r = inv.getArgument(0);
            return new PayrollTableRow(1L, r.getRuleSystemCode(), r.getTableCode(), r.getSearchCode(),
                    r.getStartDate(), r.getEndDate(), r.getMonthlyValue(), r.getAnnualValue(),
                    r.getDailyValue(), r.getHourlyValue(), r.isActive());
        });

        PayrollTableRow result = service.create(cmd);

        ArgumentCaptor<PayrollTableRow> captor = ArgumentCaptor.forClass(PayrollTableRow.class);
        verify(port).save(captor.capture());
        assertThat(captor.getValue().getSearchCode()).isEqualTo("SB-G1");
        assertThat(captor.getValue().isActive()).isTrue();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void rejectsDuplicateBusinessKey() {
        CreateTableRowCommand cmd = new CreateTableRowCommand(
                "ESP", "SB_TEST", "SB-G1",
                LocalDate.of(2024, 1, 1), null,
                new BigDecimal("1800.00"), new BigDecimal("21600.00"),
                new BigDecimal("60.00"), new BigDecimal("7.50")
        );
        when(port.existsByBusinessKey("ESP", "SB_TEST", "SB-G1", LocalDate.of(2024, 1, 1)))
                .thenReturn(true);

        assertThatThrownBy(() -> service.create(cmd))
                .isInstanceOf(TableRowAlreadyExistsException.class);

        verify(port, never()).save(any());
    }
}
```

```java
// UpdateTableRowServiceTest.java
package com.b4rrhh.payroll_engine.table.application.service;

import com.b4rrhh.payroll_engine.table.application.usecase.UpdateTableRowCommand;
import com.b4rrhh.payroll_engine.table.domain.exception.TableRowNotFoundException;
import com.b4rrhh.payroll_engine.table.domain.model.PayrollTableRow;
import com.b4rrhh.payroll_engine.table.domain.port.PayrollTableRowManagementPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UpdateTableRowServiceTest {

    @Mock
    private PayrollTableRowManagementPort port;

    @InjectMocks
    private UpdateTableRowService service;

    @Test
    void updatesOnlyProvidedFields() {
        PayrollTableRow existing = new PayrollTableRow(
                5L, "ESP", "SB_TEST", "SB-G1",
                LocalDate.of(2024, 1, 1), null,
                new BigDecimal("1800.00"), new BigDecimal("21600.00"),
                new BigDecimal("60.00"), new BigDecimal("7.50"), true
        );
        when(port.findById(5L)).thenReturn(Optional.of(existing));
        when(port.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateTableRowCommand cmd = new UpdateTableRowCommand(5L, null, null, null,
                new BigDecimal("2000.00"), null, null, null, null);
        service.update(cmd);

        ArgumentCaptor<PayrollTableRow> captor = ArgumentCaptor.forClass(PayrollTableRow.class);
        verify(port).save(captor.capture());
        assertThat(captor.getValue().getMonthlyValue()).isEqualByComparingTo("2000.00");
        assertThat(captor.getValue().getSearchCode()).isEqualTo("SB-G1");
    }

    @Test
    void throwsNotFoundWhenRowDoesNotExist() {
        when(port.findById(99L)).thenReturn(Optional.empty());
        UpdateTableRowCommand cmd = new UpdateTableRowCommand(99L, null, null, null, null, null, null, null, null);

        assertThatThrownBy(() -> service.update(cmd))
                .isInstanceOf(TableRowNotFoundException.class);
    }
}
```

```java
// DeleteTableRowServiceTest.java
package com.b4rrhh.payroll_engine.table.application.service;

import com.b4rrhh.payroll_engine.table.domain.exception.TableRowNotFoundException;
import com.b4rrhh.payroll_engine.table.domain.model.PayrollTableRow;
import com.b4rrhh.payroll_engine.table.domain.port.PayrollTableRowManagementPort;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeleteTableRowServiceTest {

    @Mock
    private PayrollTableRowManagementPort port;

    @InjectMocks
    private DeleteTableRowService service;

    @Test
    void deletesRowWhenFound() {
        PayrollTableRow row = new PayrollTableRow(7L, "ESP", "SB_TEST", "SB-G1",
                LocalDate.of(2024, 1, 1), null,
                new BigDecimal("1800.00"), new BigDecimal("21600.00"),
                new BigDecimal("60.00"), new BigDecimal("7.50"), true);
        when(port.findById(7L)).thenReturn(Optional.of(row));

        service.delete(7L);

        verify(port).deleteById(7L);
    }

    @Test
    void throwsNotFoundWhenRowDoesNotExist() {
        when(port.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(99L))
                .isInstanceOf(TableRowNotFoundException.class);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
mvn test -Dtest="CreateTableRowServiceTest,UpdateTableRowServiceTest,DeleteTableRowServiceTest" -q
```
Expected: FAIL — classes don't exist.

- [ ] **Step 3: Create use case interfaces and commands**

```java
// ListTableRowsUseCase.java
package com.b4rrhh.payroll_engine.table.application.usecase;

import com.b4rrhh.payroll_engine.table.domain.model.PayrollTableRow;
import java.util.List;

public interface ListTableRowsUseCase {
    List<PayrollTableRow> list(String ruleSystemCode, String tableCode);
}
```

```java
// CreateTableRowCommand.java
package com.b4rrhh.payroll_engine.table.application.usecase;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateTableRowCommand(
        String ruleSystemCode,
        String tableCode,
        String searchCode,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal monthlyValue,
        BigDecimal annualValue,
        BigDecimal dailyValue,
        BigDecimal hourlyValue
) {}
```

```java
// CreateTableRowUseCase.java
package com.b4rrhh.payroll_engine.table.application.usecase;

import com.b4rrhh.payroll_engine.table.domain.model.PayrollTableRow;

public interface CreateTableRowUseCase {
    PayrollTableRow create(CreateTableRowCommand command);
}
```

```java
// UpdateTableRowCommand.java
package com.b4rrhh.payroll_engine.table.application.usecase;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateTableRowCommand(
        Long id,
        String searchCode,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal monthlyValue,
        BigDecimal annualValue,
        BigDecimal dailyValue,
        BigDecimal hourlyValue,
        Boolean active
) {}
```

```java
// UpdateTableRowUseCase.java
package com.b4rrhh.payroll_engine.table.application.usecase;

import com.b4rrhh.payroll_engine.table.domain.model.PayrollTableRow;

public interface UpdateTableRowUseCase {
    PayrollTableRow update(UpdateTableRowCommand command);
}
```

```java
// DeleteTableRowUseCase.java
package com.b4rrhh.payroll_engine.table.application.usecase;

public interface DeleteTableRowUseCase {
    void delete(Long id);
}
```

- [ ] **Step 4: Implement the four services**

```java
// ListTableRowsService.java
package com.b4rrhh.payroll_engine.table.application.service;

import com.b4rrhh.payroll_engine.table.application.usecase.ListTableRowsUseCase;
import com.b4rrhh.payroll_engine.table.domain.model.PayrollTableRow;
import com.b4rrhh.payroll_engine.table.domain.port.PayrollTableRowManagementPort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ListTableRowsService implements ListTableRowsUseCase {

    private final PayrollTableRowManagementPort port;

    public ListTableRowsService(PayrollTableRowManagementPort port) {
        this.port = port;
    }

    @Override
    public List<PayrollTableRow> list(String ruleSystemCode, String tableCode) {
        return port.findAllByTableCode(ruleSystemCode, tableCode);
    }
}
```

```java
// CreateTableRowService.java
package com.b4rrhh.payroll_engine.table.application.service;

import com.b4rrhh.payroll_engine.table.application.usecase.CreateTableRowCommand;
import com.b4rrhh.payroll_engine.table.application.usecase.CreateTableRowUseCase;
import com.b4rrhh.payroll_engine.table.domain.exception.TableRowAlreadyExistsException;
import com.b4rrhh.payroll_engine.table.domain.model.PayrollTableRow;
import com.b4rrhh.payroll_engine.table.domain.port.PayrollTableRowManagementPort;
import org.springframework.stereotype.Service;

@Service
public class CreateTableRowService implements CreateTableRowUseCase {

    private final PayrollTableRowManagementPort port;

    public CreateTableRowService(PayrollTableRowManagementPort port) {
        this.port = port;
    }

    @Override
    public PayrollTableRow create(CreateTableRowCommand cmd) {
        if (port.existsByBusinessKey(cmd.ruleSystemCode(), cmd.tableCode(), cmd.searchCode(), cmd.startDate())) {
            throw new TableRowAlreadyExistsException(cmd.tableCode(), cmd.searchCode(), cmd.startDate());
        }
        return port.save(new PayrollTableRow(
                null, cmd.ruleSystemCode(), cmd.tableCode(), cmd.searchCode(),
                cmd.startDate(), cmd.endDate(),
                cmd.monthlyValue(), cmd.annualValue(), cmd.dailyValue(), cmd.hourlyValue(),
                true
        ));
    }
}
```

```java
// UpdateTableRowService.java
package com.b4rrhh.payroll_engine.table.application.service;

import com.b4rrhh.payroll_engine.table.application.usecase.UpdateTableRowCommand;
import com.b4rrhh.payroll_engine.table.application.usecase.UpdateTableRowUseCase;
import com.b4rrhh.payroll_engine.table.domain.exception.TableRowNotFoundException;
import com.b4rrhh.payroll_engine.table.domain.model.PayrollTableRow;
import com.b4rrhh.payroll_engine.table.domain.port.PayrollTableRowManagementPort;
import org.springframework.stereotype.Service;

@Service
public class UpdateTableRowService implements UpdateTableRowUseCase {

    private final PayrollTableRowManagementPort port;

    public UpdateTableRowService(PayrollTableRowManagementPort port) {
        this.port = port;
    }

    @Override
    public PayrollTableRow update(UpdateTableRowCommand cmd) {
        PayrollTableRow existing = port.findById(cmd.id())
                .orElseThrow(() -> new TableRowNotFoundException(cmd.id()));

        return port.save(new PayrollTableRow(
                existing.getId(),
                existing.getRuleSystemCode(),
                existing.getTableCode(),
                cmd.searchCode()     != null ? cmd.searchCode()     : existing.getSearchCode(),
                cmd.startDate()      != null ? cmd.startDate()      : existing.getStartDate(),
                cmd.endDate()        != null ? cmd.endDate()        : existing.getEndDate(),
                cmd.monthlyValue()   != null ? cmd.monthlyValue()   : existing.getMonthlyValue(),
                cmd.annualValue()    != null ? cmd.annualValue()    : existing.getAnnualValue(),
                cmd.dailyValue()     != null ? cmd.dailyValue()     : existing.getDailyValue(),
                cmd.hourlyValue()    != null ? cmd.hourlyValue()    : existing.getHourlyValue(),
                cmd.active()         != null ? cmd.active()         : existing.isActive()
        ));
    }
}
```

```java
// DeleteTableRowService.java
package com.b4rrhh.payroll_engine.table.application.service;

import com.b4rrhh.payroll_engine.table.application.usecase.DeleteTableRowUseCase;
import com.b4rrhh.payroll_engine.table.domain.exception.TableRowNotFoundException;
import com.b4rrhh.payroll_engine.table.domain.port.PayrollTableRowManagementPort;
import org.springframework.stereotype.Service;

@Service
public class DeleteTableRowService implements DeleteTableRowUseCase {

    private final PayrollTableRowManagementPort port;

    public DeleteTableRowService(PayrollTableRowManagementPort port) {
        this.port = port;
    }

    @Override
    public void delete(Long id) {
        port.findById(id).orElseThrow(() -> new TableRowNotFoundException(id));
        port.deleteById(id);
    }
}
```

- [ ] **Step 5: Run all row service tests**

```bash
mvn test -Dtest="CreateTableRowServiceTest,UpdateTableRowServiceTest,DeleteTableRowServiceTest" -q
```
Expected: `Tests run: 5, Failures: 0, Errors: 0`

- [ ] **Step 6: Commit**

```bash
git add src/main/java/com/b4rrhh/payroll_engine/table/application/
git add src/test/java/com/b4rrhh/payroll_engine/table/application/service/
git commit -m "feat(table): row CRUD use cases and services"
```

---

## Task 5: REST controllers and exception handler

**Repo:** `b4rrhh_backend`

**Files:**
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/infrastructure/web/CreatePayrollTableRequest.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/infrastructure/web/PayrollTableResponse.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/infrastructure/web/CreateTableRowRequest.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/infrastructure/web/UpdateTableRowRequest.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/infrastructure/web/TableRowResponse.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/infrastructure/web/PayrollTableManagementController.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/infrastructure/web/PayrollTableRowManagementController.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/table/infrastructure/web/PayrollTableExceptionHandler.java`

- [ ] **Step 1: Create DTOs**

```java
// CreatePayrollTableRequest.java
package com.b4rrhh.payroll_engine.table.infrastructure.web;

import jakarta.validation.constraints.NotBlank;

public record CreatePayrollTableRequest(@NotBlank String objectCode) {}
```

```java
// PayrollTableResponse.java
package com.b4rrhh.payroll_engine.table.infrastructure.web;

public record PayrollTableResponse(String ruleSystemCode, String objectCode) {}
```

```java
// CreateTableRowRequest.java
package com.b4rrhh.payroll_engine.table.infrastructure.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateTableRowRequest(
        @NotBlank String searchCode,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        @NotNull BigDecimal monthlyValue,
        @NotNull BigDecimal annualValue,
        @NotNull BigDecimal dailyValue,
        @NotNull BigDecimal hourlyValue
) {}
```

```java
// UpdateTableRowRequest.java
package com.b4rrhh.payroll_engine.table.infrastructure.web;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateTableRowRequest(
        String searchCode,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal monthlyValue,
        BigDecimal annualValue,
        BigDecimal dailyValue,
        BigDecimal hourlyValue,
        Boolean active
) {}
```

```java
// TableRowResponse.java
package com.b4rrhh.payroll_engine.table.infrastructure.web;

import com.b4rrhh.payroll_engine.table.domain.model.PayrollTableRow;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TableRowResponse(
        Long id,
        String searchCode,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal monthlyValue,
        BigDecimal annualValue,
        BigDecimal dailyValue,
        BigDecimal hourlyValue,
        boolean active
) {
    static TableRowResponse from(PayrollTableRow row) {
        return new TableRowResponse(
                row.getId(), row.getSearchCode(), row.getStartDate(), row.getEndDate(),
                row.getMonthlyValue(), row.getAnnualValue(), row.getDailyValue(), row.getHourlyValue(),
                row.isActive()
        );
    }
}
```

- [ ] **Step 2: Create `PayrollTableManagementController`**

```java
// PayrollTableManagementController.java
package com.b4rrhh.payroll_engine.table.infrastructure.web;

import com.b4rrhh.payroll_engine.object.domain.model.PayrollObject;
import com.b4rrhh.payroll_engine.table.application.usecase.CreatePayrollTableCommand;
import com.b4rrhh.payroll_engine.table.application.usecase.CreatePayrollTableUseCase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payroll-engine/{ruleSystemCode}/tables")
public class PayrollTableManagementController {

    private final CreatePayrollTableUseCase createPayrollTableUseCase;

    public PayrollTableManagementController(CreatePayrollTableUseCase createPayrollTableUseCase) {
        this.createPayrollTableUseCase = createPayrollTableUseCase;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PayrollTableResponse create(
            @PathVariable String ruleSystemCode,
            @Valid @RequestBody CreatePayrollTableRequest request
    ) {
        PayrollObject saved = createPayrollTableUseCase.create(
                new CreatePayrollTableCommand(ruleSystemCode, request.objectCode())
        );
        return new PayrollTableResponse(saved.getRuleSystemCode(), saved.getObjectCode());
    }
}
```

- [ ] **Step 3: Create `PayrollTableRowManagementController`**

```java
// PayrollTableRowManagementController.java
package com.b4rrhh.payroll_engine.table.infrastructure.web;

import com.b4rrhh.payroll_engine.table.application.usecase.CreateTableRowCommand;
import com.b4rrhh.payroll_engine.table.application.usecase.CreateTableRowUseCase;
import com.b4rrhh.payroll_engine.table.application.usecase.DeleteTableRowUseCase;
import com.b4rrhh.payroll_engine.table.application.usecase.ListTableRowsUseCase;
import com.b4rrhh.payroll_engine.table.application.usecase.UpdateTableRowCommand;
import com.b4rrhh.payroll_engine.table.application.usecase.UpdateTableRowUseCase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/payroll-engine/{ruleSystemCode}/tables/{tableCode}/rows")
public class PayrollTableRowManagementController {

    private final ListTableRowsUseCase listTableRowsUseCase;
    private final CreateTableRowUseCase createTableRowUseCase;
    private final UpdateTableRowUseCase updateTableRowUseCase;
    private final DeleteTableRowUseCase deleteTableRowUseCase;

    public PayrollTableRowManagementController(
            ListTableRowsUseCase listTableRowsUseCase,
            CreateTableRowUseCase createTableRowUseCase,
            UpdateTableRowUseCase updateTableRowUseCase,
            DeleteTableRowUseCase deleteTableRowUseCase
    ) {
        this.listTableRowsUseCase = listTableRowsUseCase;
        this.createTableRowUseCase = createTableRowUseCase;
        this.updateTableRowUseCase = updateTableRowUseCase;
        this.deleteTableRowUseCase = deleteTableRowUseCase;
    }

    @GetMapping
    public List<TableRowResponse> list(
            @PathVariable String ruleSystemCode,
            @PathVariable String tableCode
    ) {
        return listTableRowsUseCase.list(ruleSystemCode, tableCode)
                .stream()
                .map(TableRowResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TableRowResponse create(
            @PathVariable String ruleSystemCode,
            @PathVariable String tableCode,
            @Valid @RequestBody CreateTableRowRequest request
    ) {
        return TableRowResponse.from(createTableRowUseCase.create(new CreateTableRowCommand(
                ruleSystemCode, tableCode,
                request.searchCode(), request.startDate(), request.endDate(),
                request.monthlyValue(), request.annualValue(),
                request.dailyValue(), request.hourlyValue()
        )));
    }

    @PutMapping("/{rowId}")
    public TableRowResponse update(
            @PathVariable Long rowId,
            @RequestBody UpdateTableRowRequest request
    ) {
        return TableRowResponse.from(updateTableRowUseCase.update(new UpdateTableRowCommand(
                rowId, request.searchCode(), request.startDate(), request.endDate(),
                request.monthlyValue(), request.annualValue(),
                request.dailyValue(), request.hourlyValue(),
                request.active()
        )));
    }

    @DeleteMapping("/{rowId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long rowId) {
        deleteTableRowUseCase.delete(rowId);
    }
}
```

- [ ] **Step 4: Create exception handler**

```java
// PayrollTableExceptionHandler.java
package com.b4rrhh.payroll_engine.table.infrastructure.web;

import com.b4rrhh.payroll_engine.table.domain.exception.PayrollTableAlreadyExistsException;
import com.b4rrhh.payroll_engine.table.domain.exception.TableRowAlreadyExistsException;
import com.b4rrhh.payroll_engine.table.domain.exception.TableRowNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice(assignableTypes = {
        PayrollTableManagementController.class,
        PayrollTableRowManagementController.class
})
public class PayrollTableExceptionHandler {

    @ExceptionHandler(PayrollTableAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> handleTableAlreadyExists(PayrollTableAlreadyExistsException e) {
        return Map.of("error", e.getMessage());
    }

    @ExceptionHandler(TableRowAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> handleRowAlreadyExists(TableRowAlreadyExistsException e) {
        return Map.of("error", e.getMessage());
    }

    @ExceptionHandler(TableRowNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> handleRowNotFound(TableRowNotFoundException e) {
        return Map.of("error", e.getMessage());
    }
}
```

- [ ] **Step 5: Full compile and test run**

```bash
mvn test -q
```
Expected: all existing tests still pass, `BUILD SUCCESS`.

- [ ] **Step 6: Smoke test against running backend**

Start the backend (`mvn spring-boot:run`) and PostgreSQL Docker. Then:

```bash
# Create a new table
curl -s -X POST http://localhost:8080/payroll-engine/ESP/tables \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"objectCode":"TEST_TABLE_001"}' | jq .
# Expected: {"ruleSystemCode":"ESP","objectCode":"TEST_TABLE_001"}

# Add a row
curl -s -X POST http://localhost:8080/payroll-engine/ESP/tables/TEST_TABLE_001/rows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"searchCode":"T-G1","startDate":"2024-01-01","monthlyValue":1500.00,"annualValue":18000.00,"dailyValue":50.00,"hourlyValue":6.25}' | jq .
# Expected: {id, searchCode:"T-G1", ...}

# List rows
curl -s http://localhost:8080/payroll-engine/ESP/tables/TEST_TABLE_001/rows \
  -H "Authorization: Bearer <token>" | jq .
# Expected: [{...}]
```

- [ ] **Step 7: Commit**

```bash
git add src/main/java/com/b4rrhh/payroll_engine/table/infrastructure/
git commit -m "feat(table): REST controllers and exception handler for table + row management"
```

---

## Task 6: OpenAPI spec

**Repo:** `b4rrhh_backend`

**Files:**
- Modify: `openapi/personnel-administration-api.yaml`

- [ ] **Step 1: Add table schemas to the `components/schemas` section**

At the end of the `components/schemas` section, add:

```yaml
    CreatePayrollTableRequest:
      type: object
      required: [objectCode]
      properties:
        objectCode:
          type: string
          example: "SB_99002405012025"

    PayrollTableResponse:
      type: object
      properties:
        ruleSystemCode:
          type: string
        objectCode:
          type: string

    CreateTableRowRequest:
      type: object
      required: [searchCode, startDate, monthlyValue, annualValue, dailyValue, hourlyValue]
      properties:
        searchCode:
          type: string
          example: "99002405-G1"
        startDate:
          type: string
          format: date
        endDate:
          type: string
          format: date
          nullable: true
        monthlyValue:
          type: number
          format: double
        annualValue:
          type: number
          format: double
        dailyValue:
          type: number
          format: double
        hourlyValue:
          type: number
          format: double

    UpdateTableRowRequest:
      type: object
      properties:
        searchCode:
          type: string
          nullable: true
        startDate:
          type: string
          format: date
          nullable: true
        endDate:
          type: string
          format: date
          nullable: true
        monthlyValue:
          type: number
          format: double
          nullable: true
        annualValue:
          type: number
          format: double
          nullable: true
        dailyValue:
          type: number
          format: double
          nullable: true
        hourlyValue:
          type: number
          format: double
          nullable: true
        active:
          type: boolean
          nullable: true

    TableRowResponse:
      type: object
      properties:
        id:
          type: integer
          format: int64
        searchCode:
          type: string
        startDate:
          type: string
          format: date
        endDate:
          type: string
          format: date
          nullable: true
        monthlyValue:
          type: number
          format: double
        annualValue:
          type: number
          format: double
        dailyValue:
          type: number
          format: double
        hourlyValue:
          type: number
          format: double
        active:
          type: boolean
```

- [ ] **Step 2: Add paths to the `paths` section** (after existing `/payroll-engine` entries)

```yaml
  /payroll-engine/{ruleSystemCode}/tables:
    post:
      operationId: createPayrollTable
      summary: Create a new salary table
      tags: [PayrollEngine]
      parameters:
        - $ref: "#/components/parameters/RuleSystemCode"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreatePayrollTableRequest"
      responses:
        "201":
          description: Table created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PayrollTableResponse"
        "409":
          description: Table already exists

  /payroll-engine/{ruleSystemCode}/tables/{tableCode}/rows:
    get:
      operationId: listTableRows
      summary: List all rows for a salary table
      tags: [PayrollEngine]
      parameters:
        - $ref: "#/components/parameters/RuleSystemCode"
        - name: tableCode
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Rows listed
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/TableRowResponse"
    post:
      operationId: createTableRow
      summary: Add a row to a salary table
      tags: [PayrollEngine]
      parameters:
        - $ref: "#/components/parameters/RuleSystemCode"
        - name: tableCode
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateTableRowRequest"
      responses:
        "201":
          description: Row created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/TableRowResponse"
        "409":
          description: Row already exists

  /payroll-engine/{ruleSystemCode}/tables/{tableCode}/rows/{rowId}:
    put:
      operationId: updateTableRow
      summary: Update a salary table row
      tags: [PayrollEngine]
      parameters:
        - $ref: "#/components/parameters/RuleSystemCode"
        - name: tableCode
          in: path
          required: true
          schema:
            type: string
        - name: rowId
          in: path
          required: true
          schema:
            type: integer
            format: int64
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateTableRowRequest"
      responses:
        "200":
          description: Row updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/TableRowResponse"
        "404":
          description: Row not found
    delete:
      operationId: deleteTableRow
      summary: Delete a salary table row
      tags: [PayrollEngine]
      parameters:
        - $ref: "#/components/parameters/RuleSystemCode"
        - name: tableCode
          in: path
          required: true
          schema:
            type: string
        - name: rowId
          in: path
          required: true
          schema:
            type: integer
            format: int64
      responses:
        "204":
          description: Row deleted
        "404":
          description: Row not found
```

- [ ] **Step 3: Commit**

```bash
git add openapi/personnel-administration-api.yaml
git commit -m "docs: add salary table management endpoints to OpenAPI spec"
```

---

## Task 7: Designer — `tableRowsApi.ts`

**Repo:** `b4rrhh_designer`

**Files:**
- Create: `src/app/objects/api/tableRowsApi.ts`
- Modify: `src/app/objects/api/objectsApi.ts`

- [ ] **Step 1: Create `tableRowsApi.ts`**

```typescript
// src/app/objects/api/tableRowsApi.ts
import { apiFetch } from '../../../api/client'

export interface TableRowDto {
  id: number
  searchCode: string
  startDate: string
  endDate: string | null
  monthlyValue: number
  annualValue: number
  dailyValue: number
  hourlyValue: number
  active: boolean
}

export interface CreateTableRowBody {
  searchCode: string
  startDate: string
  endDate: string | null
  monthlyValue: number
  annualValue: number
  dailyValue: number
  hourlyValue: number
}

export interface UpdateTableRowBody {
  searchCode?: string
  startDate?: string
  endDate?: string | null
  monthlyValue?: number
  annualValue?: number
  dailyValue?: number
  hourlyValue?: number
  active?: boolean
}

export const tableRowsApi = {
  createTable: (ruleSystemCode: string, objectCode: string) =>
    apiFetch<{ ruleSystemCode: string; objectCode: string }>(
      `/payroll-engine/${ruleSystemCode}/tables`,
      { method: 'POST', body: JSON.stringify({ objectCode }) }
    ),

  listRows: (ruleSystemCode: string, tableCode: string) =>
    apiFetch<TableRowDto[]>(`/payroll-engine/${ruleSystemCode}/tables/${tableCode}/rows`),

  createRow: (ruleSystemCode: string, tableCode: string, body: CreateTableRowBody) =>
    apiFetch<TableRowDto>(
      `/payroll-engine/${ruleSystemCode}/tables/${tableCode}/rows`,
      { method: 'POST', body: JSON.stringify(body) }
    ),

  updateRow: (ruleSystemCode: string, tableCode: string, rowId: number, body: UpdateTableRowBody) =>
    apiFetch<TableRowDto>(
      `/payroll-engine/${ruleSystemCode}/tables/${tableCode}/rows/${rowId}`,
      { method: 'PUT', body: JSON.stringify(body) }
    ),

  deleteRow: (ruleSystemCode: string, tableCode: string, rowId: number) =>
    apiFetch<void>(
      `/payroll-engine/${ruleSystemCode}/tables/${tableCode}/rows/${rowId}`,
      { method: 'DELETE' }
    ),
}
```

- [ ] **Step 2: Add `createTable` to `objectsApi.ts`** (so invalidating `['objects', ruleSystemCode]` keeps working after table creation)

`objectsApi.ts` already has `list`. No changes needed — the mutation in `CreateTableModal` will invalidate the `['objects', ruleSystemCode]` query which calls `objectsApi.list`.

- [ ] **Step 3: TypeScript check**

```bash
cd b4rrhh_designer
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/objects/api/tableRowsApi.ts
git commit -m "feat(objects): tableRowsApi — salary table and row CRUD client"
```

---

## Task 8: Designer — `useTableRows` hook

**Repo:** `b4rrhh_designer`

**Files:**
- Create: `src/app/objects/useTableRows.ts`

- [ ] **Step 1: Create the hook**

```typescript
// src/app/objects/useTableRows.ts
import { useQuery } from '@tanstack/react-query'
import { tableRowsApi } from './api/tableRowsApi'

export function useTableRows(ruleSystemCode: string, tableCode: string | null) {
  return useQuery({
    queryKey: ['table-rows', ruleSystemCode, tableCode],
    queryFn: () => tableRowsApi.listRows(ruleSystemCode, tableCode!),
    enabled: tableCode !== null,
  })
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/objects/useTableRows.ts
git commit -m "feat(objects): useTableRows TanStack Query hook"
```

---

## Task 9: Designer — `CreateTableModal`

**Repo:** `b4rrhh_designer`

**Files:**
- Create: `src/app/objects/CreateTableModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/app/objects/CreateTableModal.tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tableRowsApi } from './api/tableRowsApi'

interface Props {
  ruleSystemCode: string
  onClose: () => void
}

export function CreateTableModal({ ruleSystemCode, onClose }: Props) {
  const qc = useQueryClient()
  const [objectCode, setObjectCode] = useState('')

  const mutation = useMutation({
    mutationFn: () => tableRowsApi.createTable(ruleSystemCode, objectCode.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['objects', ruleSystemCode] })
      onClose()
    },
  })

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4">
        <p className="text-sm font-medium text-slate-200 mb-4">Nueva tabla salarial</p>

        <div className="mb-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-wide">
            Código de tabla *
          </label>
          <input
            autoFocus
            type="text"
            value={objectCode}
            onChange={e => setObjectCode(e.target.value)}
            placeholder="Ej: SB_99002405012025"
            className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-200 font-mono px-2 py-1.5 focus:outline-none focus:border-sky-500"
          />
          <p className="text-[8px] text-slate-600 mt-1">
            Identificador único. Se usará como clave de búsqueda en el motor de cálculo.
          </p>
        </div>

        {mutation.isError && (
          <p className="text-red-400 text-[9px] mt-2">Error al crear la tabla</p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={mutation.isPending || !objectCode.trim()}
            onClick={() => mutation.mutate()}
            className="text-xs px-3 py-1.5 bg-green-900 border border-green-700 text-green-300 rounded-md hover:bg-green-800 disabled:opacity-50"
          >
            {mutation.isPending ? 'Creando...' : 'Crear tabla'}
          </button>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/objects/CreateTableModal.tsx
git commit -m "feat(objects): CreateTableModal component"
```

---

## Task 10: Designer — `TableRowModal`

**Repo:** `b4rrhh_designer`

**Files:**
- Create: `src/app/objects/TableRowModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/app/objects/TableRowModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tableRowsApi, type TableRowDto } from './api/tableRowsApi'

interface Props {
  ruleSystemCode: string
  tableCode: string
  row: TableRowDto | null  // null = create mode
  onClose: () => void
}

interface FormState {
  searchCode: string
  startDate: string
  endDate: string
  monthlyValue: string
  annualValue: string
  dailyValue: string
  hourlyValue: string
  active: boolean
}

function emptyForm(): FormState {
  return { searchCode: '', startDate: '', endDate: '', monthlyValue: '', annualValue: '', dailyValue: '', hourlyValue: '', active: true }
}

function rowToForm(row: TableRowDto): FormState {
  return {
    searchCode: row.searchCode,
    startDate: row.startDate,
    endDate: row.endDate ?? '',
    monthlyValue: String(row.monthlyValue),
    annualValue: String(row.annualValue),
    dailyValue: String(row.dailyValue),
    hourlyValue: String(row.hourlyValue),
    active: row.active,
  }
}

export function TableRowModal({ ruleSystemCode, tableCode, row, onClose }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState>(row ? rowToForm(row) : emptyForm())

  useEffect(() => {
    setForm(row ? rowToForm(row) : emptyForm())
  }, [row])

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: field === 'active' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        searchCode: form.searchCode,
        startDate: form.startDate,
        endDate: form.endDate || null,
        monthlyValue: parseFloat(form.monthlyValue),
        annualValue: parseFloat(form.annualValue),
        dailyValue: parseFloat(form.dailyValue),
        hourlyValue: parseFloat(form.hourlyValue),
      }
      return row
        ? tableRowsApi.updateRow(ruleSystemCode, tableCode, row.id, { ...body, active: form.active })
        : tableRowsApi.createRow(ruleSystemCode, tableCode, body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['table-rows', ruleSystemCode, tableCode] })
      onClose()
    },
  })

  const isValid = form.searchCode && form.startDate && form.monthlyValue && form.annualValue && form.dailyValue && form.hourlyValue

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4">
        <p className="text-sm font-medium text-slate-200 mb-1">
          {row ? 'Editar fila' : 'Nueva fila'} · <span className="font-mono text-sky-400">{tableCode}</span>
        </p>
        <p className="text-[9px] text-slate-500 mb-4">
          Los valores se usan en el motor de cálculo para resolver conceptos de tipo DIRECT_AMOUNT.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="col-span-1">
            <label className="text-[9px] text-slate-500 uppercase tracking-wide">Código búsqueda *</label>
            <input type="text" value={form.searchCode} onChange={set('searchCode')}
              className="mt-0.5 w-full bg-slate-950 border border-slate-700 rounded text-[10px] text-slate-200 font-mono px-1.5 py-1 focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="text-[9px] text-slate-500 uppercase tracking-wide">Desde *</label>
            <input type="date" value={form.startDate} onChange={set('startDate')}
              className="mt-0.5 w-full bg-slate-950 border border-slate-700 rounded text-[10px] text-slate-200 px-1.5 py-1 focus:outline-none focus:border-sky-500" />
          </div>
          <div>
            <label className="text-[9px] text-slate-500 uppercase tracking-wide">Hasta</label>
            <input type="date" value={form.endDate} onChange={set('endDate')}
              className="mt-0.5 w-full bg-slate-950 border border-slate-700 rounded text-[10px] text-slate-200 px-1.5 py-1 focus:outline-none focus:border-sky-500" />
          </div>
        </div>

        <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1.5">Valores salariales *</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(['monthlyValue', 'annualValue', 'dailyValue', 'hourlyValue'] as const).map(field => (
            <div key={field}>
              <label className="text-[9px] text-slate-500">
                {{ monthlyValue: 'Mensual (€)', annualValue: 'Anual (€)', dailyValue: 'Diario (€)', hourlyValue: 'Por hora (€)' }[field]}
              </label>
              <input type="number" step="0.01" value={form[field]} onChange={set(field)}
                className="mt-0.5 w-full bg-slate-950 border border-slate-700 rounded text-[10px] text-slate-200 px-1.5 py-1 focus:outline-none focus:border-sky-500" />
            </div>
          ))}
        </div>

        {row && (
          <label className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="accent-sky-500" />
            <span className="text-[10px] text-slate-400">Activo</span>
          </label>
        )}

        {mutation.isError && (
          <p className="text-red-400 text-[9px] mb-2">Error al guardar la fila</p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700">
            Cancelar
          </button>
          <button type="button" disabled={mutation.isPending || !isValid} onClick={() => mutation.mutate()}
            className="text-xs px-3 py-1.5 bg-sky-900 border border-sky-700 text-sky-300 rounded-md hover:bg-sky-800 disabled:opacity-50">
            {mutation.isPending ? 'Guardando...' : 'Guardar fila'}
          </button>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/objects/TableRowModal.tsx
git commit -m "feat(objects): TableRowModal for create/edit salary table rows"
```

---

## Task 11: Designer — `TableRowPanel`

**Repo:** `b4rrhh_designer`

**Files:**
- Create: `src/app/objects/TableRowPanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/app/objects/TableRowPanel.tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTableRows } from './useTableRows'
import { tableRowsApi, type TableRowDto } from './api/tableRowsApi'
import { TableRowModal } from './TableRowModal'

interface Props {
  ruleSystemCode: string
  tableCode: string
}

export function TableRowPanel({ ruleSystemCode, tableCode }: Props) {
  const qc = useQueryClient()
  const { data: rows = [], isLoading } = useTableRows(ruleSystemCode, tableCode)
  const [modalRow, setModalRow] = useState<TableRowDto | null | 'new'>(undefined as never)
  const [deleteTarget, setDeleteTarget] = useState<TableRowDto | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (rowId: number) => tableRowsApi.deleteRow(ruleSystemCode, tableCode, rowId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['table-rows', ruleSystemCode, tableCode] })
      setDeleteTarget(null)
    },
  })

  function formatNum(n: number) {
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2 }).format(n)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="text-sm font-semibold text-sky-400 font-mono">{tableCode}</div>
          <div className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wide">{ruleSystemCode} · Tabla salarial</div>
        </div>
        <button
          type="button"
          onClick={() => setModalRow('new')}
          className="text-[10px] px-2.5 py-1 bg-green-950 border border-green-800 text-green-400 rounded hover:bg-green-900"
        >
          + Nueva fila
        </button>
      </div>

      {/* Rows table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-slate-500 text-xs">Cargando...</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-slate-600 text-xs">Sin filas — pulsa "+ Nueva fila" para añadir la primera.</div>
        ) : (
          <table className="w-full text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="text-slate-500 text-left border-b border-slate-800 text-[9px] uppercase tracking-wide">
                <th className="px-4 py-2">Código búsqueda</th>
                <th className="px-2 py-2">Desde</th>
                <th className="px-2 py-2">Hasta</th>
                <th className="px-2 py-2 text-right">Mensual</th>
                <th className="px-2 py-2 text-right">Anual</th>
                <th className="px-2 py-2 text-right">Diario</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b border-slate-900 hover:bg-slate-900/50">
                  <td className="px-4 py-2 font-mono text-slate-300">{row.searchCode}</td>
                  <td className="px-2 py-2 text-slate-400">{row.startDate}</td>
                  <td className="px-2 py-2 text-slate-600 italic">{row.endDate ?? '—'}</td>
                  <td className="px-2 py-2 text-right text-lime-400">{formatNum(row.monthlyValue)} €</td>
                  <td className="px-2 py-2 text-right text-slate-400">{formatNum(row.annualValue)} €</td>
                  <td className="px-2 py-2 text-right text-slate-400">{formatNum(row.dailyValue)} €</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setModalRow(row)}
                      className="text-slate-500 hover:text-slate-200 mr-3"
                      title="Editar"
                    >✎</button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(row)}
                      className="text-red-900 hover:text-red-400"
                      title="Eliminar"
                    >🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Row modal (create / edit) */}
      {modalRow !== undefined && (
        <TableRowModal
          ruleSystemCode={ruleSystemCode}
          tableCode={tableCode}
          row={modalRow === 'new' ? null : modalRow}
          onClose={() => setModalRow(undefined as never)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-xl">
            <p className="text-slate-200 text-sm font-medium mb-1">¿Eliminar fila?</p>
            <p className="text-slate-500 text-xs font-mono mb-4">{deleteTarget.searchCode} · {deleteTarget.startDate}</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)}
                className="text-xs px-3 py-1.5 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-800">
                Cancelar
              </button>
              <button type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="text-xs px-3 py-1.5 bg-red-900 border border-red-700 text-red-200 rounded-md hover:bg-red-800 disabled:opacity-50">
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/objects/TableRowPanel.tsx
git commit -m "feat(objects): TableRowPanel with row list, edit, and delete"
```

---

## Task 12: Designer — Wire everything into `ObjectsPage`

**Repo:** `b4rrhh_designer`

**Files:**
- Modify: `src/app/objects/ObjectsPage.tsx`

- [ ] **Step 1: Rewrite `ObjectsPage.tsx`**

Replace the entire file with:

```tsx
// src/app/objects/ObjectsPage.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { objectsApi, type PayrollObjectDto } from './api/objectsApi'
import { useRuleSystemStore } from '../../ruleSystemStore'
import { TableRowPanel } from './TableRowPanel'
import { CreateTableModal } from './CreateTableModal'

type Tab = 'CONSTANT' | 'TABLE'

export function ObjectsPage() {
  const { ruleSystemCode } = useRuleSystemStore()
  const [tab, setTab] = useState<Tab>('CONSTANT')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [createTableOpen, setCreateTableOpen] = useState(false)

  const { data = [], isLoading } = useQuery({
    queryKey: ['objects', ruleSystemCode, tab],
    queryFn: () => objectsApi.list(ruleSystemCode, tab),
  })

  function handleTabChange(t: Tab) {
    setTab(t)
    setSelectedTable(null)
  }

  function handleRowClick(obj: PayrollObjectDto) {
    if (tab === 'TABLE') {
      setSelectedTable(prev => prev === obj.objectCode ? null : obj.objectCode)
    }
  }

  return (
    <div className="flex h-full">
      {/* Left: object list */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-slate-800">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-1">
            {(['CONSTANT', 'TABLE'] as Tab[]).map(t => (
              <button
                type="button"
                key={t}
                onClick={() => handleTabChange(t)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  tab === t
                    ? 'bg-sky-950 border-sky-700 text-sky-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'CONSTANT' ? 'Constantes' : 'Tablas'}
              </button>
            ))}
          </div>
          {tab === 'TABLE' && (
            <button
              type="button"
              onClick={() => setCreateTableOpen(true)}
              className="text-[10px] px-2 py-1 bg-green-950 border border-green-800 text-green-400 rounded hover:bg-green-900"
            >
              + Nueva
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-slate-500 text-xs">Cargando...</div>
          ) : (
            <table className="w-full text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="text-slate-500 text-left border-b border-slate-800">
                  <th className="px-4 py-2">Código</th>
                  <th className="px-2 py-2">Activo</th>
                </tr>
              </thead>
              <tbody>
                {data.map(obj => (
                  <tr
                    key={obj.objectCode}
                    onClick={() => handleRowClick(obj)}
                    className={`border-b border-slate-900 transition-colors ${
                      tab === 'TABLE'
                        ? selectedTable === obj.objectCode
                          ? 'bg-sky-950 border-sky-900 cursor-pointer'
                          : 'hover:bg-slate-900/50 cursor-pointer'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-2 font-mono">{obj.objectCode}</td>
                    <td className="px-2 py-2">
                      <span className={obj.active ? 'text-green-400' : 'text-slate-600'}>
                        {obj.active ? '✓' : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: row panel (only for TABLE tab) */}
      {tab === 'TABLE' && selectedTable ? (
        <TableRowPanel ruleSystemCode={ruleSystemCode} tableCode={selectedTable} />
      ) : tab === 'TABLE' ? (
        <div className="flex-1 flex items-center justify-center text-slate-600 text-xs">
          Selecciona una tabla para ver sus filas
        </div>
      ) : null}

      {createTableOpen && (
        <CreateTableModal
          ruleSystemCode={ruleSystemCode}
          onClose={() => setCreateTableOpen(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Run tests**

```bash
npx vitest run
```
Expected: all existing tests still pass.

- [ ] **Step 4: Manual smoke test in browser**

Start backend (Docker + `mvn spring-boot:run`) and designer (`npm start`).

Navigate to `/objects`:

1. Click tab "Tablas" → list shows `SB_99002405011982` and `PC_99002405011982`
2. Click `SB_99002405011982` → right panel appears with its 3 rows (G1, G2, G3)
3. Click "+ Nueva fila" → modal opens; fill in a new row and save → row appears in list
4. Click ✎ on existing row → modal opens pre-filled; change monthly value → saved value reflects
5. Click 🗑 on a row → confirmation appears → confirm → row disappears
6. Click "+ Nueva" → Create table modal → enter code → creates table → appears in list
7. Click new table → empty panel with "Sin filas" message

- [ ] **Step 5: Commit**

```bash
git add src/app/objects/ObjectsPage.tsx
git commit -m "feat(objects): wire TableRowPanel and CreateTableModal into ObjectsPage"
```
