# Devloopmint Academy API — Auth Module

**Base URL:** `http://localhost:5000/api`

---

## Overview
- Users register with email/password.
- Email verification required (optional via `REQUIRE_EMAIL_VERIFIED_BEFORE_LOGIN`).
- Login returns **access_token** + **refresh_token**.
- Refresh endpoint rotates tokens.
- Logout revokes refresh token.
- Password reset implemented via email token.
- All mail flows log “EMAIL (dev)” content in dev mode (no real SMTP needed).

---

## Endpoints

### Health
**GET** `/api/health`  
Check service status.

---

### Register
**POST** `/api/auth/register`  
Registers a new user, sends verification email.

Request:
```json
{
  "full_name": "Test User",
  "email": "test@example.com",
  "password": "Secret123!",
  "phone_e164": "+123456789",
  "role_key": "customer"
}
```

Response:
```json
{ "ok": true, "user": { "id": "...", "email": "test@example.com", "full_name": "Test User" } }
```

---

### Login
**POST** `/api/auth/login`  
Login with email/password.

Request:
```json
{ "email": "test@example.com", "password": "Secret123!" }
```

Response:
```json
{
  "ok": true,
  "user": { "id": "...", "email": "test@example.com", "full_name": "Test User" },
  "access_token": "...",
  "refresh_token": "..."
}
```

- If `REQUIRE_EMAIL_VERIFIED_BEFORE_LOGIN=true` and not verified → `401 Email not verified`.

---

### Refresh
**POST** `/api/auth/refresh`  
Rotates refresh token.

Request:
```json
{ "refresh_token": "<old_token>" }
```

Response:
```json
{ "ok": true, "user": {...}, "access_token": "...", "refresh_token": "..." }
```

---

### Logout
**POST** `/api/auth/logout`  
Revokes refresh token.

Request:
```json
{ "refresh_token": "<token>" }
```

Response:
```json
{ "ok": true }
```

---

### Get Current User
**GET** `/api/auth/me` (protected)  
Requires `Authorization: Bearer <access_token>`.

Response:
```json
{ "ok": true, "user": { "id": "...", "email": "..." } }
```

---

### Email Verification
- **POST** `/api/auth/resend-verification`
    - Body: `{ "email": "test@example.com" }`
    - Always returns ok, only sends if unverified.

- **GET** `/api/auth/verify-email?token=<TOKEN>`
    - Marks user as verified.

Response:
```json
{ "ok": true, "message": "Email verified" }
```

---

### Password Reset
- **POST** `/api/auth/forgot-password`
    - Body: `{ "email": "test@example.com" }`
    - Always returns ok, only sends if user exists.

- **POST** `/api/auth/reset-password`
    - Body: `{ "token": "<TOKEN>", "password": "NewStrongP@ssw0rd" }`
    - Updates user password, marks token used.

Response:
```json
{ "ok": true, "message": "Password has been reset" }
```

---

## Database Tables

- **users**
    - `email_verified_at TIMESTAMPTZ NULL` (null = unverified, timestamp = verified)

- **auth_refresh_tokens**
    - Stores hashed refresh tokens, with `expires_at` and `revoked_at`

- **auth_email_verifications**
    - Stores hashed verification tokens with `expires_at`, `used_at`

- **auth_password_resets**
    - Stores hashed reset tokens with `expires_at`, `used_at`

---

## Tested Flows ✅
- Register new user → Verification email logged.
- Resend verification → Token row created → Verify via GET endpoint → `email_verified_at` updated.
- Login/Refresh/Logout flows tested successfully.
- Forgot password → Reset email logged → Reset with token → Login works with new password.
- Tokens expire (`24h` for verification, `30m` for reset, configurable days for refresh).

---

## Next Steps 
- Add password strength validation.
- Add rate limiting to `forgot-password` and `resend-verification`.
- Add role-based access control enforcement on admin endpoints.
- Optional: force-reset endpoint for admins.
