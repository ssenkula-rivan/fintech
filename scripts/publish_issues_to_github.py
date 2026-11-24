#!/usr/bin/env python3
"""
Master Engineering Issue Publisher for GMG Fintech Platform
Author: Lead Software Engineer
Target: ssenkula-rivan/fintech
"""

import urllib.request
import urllib.error
import json
import time
import os

TOKEN = os.environ.get("GITHUB_TOKEN")
if not TOKEN:
    try:
        import subprocess, base64
        out = subprocess.check_output(["security", "find-generic-password", "-s", "gh:github.com", "-w"]).decode().strip()
        if out.startswith("go-keyring-base64:"):
            TOKEN = base64.b64decode(out.split(":", 1)[1]).decode("utf-8")
        else:
            TOKEN = out
    except Exception:
        pass

if not TOKEN:
    print("Error: GITHUB_TOKEN not provided and not found in system keychain.")
    sys.exit(1)
REPO = "ssenkula-rivan/fintech"

def api_call(endpoint, data=None, method="GET"):
    url = "https://api.github.com/repos/" + REPO + "/" + endpoint
    headers = {
        "User-Agent": "GMG-Lead-Engineer",
        "Authorization": "token " + TOKEN,
        "Accept": "application/vnd.github+json"
    }
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        return {"error": e.code, "message": err}
    except Exception as e:
        return {"error": str(e)}

def setup_labels():
    labels = [
        {"name": "p0-blocker", "color": "B60205", "description": "Critical path: security, data loss, ledger integrity"},
        {"name": "p1-high", "color": "D93F0B", "description": "High priority architectural capability"},
        {"name": "p2-medium", "color": "FBCA04", "description": "Medium priority improvement"},
        {"name": "fintech-core", "color": "0052CC", "description": "Core transaction ledger and state machine"},
        {"name": "telecom", "color": "5319E7", "description": "MTN MoMo & Airtel Money gateway integrations"},
        {"name": "security", "color": "0E8A16", "description": "Compliance, audit trails, and data protection"},
        {"name": "database", "color": "1D76DB", "description": "ACID transactions, locking, schema migrations"},
        {"name": "architecture", "color": "C2E0C6", "description": "Distributed sagas, 2PC, and resilience patterns"},
        {"name": "api-gateway", "color": "BFD4F2", "description": "Idempotency, rate limiting, and middleware"},
        {"name": "analytics", "color": "D4C5F9", "description": "Revenue, spreads, and fee metrics"}
    ]
    print("--- Configuring Repository Labels ---")
    for lbl in labels:
        res = api_call("labels", data=lbl, method="POST")
        print("  ✓ Label:", lbl["name"])
    time.sleep(1)

def setup_milestones():
    milestones = [
        {
            "title": "v1.0.0 — Core Transaction Integrity & Audit",
            "description": "Foundational ledger resilience: ACID compliance, idempotency, audit trail hash chain, and reconciliation."
        },
        {
            "title": "v1.1.0 — Distributed Sagas & Telco Settlements",
            "description": "Multi-service resilience: Compensating rollbacks, Saga orchestrator, MTN/Airtel gateway logging, and 2PC settlements."
        }
    ]
    print("\n--- Configuring Engineering Milestones ---")
    mapping = {}
    for ms in milestones:
        res = api_call("milestones", data=ms, method="POST")
        if "number" in res:
            mapping[ms["title"]] = res["number"]
            print("  ✓ Created Milestone #" + str(res["number"]) + ": " + ms["title"])
        else:
            # Check existing
            existing = api_call("milestones")
            if isinstance(existing, list):
                for m in existing:
                    if m.get("title") == ms["title"]:
                        mapping[ms["title"]] = m["number"]
                        print("  ✓ Found Milestone #" + str(m["number"]) + ": " + ms["title"])
    time.sleep(1)
    return mapping

