import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Payload-First Security Spec Verification for RHINOLOG Firestore Rules.
 * Verifies that personal and shared multi-account workspace invariants exist in firestore.rules.
 */
const rulesContent = readFileSync('firestore.rules', 'utf8');

describe('RHINOLOG Firestore Security Rules (Personal + Shared Workspace)', () => {
  it('enforces rules_version 2 and default-deny catch-all', () => {
    assert.ok(rulesContent.includes("rules_version = '2';"));
    assert.ok(rulesContent.includes('match /{document=**}'));
    assert.ok(rulesContent.includes('allow read, write: if false;'));
  });

  it('requires email_verified == true and valid ID regex on all writes', () => {
    assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));
    assert.ok(rulesContent.includes("id.matches('^[a-zA-Z0-9_\\\\-]+$')"));
    assert.ok(rulesContent.includes('isValidId(caseId)'));
    assert.ok(rulesContent.includes('isValidId(workspaceId)'));
  });

  it('prevents enumeration of workspaceInvites and restricts join updates to self-append', () => {
    assert.ok(rulesContent.includes('match /workspaceInvites/{inviteCode}'));
    assert.ok(rulesContent.includes('allow list: if false;'));
    assert.ok(rulesContent.includes('incoming().memberUids.hasAll(existing().memberUids)'));
    assert.ok(rulesContent.includes('incoming().memberEmails.hasAll(existing().memberEmails)'));
  });

  it('enforces bounded member arrays (<= 20) and Master Gate parent checks', () => {
    assert.ok(rulesContent.includes('data.memberUids.size() <= 20'));
    assert.ok(rulesContent.includes('data.memberEmails.size() <= 20'));
    assert.ok(rulesContent.includes('exists(/databases/$(database)/documents/workspaces/$(workspaceId))'));
    assert.ok(rulesContent.includes('exists(/databases/$(database)/documents/workspaces/$(workspaceId)/cases/$(caseId))'));
  });

  it('enforces strict request.time timestamps and immutable owner/createdAt', () => {
    assert.ok(rulesContent.includes('incoming().createdAt == request.time'));
    assert.ok(rulesContent.includes('incoming().updatedAt == request.time'));
    assert.ok(rulesContent.includes('incoming().ownerId == existing().ownerId'));
    assert.ok(rulesContent.includes('incoming().createdAt == existing().createdAt'));
  });

  it('restricts list queries via resource.data without get() or exists()', () => {
    assert.ok(rulesContent.includes('allow list: if isSignedIn() && isOwner(userId) && resource.data.ownerId == request.auth.uid;'));
    assert.ok(rulesContent.includes('allow list: if isEmailVerified() && isDocMember(resource.data);'));
  });
});
