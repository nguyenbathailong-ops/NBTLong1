# Security Specification — RHINOLOG Multi-Account Cloud Sync

## 1. Data Invariants
1. **Strict Personal & Workspace Isolation**:
   - Personal documents under `/users/{userId}/**` are readable/writable strictly by `request.auth.uid == userId`.
   - Shared workspace documents under `/workspaces/{workspaceId}/**` are readable/writable strictly by verified users whose `uid` is in `memberUids` OR whose verified `email` is in `memberEmails` (capped at max 20 collaborators).
2. **Email Spoofing Defense**: Every check against `request.auth.token.email` strictly mandates `request.auth.token.email_verified == true`.
3. **Join Integrity via Invite Code**:
   - `/workspaceInvites/{inviteCode}` forbids `allow list` to prevent enumeration.
   - Joining `/workspaces/{workspaceId}` via `inviteCode` enforces `incoming().memberUids.hasAll(existing().memberUids)` and `incoming().memberEmails.hasAll(existing().memberEmails)` so a joining account can ONLY append itself and cannot remove existing members or alter `ownerId`/`name`/`inviteCode`.
4. **Master Gate & Relational Integrity**:
   - `WorkspaceClinicalCase` creation/update verifies parent `/workspaces/{workspaceId}` exists and the caller is an authorized member.
   - `WorkspaceCaseImage` creation/update verifies parent `/workspaces/{workspaceId}/cases/{caseId}` exists and the caller is a workspace member.
5. **No `get()`/`exists()` in `allow list`**: Every `allow list` block evaluates `resource.data` directly against `request.auth.uid` / `request.auth.token.email`.
6. **Temporal Integrity & Zero Ghost Fields**: `createdAt == request.time` on create (immutable thereafter), `updatedAt == request.time` on all writes, and strict `keys().hasAll/hasOnly` + `affectedKeys().hasOnly`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. Unauthenticated read/write on `/workspaces/w1/cases/c1` -> `PERMISSION_DENIED`
2. Unverified email (`email_verified: false`) matching `memberEmails` attempts list/get/write -> `PERMISSION_DENIED`
3. Non-member user attempts to list `/workspaces` or `/workspaces/w1/cases` -> `PERMISSION_DENIED`
4. Attacker attempts `list` on `/workspaceInvites` to enumerate join codes -> `PERMISSION_DENIED`
5. Joining member attempts to remove owner from `memberUids` during join update -> `PERMISSION_DENIED`
6. Non-owner member attempts to change workspace `name`, `ownerId`, or `inviteCode` -> `PERMISSION_DENIED`
7. Non-owner member attempts hard `delete` on workspace or workspace case -> `PERMISSION_DENIED`
8. Shadow/ghost field injection (`{ isAdmin: true }`) on workspace or case -> `PERMISSION_DENIED`
9. Client-forged `createdAt` or `updatedAt` timestamp -> `PERMISSION_DENIED`
10. Orphaned image write under non-existent workspace case -> `PERMISSION_DENIED`
11. ID poisoning (>128 chars or `/` traversal) -> `PERMISSION_DENIED`
12. Unbounded array attack (>20 `memberUids` or >20 `memberEmails` or >20 `admissionReasons`) -> `PERMISSION_DENIED`
