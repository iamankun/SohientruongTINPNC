# Security Specification & Hardened Rules Audit

## 1. Data Invariants
1. **Ownership Isolation**: Every document in `/categories/{categoryId}` and `/records/{recordId}` belongs strictly to one authenticated, email-verified user (`ownerId == request.auth.uid`). No cross-user reads, lists, updates, or deletes are permitted.
2. **Relational Integrity**: A `FieldRecord` cannot be created unless its referenced `categoryId` exists in `/categories/{categoryId}` and is owned by `request.auth.uid`.
3. **Immutability & Temporal Integrity**: `ownerId` and `createdAt` are immutable after creation; `createdAt` (on create) and `updatedAt` (on create/update) must equal `request.time`.
4. **Terminal State Locking**: Once a `FieldRecord` reaches `status == 'da_luu_tru'`, further updates are blocked.
5. **Bounded Payloads**: All strings enforce `.size()` limits, `fields` list on `Category` is capped at `20`, `customData` map on `FieldRecord` is capped at `25` keys, and document IDs must match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing (Category Create)**: `{ "ownerId": "other_uid", ... }` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: Authenticated user with `email_verified: false` creating a record -> `PERMISSION_DENIED`.
3. **Orphaned Record Create**: Record with `categoryId: "nonexistent_cat"` -> `PERMISSION_DENIED`.
4. **Cross-Tenant Category Hijack**: Record referencing a `categoryId` owned by another user -> `PERMISSION_DENIED`.
5. **Shadow Field Injection**: Category create payload containing extra `"isAdmin": true` -> `PERMISSION_DENIED`.
6. **ID Poisoning**: Creating `/records/bad$id!` or 500-char ID -> `PERMISSION_DENIED`.
7. **Timestamp Forgery**: Record create with client-forged `createdAt` != `request.time` -> `PERMISSION_DENIED`.
8. **Immutable Owner Tampering**: Updating a record's `ownerId` -> `PERMISSION_DENIED`.
9. **Terminal State Mutation**: Updating a `FieldRecord` whose existing `status == 'da_luu_tru'` -> `PERMISSION_DENIED`.
10. **Denial-of-Wallet String Overflow**: Record `notes` of 5,000 characters (`> 2000`) -> `PERMISSION_DENIED`.
11. **Unbounded Array Attack**: Category `fields` array with 25 items (`> 20`) -> `PERMISSION_DENIED`.
12. **Blanket List Query Scraping**: Listing `/records` without filtering `ownerId == request.auth.uid` -> `PERMISSION_DENIED`.
