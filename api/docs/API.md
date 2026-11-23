# GMG Uganda API Documentation

## Base URL
- Development: `http://localhost:3010/api`
- Production: `https://api.gmguganda.com/api`

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Rate Limits
| Endpoint Type | Limit |
|--------------|-------|
| Authentication | 5 requests / 15 min |
| OTP Sending | 3 requests / hour |
| Transactions | 10 requests / min |
| General API | 100 requests / min |

---

## Endpoints

### Authentication

#### POST /api/auth/send-otp
Send OTP to phone number for login.

**Request:**
```json
{
  "phone": "+256771234567"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "+256771234567",
    "expiresIn": 300,
    "expiresAt": "2025-01-01T12:05:00.000Z"
  }
}
```

#### POST /api/auth/verify-otp
Verify OTP and receive access tokens.

**Request:**
```json
{
  "phone": "+256771234567",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "phone": "+256771234567",
      "firstName": "John",
      "lastName": "Doe",
      "kycTier": 1,
      "status": "ACTIVE"
    },
    "wallets": [
      { "currency": "UGX", "balance": 50000, "status": "ACTIVE" }
    ]
  }
}
```

#### POST /api/auth/refresh
Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /api/auth/logout
Logout and revoke tokens.

---

### Wallet

#### GET /api/wallet/balance
Get wallet balances. **Requires authentication.**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "wallets": [
      {
        "currency": "UGX",
        "balance": 150000,
        "lockedBalance": 0,
        "dailyLimit": 5000000,
        "dailySpent": 50000,
        "status": "ACTIVE"
      }
    ]
  }
}
```

---

### Transactions

#### POST /api/transactions/send
Send money to another user. **Requires authentication + PIN.**

**Request:**
```json
{
  "recipient_phone": "+256771234567",
  "amount": 50000,
  "pin": "123456",
  "description": "Payment for services"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactionId": 123,
    "reference": "TRF1704067200000",
    "status": "COMPLETED",
    "amount": 50000,
    "fee": 250,
    "totalDebited": 50250,
    "newBalance": 99750,
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
```

#### POST /api/transactions/deposit
Initiate mobile money deposit. **Requires authentication.**

**Request:**
```json
{
  "amount": 100000,
  "method": "MTN",
  "phone": "+256771234567"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactionId": 124,
    "reference": "DEP1704067200000",
    "status": "PENDING",
    "paymentInstructions": "A payment prompt has been sent to your phone.",
    "expiresAt": "2025-01-01T12:15:00.000Z"
  }
}
```

#### POST /api/transactions/withdraw
Withdraw to mobile money. **Requires authentication + PIN.**

**Request:**
```json
{
  "amount": 50000,
  "method": "MTN",
  "phone": "+256771234567",
  "pin": "123456"
}
```

#### GET /api/transactions
Get transaction history. **Requires authentication.**

**Query Parameters:**
- `limit` (default: 20)
- `offset` (default: 0)
- `type` (DEPOSIT, WITHDRAWAL, TRANSFER)
- `status` (PENDING, COMPLETED, FAILED)

---

### Bills & Airtime

#### POST /api/bills/airtime
Purchase airtime. **Requires authentication.**

**Request:**
```json
{
  "phoneNumber": "+256771234567",
  "network": "MTN",
  "amount": 5000,
  "country": "UG"
}
```

---

### Dashboard

#### GET /api/dashboard
Get user dashboard data. **Requires authentication.**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "wallets": [ ... ],
    "recentTransactions": [ ... ]
  }
}
```

---

### Beneficiaries

#### GET /api/beneficiaries
Get saved beneficiaries. **Requires authentication.**

#### POST /api/beneficiaries
Add new beneficiary. **Requires authentication.**

**Request:**
```json
{
  "phone": "+256771234567",
  "name": "John Doe"
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| TOKEN_EXPIRED | 401 | Access token has expired |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| INSUFFICIENT_FUNDS | 400 | Not enough balance |
| RATE_LIMIT | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Webhooks

### MTN MoMo Callback
`POST /api/webhooks/mtn-callback`

### Airtel Money Callback
`POST /api/webhooks/airtel-callback`

Webhooks require signature verification via `X-MTN-Signature` or `X-Airtel-Signature` headers.

---

### Push Notifications

#### POST /api/notifications/register-device
Register device for push notifications. **Requires authentication.**

**Request:**
```json
{
  "pushToken": "ExponentPushToken[xxx]",
  "platform": "ios",
  "deviceName": "iPhone 15"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Device registered for push notifications"
}
```

#### DELETE /api/notifications/unregister-device
Unregister device from push notifications. **Requires authentication.**

**Request:**
```json
{
  "pushToken": "ExponentPushToken[xxx]"
}
```

#### PUT /api/notifications/preferences
Update notification preferences. **Requires authentication.**

**Request:**
```json
{
  "enabled": true,
  "transactions": true,
  "security": true,
  "promotions": false,
  "kyc": true
}
```

#### GET /api/notifications/preferences
Get notification preferences. **Requires authentication.**

---

## API Versioning

All endpoints are available under `/api/v1/` for versioned access:
- `/api/v1/auth/*`
- `/api/v1/wallet/*`
- `/api/v1/transactions/*`
- etc.

The v1 API is stable and will maintain backward compatibility.

---

## Health & Monitoring

#### GET /health
Returns server health status.

#### GET /metrics
Returns performance metrics. **Requires METRICS_API_KEY in production.**
