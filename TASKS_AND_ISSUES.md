# GMG Fintech Platform — Engineering Tasks & Issues Backlog

This document serves as the master engineering issue tracker and task specification for the GMG Fintech Platform repository (`ssenkula-rivan/fintech`). Each item corresponds to an architectural requirement and GitHub issue ticket.

---

## 📊 Summary Board

| Issue # | Title | Priority | Category | Status |
|:---:|---|:---:|:---:|:---:|
| **#1** | [Transaction Lifecycle Management & State Machine](#issue-1) | `P0 - Blocker` | Core Ledger | 🟢 In Progress |
| **#2** | [Database Transaction Integrity (ACID) & Row-Level Locking](#issue-2) | `P0 - Blocker` | DB & Reliability | 🟢 In Progress |
| **#3** | [Idempotency Service for Duplicate Transaction Prevention](#issue-3) | `P0 - Blocker` | API Gateway | 🟢 Active |
| **#4** | [Append-Only Audit Trail Logging with Cryptographic Hash Chain](#issue-4) | `P0 - Blocker` | Security & Compliance | 🟡 Pending |
| **#5** | [Payment Processing Logging & PII Masking (MTN & Airtel)](#issue-5) | `P1 - High` | Telecom Integrations | 🟢 Active |
| **#6** | [Automated Compensating Transactions & Rollback Engine](#issue-6) | `P1 - High` | Distributed Systems | 🟡 Planned |
| **#7** | [Distributed Saga Pattern Orchestrator](#issue-7) | `P1 - High` | Microservices | 🟡 Planned |
| **#8** | [Referential Integrity & Daily Automated Balance Reconciliation](#issue-8) | `P0 - Blocker` | Accounting / Audit | 🟢 In Progress |
| **#9** | [Revenue, Fee Calculation & FX Conversion Spread Tracking](#issue-9) | `P2 - Medium` | Analytics & Revenue | 🟢 Active |
| **#10** | [Two-Phase Commit (2PC) Protocol for External Settlements](#issue-10) | `P1 - High` | Financial Engine | 🟡 Planned |

---

## 📑 Issue Specifications

### <a id="issue-1"></a>ISSUE #1: Transaction Lifecycle Management & State Machine
- **Category:** Core Ledger
- **Priority:** `P0 - Blocker`
- **Target Files:** `api/services/transactionManager.js`, `api/routes/transactions.js`
- **Description:** Implement a strict finite state machine for all financial transactions to prevent race conditions and invalid state transitions.
- **States Supported:** `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REVERSED`, `EXPIRED`.
- **Acceptance Criteria:**
  1. Record is created with `PENDING` status and a unique UUID reference on initiation.
  2. Every state change records an immutable timestamp, actor, and reason string.
  3. Transactions remaining in `PENDING` status for more than 15 minutes are automatically transitioned to `EXPIRED`.
  4. State transition rules strictly prevent illegal hops (e.g., `COMPLETED` cannot revert to `PENDING`).

---

### <a id="issue-2"></a>ISSUE #2: Database Transaction Integrity (ACID) & Row-Level Locking
- **Category:** DB & Reliability
- **Priority:** `P0 - Blocker`
- **Target Files:** `api/config/db.js`, `api/services/walletService.js`
- **Description:** Guarantee ACID transaction semantics across wallet balance debits and credits, preventing double-spending and dirty reads.
- **Acceptance Criteria:**
  1. All multi-balance modifications must wrap operations inside explicit `BEGIN ... COMMIT/ROLLBACK` blocks.
  2. Implement strict row-level pessimistic locking (`SELECT ... FOR UPDATE`) when inspecting balances prior to deduction.
  3. Balance debits and credits must be committed atomically in the same database transaction.
  4. Enforce transaction isolation level of at least `READ COMMITTED`.
  5. If any intermediate query fails, rollback the entire transaction immediately and return a typed error.

---

### <a id="issue-3"></a>ISSUE #3: Idempotency Service for Duplicate Transaction Prevention
- **Category:** API Gateway
- **Priority:** `P0 - Blocker`
- **Target Files:** `api/middleware/idempotency.js`, `api/server.js`
- **Description:** Prevent duplicate charges resulting from network retries, client crashes, or double-clicks on payment buttons.
- **Acceptance Criteria:**
  1. Financial POST/PUT endpoints require an `X-Idempotency-Key` HTTP header.
  2. Idempotency records are cached in Redis / MySQL for at least 24 hours.
  3. If a request with an existing idempotency key arrives while the transaction is `PROCESSING`, return HTTP 409 (Conflict).
  4. If an idempotency key matches an already `COMPLETED` transaction, return the original cached response payload without re-executing.
  5. Cache key composite: `${userId}:${transactionType}:${idempotencyKey}`.

---

### <a id="issue-4"></a>ISSUE #4: Append-Only Audit Trail Logging with Cryptographic Hash Chain
- **Category:** Security & Compliance
- **Priority:** `P0 - Blocker`
- **Target Files:** `api/services/auditLogger.js`, `api/database.sql`
- **Description:** Maintain an unmodifiable audit ledger of every financial event to satisfy Bank of Uganda and East African regulatory requirements.
- **Acceptance Criteria:**
  1. Every balance change triggers an insert into an append-only `audit_logs` table.
  2. Log entries must include: `transaction_id`, `user_id`, `action`, `old_value`, `new_value`, `ip_address`, `user_agent`, and `timestamp`.
  3. Each audit entry contains a cryptographic SHA-256 hash calculated over the current record contents concatenated with the previous record's hash (`prev_hash`).
  4. Application database users must have `INSERT, SELECT` permissions only on the audit table (no `UPDATE` or `DELETE`).

