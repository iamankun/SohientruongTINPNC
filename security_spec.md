# Security Specification & Hardened Rules Audit

## 1. Data Invariants
1. **Ownership Isolation & Admin Oversight**: Every document in `/categories/{categoryId}` and `/records/{recordId}` belongs strictly to one authenticated, email-verified user (`ownerId == request.auth.uid`). Designated administrators (`ankun.n.m@gmail.com` verified or listed in `/admins/{request.auth.uid}`) have supervisory read/update/delete access across records and can designate/revoke other administrators.
2. **PII Isolation**: User profiles in `/users/{userId}` (containing `email`, `displayName`, `photoURL`) are strictly private — readable on `get` only by `isOwner(userId) || isAdmin()`, and `list` is restricted solely to `isAdmin()`.
3. **Admin Grant Integrity**: Only verified existing administrators (`isAdmin()`) can list, create, or delete `/admins/{adminId}` entries; self-deletion and deletion of the root administrator (`ankun.n.m@gmail.com`) are blocked.
4. **Relational & Temporal Integrity**: A `FieldRecord` cannot be created unless its referenced `categoryId` exists and is owned by `request.auth.uid`. `ownerId`, `createdAt` remain immutable; `createdAt`/`updatedAt` must equal `request.time`.
5. **Terminal State Locking**: Once a `FieldRecord` reaches `status == 'da_luu_tru'`, regular owners cannot modify it; only `isAdmin()` can override and correct archived records.
6. **Bounded Payloads**: All strings enforce `.size()` limits, `fields` list on `Category` is capped at `20`, `customData` map on `FieldRecord` is capped at `25` keys, and document IDs must match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing (Category Create)**: `{ "ownerId": "other_uid", ... }` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: Authenticated user with `email_verified: false` creating a record -> `PERMISSION_DENIED`.
3. **Self-Promotion to Admin**: Non-admin creating `/admins/<self_uid>` -> `PERMISSION_DENIED`.
4. **Email Spoof Admin Escalation**: User with `email == 'ankun.n.m@gmail.com'` and `email_verified: false` -> `PERMISSION_DENIED`.
5. **PII Blanket Read**: Non-admin listing `/users` or getting `/users/other_uid` -> `PERMISSION_DENIED`.
6. **Orphaned Record Create**: Record with `categoryId: "nonexistent_cat"` -> `PERMISSION_DENIED`.
7. **Shadow Field Injection**: Payload containing extra `"role": "superadmin"` -> `PERMISSION_DENIED`.
8. **ID Poisoning**: Creating `/admins/bad$id!` or 500-char ID -> `PERMISSION_DENIED`.
9. **Timestamp Forgery**: Create with client-forged `createdAt` != `request.time` -> `PERMISSION_DENIED`.
10. **Immutable Owner Tampering**: Updating a record's `ownerId` -> `PERMISSION_DENIED`.
11. **Terminal State Mutation**: Non-admin updating a `FieldRecord` whose existing `status == 'da_luu_tru'` -> `PERMISSION_DENIED`.
12. **Blanket List Query Scraping**: Non-admin listing `/records` without filtering `ownerId == request.auth.uid` -> `PERMISSION_DENIED`.
