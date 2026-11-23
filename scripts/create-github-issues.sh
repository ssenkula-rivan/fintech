#!/usr/bin/env python3
"""
Automated Issue Publisher for GMG Fintech Platform
Repository: ssenkula-rivan/fintech
Usage: GITHUB_TOKEN="ghp_xxx" ./scripts/create-github-issues.sh
"""

import os
import sys
import json
import urllib.request
import urllib.error

REPO = "ssenkula-rivan/fintech"
TOKEN = os.environ.get("GITHUB_TOKEN")

if not TOKEN:
    print("=" * 60)
    print("Error: GITHUB_TOKEN environment variable is not set.")
    print("Generate a Personal Access Token (classic or fine-grained with 'Issues: Read and Write') at:")
    print("  https://github.com/settings/tokens")
    print("Then run:")
    print("  GITHUB_TOKEN=\"ghp_your_token_here\" python3 scripts/create-github-issues.sh")
    print("=" * 60)
    sys.exit(1)

ISSUES = [
    {
        "title": "[ISSUE-001] Transaction Lifecycle Management & State Machine Enforcement",
        "labels": ["fintech-core", "p0-blocker", "backend"],
        "body": """### Priority: P0 - Blocker
### Component: `api/services/transactionManager.js`

### User Story
As a financial operations manager, I want all transactions to follow a strictly enforced lifecycle state machine so that race conditions, orphan states, and inconsistent ledger balances are mathematically impossible.

### Acceptance Criteria
- [ ] Strict state transitions: `PENDING` -> `PROCESSING` -> `COMPLETED` | `FAILED` | `REVERSED` | `EXPIRED`
- [ ] Transition validation: Prevent illegal state changes (e.g. `COMPLETED` cannot revert to `PENDING`)
- [ ] Auto-expiry: Mark transactions in `PENDING` longer than 15 minutes as `EXPIRED`
- [ ] Immutable audit state history recording actor, timestamp, and transition reason"""
    },
    {
        "title": "[ISSUE-002] Database Transaction Integrity (ACID) & Row-Level Locking",
        "labels": ["fintech-core", "p0-blocker", "database"],
        "body": """### Priority: P0 - Blocker
### Component: `api/config/database.js`, `api/services/wallet.js`

### User Story
As a core platform engineer, I require all balance operations to strictly adhere to ACID guarantees so that double-spending and balance drift never occur under high concurrent load.

### Acceptance Criteria
- [ ] Wrap debit and credit operations in explicit `BEGIN ... COMMIT/ROLLBACK` blocks
- [ ] Implement pessimistic row locking (`SELECT ... FOR UPDATE`) before balance mutations
- [ ] Enforce `READ COMMITTED` minimum isolation level
- [ ] Atomic rollback if any intermediate step fails"""
    },
    {
        "title": "[ISSUE-003] Idempotency Service for Duplicate Transaction Prevention",
        "labels": ["api-gateway", "p0-blocker", "security"],
        "body": """### Priority: P0 - Blocker
### Component: `api/middleware/idempotency.js`

### User Story
As a customer using mobile money, I want retry attempts on unstable networks to never double-charge my wallet.

### Acceptance Criteria
- [ ] Enforce `X-Idempotency-Key` header on all payment initiation endpoints
- [ ] Cache idempotency keys with responses in Redis/MySQL for at least 24 hours
- [ ] Return HTTP 409 (Conflict) if duplicate request arrives while transaction is still `PROCESSING`
- [ ] Return cached original response on repeated requests for `COMPLETED` transactions"""
    },
    {
        "title": "[ISSUE-004] Append-Only Audit Trail Logging with Cryptographic Hash Chain",
        "labels": ["security", "compliance", "p0-blocker"],
        "body": """### Priority: P0 - Blocker
### Component: `api/services/auditLogger.js`, `api/database.sql`

### User Story
As a compliance officer, I need an immutable, mathematically verifiable audit trail for Bank of Uganda regulatory audits.

### Acceptance Criteria
- [ ] Append-only audit table with database permissions restricted to `INSERT, SELECT`
- [ ] Log: `transaction_id`, `user_id`, `action`, `old_value`, `new_value`, `ip_address`, `user_agent`, `timestamp`
- [ ] SHA-256 cryptographic chaining where each record includes the hash of the preceding record
- [ ] Daily verification script checking cryptographic chain continuity"""
    },
    {
        "title": "[ISSUE-005] Telecom Payment Processing Logging & PII Masking (MTN & Airtel)",
        "labels": ["telecom", "p1-high", "integrations"],
        "body": """### Priority: P1 - High
### Component: `api/services/mtnMomo.js`, `api/services/airtelMoney.js`

### User Story
As a support engineer, I need searchable logs of telecom payment interactions while safeguarding sensitive customer PII.

### Acceptance Criteria
- [ ] Structured request/response logging for MTN Open API and Airtel Money Open API
- [ ] Mask phone numbers (`+256 77****123`) and strip PINs from telemetry
- [ ] Map provider external reference numbers to internal UUIDs
- [ ] Structured error code handling for telecom timeout, subscriber inactive, or low balance"""
    },
    {
        "title": "[ISSUE-006] Automated Compensating Transactions & Rollback Engine",
        "labels": ["distributed-systems", "p1-high", "reliability"],
        "body": """### Priority: P1 - High
### Component: `api/services/compensate.js`

### User Story
As a system, I want automatic rollbacks if downstream telecom or clearing providers fail after internal wallet debit.

### Acceptance Criteria
- [ ] Register inverse compensating action prior to dispatching forward step
- [ ] Trigger automatic refund/credit if external provider returns fatal error or timeout
- [ ] Escalate to manual operations queue if automated reversal fails after 3 retries
- [ ] Create linked audit record connecting reversal to original transaction ID"""
    },
    {
        "title": "[ISSUE-007] Distributed Saga Pattern Orchestration",
        "labels": ["distributed-systems", "p1-high", "architecture"],
        "body": """### Priority: P1 - High
### Component: `api/services/sagaOrchestrator.js`

### User Story
As a system architect, I want complex cross-service flows (Wallet -> FX -> Telecom Payout) coordinated reliably across restarts.

### Acceptance Criteria
- [ ] State machine orchestrator recording progress of each discrete step in database
- [ ] Persistent saga state surviving application node crashes or restarts
- [ ] Topological reverse rollback on step failure
- [ ] Metrics instrumentation measuring saga latency and compensation rate"""
    },
    {
        "title": "[ISSUE-008] Referential Integrity & Daily Automated Balance Reconciliation",
        "labels": ["accounting", "p0-blocker", "audit"],
        "body": """### Priority: P0 - Blocker
### Component: `api/services/reconciliation.js`, `api/scripts/dailyReconciliation.js`

### User Story
As a financial auditor, I need automated proof that every wallet balance strictly equals the sum of credits minus debits.

### Acceptance Criteria
- [ ] Enforce database `CHECK (balance >= 0)` on non-credit wallets
- [ ] Daily scheduled job computing `SUM(credits) - SUM(debits)` vs cached balance
- [ ] Immediately freeze wallet and sound P0 alert if variance > 0 is found
- [ ] Generate daily audit reconciliation report"""
    },
    {
        "title": "[ISSUE-009] Revenue, Fee Calculation & FX Conversion Spread Tracking",
        "labels": ["analytics", "p2-medium", "revenue"],
        "body": """### Priority: P2 - Medium
### Component: `api/routes/exchange.js`, `api/services/gmgExchange.js`

### User Story
As a business analyst, I want exact tracking of fee income, FX spreads, and promo discounts across all transactions.

### Acceptance Criteria
- [ ] Categorize fee events: `transaction_fee`, `withdrawal_fee`, `conversion_spread`
- [ ] Record base currency, quote currency, raw provider rate, applied customer rate, and spread profit
- [ ] Support promotional fee discount code validation and tracking
- [ ] Aggregate daily and monthly gross revenue reports"""
    },
    {
        "title": "[ISSUE-010] Two-Phase Commit (2PC) Protocol for External Settlements",
        "labels": ["fintech-core", "p1-high", "architecture"],
        "body": """### Priority: P1 - High
### Component: `api/services/twoPhaseCommit.js`

### User Story
As a financial institution partner, I require two-phase commit verification for high-value inter-system settlements.

### Acceptance Criteria
- [ ] Phase 1 (Prepare): validate funds and place balance hold without committing
- [ ] Phase 2 (Commit): finalize settlement only when all participants confirm prepare phase
- [ ] Automatic abort and hold release if any participant fails or times out (30s)
- [ ] Idempotent commit and rollback endpoints for recovery"""
    }
]

def create_issue(issue):
    url = f"https://api.github.com/repos/{REPO}/issues"
    headers = {
        "User-Agent": "GMG-Fintech-Setup",
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/vnd.github+json"
    }
    payload = json.dumps(issue).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"✓ Created Issue #{data.get('number')}: {data.get('title')}")
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"✗ Failed to create '{issue['title']}': HTTP {e.code} - {err}")
    except Exception as e:
        print(f"✗ Error: {e}")

def main():
    print("=" * 60)
    print(f"Publishing {len(ISSUES)} Architectural Issues to {REPO}...")
    print("=" * 60)
    for issue in ISSUES:
        create_issue(issue)
    print("=" * 60)
    print(f"Done! Check issues at: https://github.com/{REPO}/issues")
    print("=" * 60)

if __name__ == "__main__":
    main()