---

### <a id="issue-5"></a>ISSUE #5: Payment Processing Logging & PII Masking (MTN & Airtel)
- **Category:** Telecom Integrations
- **Priority:** `P1 - High`
- **Target Files:** `api/services/telecomPayment.js`, `api/routes/webhooks.js`
- **Description:** Provide structured, searchable logging for all telecom Mobile Money interactions while ensuring strict privacy and PII protection.
- **Acceptance Criteria:**
  1. Log outbound requests and inbound webhooks from MTN MoMo and Airtel Money with latency telemetry.
  2. Automatic masking of sensitive personal data (e.g., phone numbers masked as `+256 77****123`, PINs stripped completely).
  3. Store telecom reference numbers (`external_reference`) mapped to internal transaction IDs for instant reconciliation.
  4. Implement structured JSON error captures when carrier webhooks deliver failure codes (e.g., insufficient funds, subscriber not registered).

---

### <a id="issue-6"></a>ISSUE #6: Automated Compensating Transactions & Rollback Engine
- **Category:** Distributed Systems
- **Priority:** `P1 - High`
- **Target Files:** `api/services/compensate.js`
- **Description:** Automatically restore user balances and trigger reversals if a multi-step financial flow fails midway.
- **Acceptance Criteria:**
  1. Each step in a transaction defines its inverse compensating action before execution begins.
  2. If an external payment provider times out or fails after internal wallet debit, execute the compensating credit automatically.
  3. If a compensating action fails after 3 automated retries, flag the transaction for immediate manual operations review and dispatch an alert.
  4. Create an audit record linking the reversal to the original transaction ID.

---

### <a id="issue-7"></a>ISSUE #7: Distributed Saga Pattern Orchestrator
- **Category:** Microservices
- **Priority:** `P1 - High`
- **Target Files:** `api/services/sagaOrchestrator.js`
- **Description:** Coordinate long-running, multi-service transactions (e.g., Fiat Wallet -> Foreign Exchange -> Crypto Settlement / Telco Payout).
- **Acceptance Criteria:**
  1. Coordinate execution of discrete saga steps with persistent state tracking in database.
  2. Resilient to application restarts; resumed uncompleted sagas on startup.
  3. Backward compensation: on failure, execute rollbacks in reverse topological order.
  4. Emit metrics on saga duration, step success rate, and compensation counts.

---

### <a id="issue-8"></a>ISSUE #8: Referential Integrity & Daily Automated Balance Reconciliation
- **Category:** Accounting / Audit
- **Priority:** `P0 - Blocker`
- **Target Files:** `api/services/reconciliation.js`, `api/scripts/dailyReconciliation.js`
- **Description:** Prove system mathematical integrity by verifying that every wallet balance strictly equals the algebraic sum of historical transactions.
- **Acceptance Criteria:**
  1. Enforce database constraints ensuring wallet balances cannot become negative (`CHECK balance >= 0`).
  2. Implement a daily cron job that calculates `SUM(credits) - SUM(debits)` for every wallet and compares against current cached balance.
  3. If any discrepancy > 0 is found, instantly freeze the affected wallet from new debits and generate a P0 incident alert.
  4. Export daily reconciliation summary report for financial auditors.

---

### <a id="issue-9"></a>ISSUE #9: Revenue, Fee Calculation & FX Conversion Spread Tracking
- **Category:** Analytics & Revenue
- **Priority:** `P2 - Medium`
- **Target Files:** `api/routes/exchange.js`, `api/services/feeCalculator.js`
- **Description:** Accurately compute and log revenue-generating events, fee deductions, and currency conversion spreads.
- **Acceptance Criteria:**
  1. Log fee breakdowns separately: `transaction_fee`, `withdrawal_fee`, `conversion_spread`, `network_gas_fee`.
  2. For FX exchanges, record base currency, quote currency, raw market rate, applied user rate, and net spread profit.
  3. Support promotional fee discount codes with validation rules.
  4. Provide aggregated daily/monthly revenue query capabilities for financial reporting.

---

### <a id="issue-10"></a>ISSUE #10: Two-Phase Commit (2PC) Protocol for External Settlements
- **Category:** Financial Engine
- **Priority:** `P1 - High`
- **Target Files:** `api/services/twoPhaseCommit.js`
- **Description:** Implement a two-phase commit protocol for operations bridging internal wallets and external clearing systems.
- **Acceptance Criteria:**
  1. Phase 1 (Prepare): Verify balance, place lock/hold on funds, and confirm external system readiness.
  2. Phase 2 (Commit): Deduct reserved funds and finalize external settlement only when all participants confirm prepare success.
  3. Timeout handling: If an external participant does not respond within 30 seconds, automatically issue abort and release the hold.
  4. Idempotent commit and rollback endpoints for recovery.

---

## 🛠️ Automated Issue Creation on GitHub

To publish these issues directly into the GitHub repository issue tracker, you can use the bundled automated script:

```bash
# Export your GitHub Personal Access Token (PAT)
export GITHUB_TOKEN="ghp_yourPersonalAccessTokenHere"

# Run the automated issue publisher
./scripts/create-github-issues.sh
```

Or using the GitHub CLI:
```bash
gh issue create --title "[ISSUE-001] Transaction Lifecycle Management & State Machine" --body-file .github/ISSUE_TEMPLATE/01_fintech_epic_task.md
```
