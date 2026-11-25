# Security Specification — RHINOLOG Self-Created Accounts & Admin/Guest RBAC

## 1. Data Invariants
1. **Single-Claim Admin Bootstrap**:
   - `/appMeta/bootstrap` stores only `{ id: "bootstrap", initialized: true, adminUid, createdAt, updatedAt }` (zero PII).
   - Creation succeeds ONLY once (`!exists(/appMeta/bootstrap)`) and atomically binds `/admins/{adminUid}` and `/accounts/{adminUid}` (`role: "admin"`). Updates and deletes on `/appMeta/bootstrap` and `/admins/{userId}` are forbidden (`false`).
2. **Trusted Database RBAC (Admin vs Guest)**:
   - Admin status is verified strictly via `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`, never via unverified email claims or client flags.
   - Guest accounts can ONLY be created, disabled, or deleted in `/accounts/{userId}` by an authenticated Admin (`isAdmin()`). Self-promotion (`role: "admin"`) is forbidden.
3. **Trash vs Permanent Delete Lifecycle**:
   - **Active Cases (`isTrashed: false, deleted: false`)**: Readable and editable by Admin and active Guests listed in `authorizedUids` (bounded `<= 50`).
   - **Moving to Trash (`isTrashed: true`)**: Guests can move active cases to Trash (`isTrashed: true`, `trashedAt`, `trashedBy`), keeping `deleted: false` and `authorizedUids` unchanged.
   - **Admin-Only Trash Visibility & Restoration**: Guests CANNOT list, get, edit, or restore cases where `isTrashed == true` or `deleted == true`. Only Admin (`isAdmin() && existing().adminUid == request.auth.uid`) can view trashed cases, restore them (`isTrashed: false`), or permanently delete them (`deleted: true` or `deleteDoc`).
4. **No `get()`/`exists()` in `allow list`**:
   - `/accounts` `allow list`: `isSignedIn() && resource.data.adminUid == request.auth.uid`.
   - `/clinicCases` & `/clinicCases/{caseId}/images` `allow list`: `isSignedIn() && (resource.data.adminUid == request.auth.uid || (request.auth.uid in resource.data.authorizedUids && resource.data.isTrashed == false && resource.data.deleted == false))` (and image `authorizedUids` check without `get()`/`exists()`).
5. **Temporal Integrity & Zero Ghost Fields**:
   - `createdAt == request.time` on create (immutable thereafter), `updatedAt == request.time` on all writes, strict `keys().hasAll/hasOnly` + `affectedKeys().hasOnly`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. Unauthenticated read/write on `/clinicCases/c1` -> `PERMISSION_DENIED`
2. Second user attempts to overwrite or create `/appMeta/bootstrap` after Admin exists -> `PERMISSION_DENIED`
3. Guest or unauthenticated user attempts to create `/admins/{uid}` -> `PERMISSION_DENIED`
4. Guest attempts to self-create or promote `/accounts/{uid}` with `role: "admin"` -> `PERMISSION_DENIED`
5. Disabled Guest (`active: false`) attempts to create/update `/clinicCases` -> `PERMISSION_DENIED`
6. Guest attempts to hard `delete` `/clinicCases/c1` or set `deleted: true` -> `PERMISSION_DENIED`
7. Guest attempts to list, read, or restore a trashed case (`isTrashed == true`) -> `PERMISSION_DENIED`
8. Guest attempts to modify `authorizedUids` or `adminUid` on a case -> `PERMISSION_DENIED`
9. Shadow/ghost field injection (`{ isAdmin: true }`) on account or case -> `PERMISSION_DENIED`
10. Client-forged `createdAt` or `updatedAt` timestamp -> `PERMISSION_DENIED`
11. Orphaned image write under non-existent or trashed parent case by Guest -> `PERMISSION_DENIED`
12. ID poisoning (`/` traversal or >128 chars) or unbounded `authorizedUids` (>50) -> `PERMISSION_DENIED`
