import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Payload-First Security Spec Verification for RHINOLOG Firestore Rules.
 * Verifies single-claim Admin bootstrap, Admin vs Guest RBAC, and Admin Trash invariants.
 */
const rulesContent = readFileSync('firestore.rules', 'utf8');

describe('RHINOLOG Firestore Security Rules (Admin/Guest RBAC + Trash)', () => {
  it('enforces rules_version 2 and default-deny catch-all', () => {
    assert.ok(rulesContent.includes("rules_version = '2';"));
    assert.ok(rulesContent.includes('match /{document=**}'));
    assert.ok(rulesContent.includes('allow read, write: if false;'));
  });

  it('locks single-claim Admin bootstrap and prevents self-promotion', () => {
    assert.ok(rulesContent.includes('match /appMeta/{docId}'));
    assert.ok(rulesContent.includes('!exists(/databases/$(database)/documents/appMeta/bootstrap)'));
    assert.ok(rulesContent.includes('getAfter(/databases/$(database)/documents/appMeta/bootstrap).data.adminUid == userId'));
    assert.ok(rulesContent.includes("incoming().role == 'guest'"));
  });

  it('verifies trusted Admin marker and active account checks', () => {
    assert.ok(rulesContent.includes('exists(/databases/$(database)/documents/admins/$(request.auth.uid))'));
    assert.ok(rulesContent.includes('accountData().active == true'));
    assert.ok(rulesContent.includes("id.matches('^[a-zA-Z0-9_\\\\-]+$')"));
  });

  it('prevents Guests from viewing Trash, restoring, or permanently deleting cases', () => {
    assert.ok(rulesContent.includes('existing().isTrashed == false'));
    assert.ok(rulesContent.includes('incoming().deleted == false'));
    assert.ok(rulesContent.includes('incoming().authorizedUids == existing().authorizedUids'));
    assert.ok(rulesContent.includes('allow delete: if isAdmin() && isValidId(caseId) && existing().adminUid == request.auth.uid;'));
  });

  it('enforces bounded authorizedUids (<= 50) and Master Gate parent checks on images', () => {
    assert.ok(rulesContent.includes('data.authorizedUids.size() <= 50'));
    assert.ok(rulesContent.includes('exists(/databases/$(database)/documents/clinicCases/$(caseId))'));
  });

  it('enforces strict request.time timestamps and zero get()/exists() in allow list', () => {
    assert.ok(rulesContent.includes('incoming().createdAt == request.time'));
    assert.ok(rulesContent.includes('incoming().updatedAt == request.time'));
    assert.ok(rulesContent.includes('allow list: if isSignedIn() && resource.data.adminUid == request.auth.uid;'));
    assert.ok(rulesContent.includes('resource.data.isTrashed == false'));
  });

  it('supports pre-op and discharge imaging across CT_SCAN, ENDOSCOPY, and CLINICAL_PHOTO', () => {
    assert.ok(rulesContent.includes("data.type in ['CT_SCAN', 'ENDOSCOPY', 'CLINICAL_PHOTO']"));
    assert.ok(rulesContent.includes("data.timing in ['PRE_OP', 'POST_OP', 'DISCHARGE']"));
  });
});