def publish_issues(milestone_map):
    m1 = milestone_map.get("v1.0.0 — Core Transaction Integrity & Audit")
    m2 = milestone_map.get("v1.1.0 — Distributed Sagas & Telco Settlements")

    issues = [
        {
            "title": "[ISSUE-001] Transaction Lifecycle Management & State Machine Enforcement",
            "labels": ["fintech-core", "p0-blocker"],
            "milestone": m1,
            "body": """### Epic: Core Ledger State Machine
**Priority**: `P0 - Blocker`  
**Target Module**: `api/services/transactionManager.js`, `api/routes/transactions.js`  
**Status**: 🟢 In Progress  

---

### 📖 User Story
As a financial operations manager, I want all transactions to follow a strictly enforced, formal finite state machine so that invalid state transitions, race conditions, and ledger balance discrepancies cannot occur.

### 🎯 Acceptance Criteria
- [ ] **State Model**: Implement formal states: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REVERSED`, `EXPIRED`.
- [ ] **State Machine Enforcement**: Reject illegal hops (e.g., `COMPLETED` cannot transition to `PENDING` or `PROCESSING`).
- [ ] **Expiration Service**: Automatically expire any transaction lingering in `PENDING` for > 15 minutes.
- [ ] **Audit History**: Record an immutable state history table with `from_state`, `to_state`, `actor_id`, `reason`, and cryptographic timestamp for every transition.

### 🧪 Test Scenarios
- Unit test for all valid and illegal state transition vectors.
- Concurrency test attempting simultaneous conflicting state transitions on the same transaction ID."""
        },
        {
            "title": "[ISSUE-002] Database Transaction Integrity (ACID) & Row-Level Locking",
            "labels": ["fintech-core", "database", "p0-blocker"],
            "milestone": m1,
            "body": """### Epic: Database ACID Concurrency Control
**Priority**: `P0 - Blocker`  
**Target Module**: `api/config/database.js`, `api/services/wallet.js`  
**Status**: 🟢 In Progress  

---

### 📖 User Story
As a financial platform engineer, I require all wallet balance debits and credits to be strictly atomic and isolated so that double-spending, race conditions, and negative balances are mathematically prevented under high concurrency.

### 🎯 Acceptance Criteria
- [ ] **Atomic Unit of Work**: Wrap all debit/credit operations inside explicit `BEGIN ... COMMIT/ROLLBACK` blocks.
- [ ] **Pessimistic Locking**: Execute `SELECT ... FOR UPDATE` on wallet rows before reading balances or writing adjustments.
- [ ] **Isolation Level**: Set transaction isolation level to at least `READ COMMITTED`.
- [ ] **Failure Rollback**: Atomic rollback of the entire transaction if any intermediate query fails.
- [ ] **Constraint Check**: Enforce database level `CHECK (balance >= 0)` constraint across all standard wallet types.

### 🧪 Test Scenarios
- High-concurrency benchmark: Dispatch 50 parallel debit requests of 10,000 UGX on an account with exactly 10,000 UGX balance. Verify exactly 1 succeeds and 49 fail with zero balance drift."""
        },
        {
            "title": "[ISSUE-003] Idempotency Service for Duplicate Transaction Prevention",
            "labels": ["api-gateway", "security", "p0-blocker"],
            "milestone": m1,
            "body": """### Epic: API Gateway Idempotency Layer
**Priority**: `P0 - Blocker`  
**Target Module**: `api/middleware/idempotency.js`  
**Status**: 🟢 Active  

---

### 📖 User Story
As an end-user on mobile money, I want payment retry attempts caused by intermittent cell networks to never charge my account multiple times.

### 🎯 Acceptance Criteria
- [ ] **Header Mandate**: Enforce `X-Idempotency-Key` HTTP header on all financial mutation endpoints (`/wallet/send`, `/wallet/withdraw`, `/telecom/pay`).
- [ ] **Composite Key**: Key constructed as `idemp:${user_id}:${transaction_type}:${client_key}`.
- [ ] **24-Hour Retention**: Store idempotency records with response payloads in Redis / MySQL for 24 hours.
- [ ] **In-Flight Locking**: If a duplicate request arrives while state is `PROCESSING`, return `409 Conflict` (\"Transaction in progress\").
- [ ] **Cached Reply**: If already `COMPLETED`, return the cached response payload immediately without hitting downstream billing.

### 🧪 Test Scenarios
- Replay identical requests simultaneously; verify downstream mock telecom provider receives only 1 call."""
        },
        {
            "title": "[ISSUE-004] Append-Only Audit Trail Logging with Cryptographic Hash Chain",
            "labels": ["security", "fintech-core", "p0-blocker"],
            "milestone": m1,
            "body": """### Epic: Regulatory Compliance & Immutable Audit Ledger
**Priority**: `P0 - Blocker`  
**Target Module**: `api/services/auditLogger.js`, `api/database.sql`  
**Status**: 🟡 Pending  

---

### 📖 User Story
As a compliance and security officer, I require an immutable, tamper-evident audit ledger for all ledger actions to satisfy Bank of Uganda and East African payment regulatory standards.

### 🎯 Acceptance Criteria
- [ ] **Append-Only Table**: Database permissions for application service role restricted to `INSERT, SELECT` (no `UPDATE` or `DELETE`).
- [ ] **Payload Detail**: Record `transaction_id`, `user_id`, `action`, `old_value`, `new_value`, `ip_address`, `user_agent`, `timestamp`.
- [ ] **Cryptographic Chaining**: Calculate SHA-256 hash over `(id + prev_hash + payload + timestamp)` ensuring an unbroken chain.
- [ ] **Verification Tool**: Automated daily job verifying hash chain continuity and detecting any database tampering.

### 🧪 Test Scenarios
- Simulate manual database update on an audit record; verify integrity verification job flags the breach immediately."""
        },
        {
            "title": "[ISSUE-005] Telecom Payment Processing Logging & PII Masking (MTN & Airtel)",
            "labels": ["telecom", "p1-high"],
            "milestone": m2,
            "body": """### Epic: Telecom Mobile Money Gateway Telemetry
**Priority**: `P1 - High`  
**Target Module**: `api/services/mtnMomo.js`, `api/services/airtelMoney.js`, `api/routes/webhooks.js`  
**Status**: 🟢 Active  

---

### 📖 User Story
As an operations and integrations engineer, I need granular logging for MTN Open API and Airtel Money Open API interactions while strictly protecting customer personally identifiable information (PII).

### 🎯 Acceptance Criteria
- [ ] **Structured Request/Response Logs**: Capture carrier latency, HTTP status, and telecom reference numbers.
- [ ] **PII Redaction**: Mask phone numbers (e.g. `+256 77*****123`) and strip PINs/passwords from all loggers and APM traces.
- [ ] **Reference Mapping**: Bi-directional index mapping internal UUIDs to telecom external reference codes.
- [ ] **Webhook Fault Tolerance**: Idempotent processing of carrier callbacks with signature verification (HMAC).

### 🧪 Test Scenarios
- Inbound carrier callback replay test to ensure idempotent receipt and correct status reflection."""
        },
        {
            "title": "[ISSUE-006] Automated Compensating Transactions & Rollback Engine",
            "labels": ["architecture", "p1-high"],
            "milestone": m2,
            "body": """### Epic: Distributed Failure Compensation
**Priority**: `P1 - High`  
**Target Module**: `api/services/compensate.js`  
**Status**: 🟡 Planned  

---

### 📖 User Story
As a system, I want automatic reversals executed when cross-service transactions fail midway (e.g. wallet deducted but MTN payout times out), so customer funds are never lost.

### 🎯 Acceptance Criteria
- [ ] **Pre-registered Compensation**: Each forward execution step must register its reverse compensating handler prior to invocation.
- [ ] **Automated Reversal**: If downstream telecom returns unrecoverable error or times out, trigger automatic wallet refund credit.
- [ ] **Dead Letter Queue (DLQ)**: If compensation itself fails after 3 exponential backoff retries, escalate to high-priority Ops queue.
- [ ] **Audit Link**: Compensating transaction must reference original transaction ID in `reversal_of_id`.

### 🧪 Test Scenarios
- Inject mock timeout on telecom disbursement; verify user wallet is automatically credited back within 5 seconds."""
        },
        {
            "title": "[ISSUE-007] Distributed Saga Pattern Orchestration",
            "labels": ["architecture", "p1-high"],
            "milestone": m2,
            "body": """### Epic: Long-Running Multi-Service Transaction Coordinator
**Priority**: `P1 - High`  
**Target Module**: `api/services/sagaOrchestrator.js`  
**Status**: 🟡 Planned  

---

### 📖 User Story
As a system architect, I want complex cross-service workflows (Fiat Wallet -> Currency Conversion -> Telco Payout / Blockchain Settlement) managed by a durable Saga Orchestrator that survives application restarts.

### 🎯 Acceptance Criteria
- [ ] **Saga Coordinator**: Orchestrate sequential steps across multiple microservices/modules.
- [ ] **Durable State**: Persist saga step checkpoints to database so in-flight sagas resume seamlessly upon process restart.
- [ ] **Topological Compensation**: Roll back completed steps in strict reverse order upon unrecoverable downstream failure.
- [ ] **Metrics**: Emit metrics on saga duration, step success rates, and compensation frequency.

### 🧪 Test Scenarios
- Kill node process midway through a 4-step saga; restart server and verify saga resumes and completes from the last saved checkpoint."""
        },
        {
            "title": "[ISSUE-008] Referential Integrity & Daily Automated Balance Reconciliation",
            "labels": ["fintech-core", "database", "p0-blocker"],
            "milestone": m1,
            "body": """### Epic: Mathematical Ledger Proof & Daily Reconciliation
**Priority**: `P0 - Blocker`  
**Target Module**: `api/services/reconciliation.js`, `api/scripts/dailyReconciliation.js`  
**Status**: 🟢 In Progress  

---

### 📖 User Story
As an auditor and CFO, I require mathematical proof that every customer account balance exactly equals the sum of historical credits minus debits at all times.

### 🎯 Acceptance Criteria
- [ ] **Balance Equality**: Wallet `current_balance == SUM(credits) - SUM(debits)`.
- [ ] **Automated Daily Job**: Scheduled cron at 00:00 UTC reconciling all active customer wallets.
- [ ] **Account Freeze on Variance**: If any discrepancy > 0 is detected on an account, freeze account debits and trigger P0 Ops pager.
- [ ] **Auditor Report**: Generate automated daily reconciliation CSV / PDF summary report for compliance filing.

### 🧪 Test Scenarios
- Deliberately inject a 1-cent variance on a test wallet; verify daily reconciliation flags it, freezes the wallet, and emits an alert."""
        },
        {
            "title": "[ISSUE-009] Revenue, Fee Calculation & FX Conversion Spread Tracking",
            "labels": ["analytics", "p2-medium"],
            "milestone": m2,
            "body": """### Epic: Financial Revenue Accounting & FX Spread Telemetry
**Priority**: `P2 - Medium`  
**Target Module**: `api/routes/exchange.js`, `api/services/feeCalculator.js`  
**Status**: 🟢 Active  

---

### 📖 User Story
As a business analyst, I want exact breakdown and accounting of platform transaction fees, FX conversion spreads, and promo discounts across all transactions.

### 🎯 Acceptance Criteria
- [ ] **Fee Granularity**: Explicitly record `transaction_fee`, `withdrawal_fee`, `conversion_spread`, and network fees.
- [ ] **FX Spread Analytics**: Record market base rate, quote rate, user applied rate, and net spread profit on every exchange.
- [ ] **Promo Validation**: Support dynamic promotional discount codes with expiration and max-use constraints.
- [ ] **Reporting API**: Query endpoints for daily/monthly gross fee revenues grouped by corridor and currency.

### 🧪 Test Scenarios
- Execute FX trade (USD -> UGX); verify user receives customer rate and spread margin is logged to fee revenue ledger."""
        },
        {
            "title": "[ISSUE-010] Two-Phase Commit (2PC) Protocol for External Settlements",
            "labels": ["fintech-core", "architecture", "p1-high"],
            "milestone": m2,
            "body": """### Epic: Cross-System Atomic Settlement Protocol
**Priority**: `P1 - High`  
**Target Module**: `api/services/twoPhaseCommit.js`  
**Status**: 🟡 Planned  

---

### 📖 User Story
As a lead platform architect, I want two-phase commit protocol implemented for cross-system settlements with partner banks and clearing networks so both sides commit or abort in unison.

### 🎯 Acceptance Criteria
- [ ] **Phase 1 (Prepare)**: Validate balance, place hold on funds, query partner bank readiness, and lock transaction token.
- [ ] **Phase 2 (Commit)**: Deduct held funds and dispatch confirmation once all participants reply with affirmative prepare vote.
- [ ] **Timeout Abort**: If any participant does not respond within 30 seconds, issue abort and release the balance hold.
- [ ] **Idempotent Recovery**: Endpoints support re-querying prepare status to recover in-doubt transactions.

### 🧪 Test Scenarios
- Simulate network disconnection during Prepare phase; verify timeout automatically aborts and frees the customer balance hold."""
        }
    ]

    print("\n--- Publishing All 10 Engineering Issues ---")
    created = []
    for issue in issues:
        payload = {
            "title": issue["title"],
            "body": issue["body"],
            "labels": issue["labels"]
        }
        if issue.get("milestone"):
            payload["milestone"] = issue["milestone"]
        
        res = api_call("issues", data=payload, method="POST")
        if "number" in res:
            num = res["number"]
            title = res["title"]
            url = res["html_url"]
            print("  ✓ [#" + str(num) + "] " + title)
            print("    URL: " + url)
            created.append((num, title, url))
        else:
            print("  ✗ Failed on " + issue["title"] + ":", res)
        time.sleep(0.5)

    print("\n==========================================================")
    print("SUCCESS: Published " + str(len(created)) + " issues to https://github.com/" + REPO + "/issues")
    print("==========================================================")

if __name__ == "__main__":
    setup_labels()
    mapping = setup_milestones()
    publish_issues(mapping)

