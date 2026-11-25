import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { firestoreDb, handleFirestoreError, OperationType } from '../firebase';
import { db } from '../db/indexedDB';
import { ClinicalImage, PatientCase } from '../types/medical';
import { compressImageToDataUrl } from '../utils/imageCompression';

export interface SharedWorkspace {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  memberUids: string[];
  memberEmails: string[];
}

function sanitizeId(rawId: string): string {
  const cleaned = (rawId || 'id').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return cleaned.length > 0 ? cleaned : 'id-' + Date.now();
}

function sanitizeDate(rawDate?: string): string {
  if (rawDate && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(rawDate)) {
    return rawDate;
  }
  return new Date().toISOString().split('T')[0];
}

function clampStr(val: unknown, maxLen: number, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  return val.slice(0, maxLen);
}

function clampNum(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || Number.isNaN(val)) return fallback;
  return Math.min(max, Math.max(min, val));
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        result[k] = stripUndefined(v);
      }
    }
    return result as T;
  }
  return value;
}

function normalizeEmail(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase().slice(0, 320);
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RHINO-${suffix}`;
}

function buildCasePayload(c: PatientCase) {
  const payload = {
    age: typeof c.age === 'number' && !Number.isNaN(c.age) ? c.age : null,
    gender: clampStr(c.gender, 20, 'Nam'),
    address: clampStr(c.address, 40, 'TP HCM'),
    provinceDetails: c.provinceDetails ? clampStr(c.provinceDetails, 160) : null,
    ethnicity: clampStr(c.ethnicity, 60, 'Kinh'),
    occupation: clampStr(c.occupation, 80, 'Khác'),
    comorbidities: stripUndefined(c.comorbidities),
    admissionReasons: Array.isArray(c.admissionReasons)
      ? c.admissionReasons.filter((r): r is string => typeof r === 'string').slice(0, 20)
      : [],
    symptomDurationDays:
      typeof c.symptomDurationDays === 'number' && !Number.isNaN(c.symptomDurationDays)
        ? c.symptomDurationDays
        : null,
    treatmentBeforeAdmission: clampStr(c.treatmentBeforeAdmission, 60, 'Không điều trị'),
    priorTreatmentDetails: c.priorTreatmentDetails ? clampStr(c.priorTreatmentDetails, 1000) : null,
    nasalSymptoms: stripUndefined(c.nasalSymptoms),
    eyeSymptoms: stripUndefined(c.eyeSymptoms),
    neurologicalSymptoms: stripUndefined(c.neurologicalSymptoms),
    vitalSigns: stripUndefined(c.vitalSigns),
    labResults: stripUndefined(c.labResults),
    diseaseExtent: stripUndefined(c.diseaseExtent),
    lundMackay: stripUndefined(c.lundMackay),
    nasalPolypScoreR: clampNum(c.nasalPolypScoreR, 0, 4, 0),
    nasalPolypScoreL: clampNum(c.nasalPolypScoreL, 0, 4, 0),
    snot22Score:
      typeof c.snot22Score === 'number' && !Number.isNaN(c.snot22Score) ? c.snot22Score : null,
    treatmentFeatures: stripUndefined(c.treatmentFeatures),
    auditStatus: c.auditStatus ? stripUndefined(c.auditStatus) : null,
  };
  return stripUndefined(payload);
}

export async function ensureUserProfile(user: User): Promise<{ activeWorkspaceId: string | null }> {
  if (!navigator.onLine) return { activeWorkspaceId: null };
  const userPath = `users/${user.uid}`;
  const userRef = doc(firestoreDb, 'users', user.uid);
  const email = normalizeEmail(user.email) || 'unknown@example.com';
  const displayName = clampStr(user.displayName || user.email, 160, 'Bác sĩ');
  const photoURL = user.photoURL ? clampStr(user.photoURL, 1000) : null;

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email,
        displayName,
        photoURL,
        activeWorkspaceId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { activeWorkspaceId: null };
    } else {
      const data = snap.data();
      await updateDoc(userRef, {
        email,
        displayName,
        photoURL,
        updatedAt: serverTimestamp(),
      });
      return {
        activeWorkspaceId:
          typeof data.activeWorkspaceId === 'string' && data.activeWorkspaceId.length > 0
            ? data.activeWorkspaceId
            : null,
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function setUserActiveWorkspace(
  uid: string,
  workspaceId: string | null
): Promise<void> {
  if (!navigator.onLine) return;
  const userPath = `users/${uid}`;
  const userRef = doc(firestoreDb, 'users', uid);
  try {
    await updateDoc(userRef, {
      activeWorkspaceId: workspaceId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

function docToWorkspace(data: Record<string, any>, fallbackId: string): SharedWorkspace {
  return {
    id: data.id || fallbackId,
    name: data.name || 'Kho chung',
    ownerId: data.ownerId || '',
    inviteCode: data.inviteCode || '',
    memberUids: Array.isArray(data.memberUids) ? data.memberUids : [],
    memberEmails: Array.isArray(data.memberEmails) ? data.memberEmails : [],
  };
}

export async function discoverWorkspaceForUser(user: User): Promise<SharedWorkspace | null> {
  if (!navigator.onLine) return null;

  const userEmail = normalizeEmail(user.email);
  const { activeWorkspaceId } = await ensureUserProfile(user);

  // 1. Check explicitly selected activeWorkspaceId first
  if (activeWorkspaceId) {
    const wsPath = `workspaces/${activeWorkspaceId}`;
    try {
      const wsSnap = await getDoc(doc(firestoreDb, 'workspaces', activeWorkspaceId));
      if (wsSnap.exists()) {
        const ws = docToWorkspace(wsSnap.data(), wsSnap.id);
        if (ws.memberUids.includes(user.uid) || ws.memberEmails.includes(userEmail)) {
          if (!ws.memberUids.includes(user.uid) && ws.memberUids.length < 20) {
            await updateDoc(doc(firestoreDb, 'workspaces', ws.id), {
              memberUids: arrayUnion(user.uid),
              updatedAt: serverTimestamp(),
            });
            ws.memberUids = [...ws.memberUids, user.uid];
          }
          return ws;
        }
      }
    } catch {
      // User may have been removed from old workspace or workspace deleted; fall through to discovery
    }
  }

  // 2. Auto-discover any shared workspace where user's email or uid is authorized
  try {
    const wsCol = collection(firestoreDb, 'workspaces');
    const byEmailSnap = userEmail
      ? await getDocs(query(wsCol, where('memberEmails', 'array-contains', userEmail)))
      : null;

    let matchedDoc = byEmailSnap?.docs[0] || null;

    if (!matchedDoc) {
      const byUidSnap = await getDocs(
        query(wsCol, where('memberUids', 'array-contains', user.uid))
      );
      matchedDoc = byUidSnap.docs[0] || null;
    }

    if (matchedDoc) {
      const ws = docToWorkspace(matchedDoc.data(), matchedDoc.id);
      if (!ws.memberUids.includes(user.uid) && ws.memberUids.length < 20) {
        await updateDoc(doc(firestoreDb, 'workspaces', ws.id), {
          memberUids: arrayUnion(user.uid),
          updatedAt: serverTimestamp(),
        });
        ws.memberUids = [...ws.memberUids, user.uid];
      }
      await setUserActiveWorkspace(user.uid, ws.id);
      return ws;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'workspaces');
  }

  return null;
}

export async function createSharedWorkspace(
  user: User,
  name: string
): Promise<SharedWorkspace> {
  const userEmail = normalizeEmail(user.email);
  const workspaceId = sanitizeId(`ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const inviteCode = generateInviteCode();
  const cleanName = clampStr(name.trim(), 120, 'Kho nghiên cứu chung') || 'Kho nghiên cứu chung';

  const wsPath = `workspaces/${workspaceId}`;
  const invitePath = `workspaceInvites/${inviteCode}`;

  try {
    await setDoc(doc(firestoreDb, 'workspaces', workspaceId), {
      id: workspaceId,
      name: cleanName,
      ownerId: user.uid,
      inviteCode,
      memberUids: [user.uid],
      memberEmails: [userEmail],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, wsPath);
  }

  try {
    await setDoc(doc(firestoreDb, 'workspaceInvites', inviteCode), {
      inviteCode,
      workspaceId,
      workspaceName: cleanName,
      ownerId: user.uid,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, invitePath);
  }

  await setUserActiveWorkspace(user.uid, workspaceId);

  // Mark all current local cases unsynced so they upload into this newly created shared workspace
  const allLocal = await db.cases.toArray();
  for (const c of allLocal) {
    await db.cases.update(c.id, { syncedToCloud: false });
  }

  return {
    id: workspaceId,
    name: cleanName,
    ownerId: user.uid,
    inviteCode,
    memberUids: [user.uid],
    memberEmails: [userEmail],
  };
}

export async function joinWorkspaceByInviteCode(
  user: User,
  rawCode: string
): Promise<SharedWorkspace> {
  const inviteCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (inviteCode.length < 4) {
    throw new Error('Mã nhóm không hợp lệ (ví dụ: RHINO-ABC123).');
  }

  const invitePath = `workspaceInvites/${inviteCode}`;
  let workspaceId = '';

  try {
    const inviteSnap = await getDoc(doc(firestoreDb, 'workspaceInvites', inviteCode));
    if (!inviteSnap.exists() || inviteSnap.data().active !== true) {
      throw new Error('Không tìm thấy mã nhóm này hoặc mã đã bị vô hiệu hóa.');
    }
    workspaceId = inviteSnap.data().workspaceId;
  } catch (error: any) {
    if (error?.message?.includes('Không tìm thấy mã nhóm')) throw error;
    handleFirestoreError(error, OperationType.GET, invitePath);
  }

  const userEmail = normalizeEmail(user.email);
  const wsPath = `workspaces/${workspaceId}`;

  try {
    // Append self directly via arrayUnion without needing prior get()
    await updateDoc(doc(firestoreDb, 'workspaces', workspaceId), {
      memberUids: arrayUnion(user.uid),
      memberEmails: arrayUnion(userEmail),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, wsPath);
  }

  await setUserActiveWorkspace(user.uid, workspaceId);

  try {
    const wsSnap = await getDoc(doc(firestoreDb, 'workspaces', workspaceId));
    if (!wsSnap.exists()) {
      throw new Error('Không thể đọc thông tin kho chung sau khi tham gia.');
    }
    return docToWorkspace(wsSnap.data(), wsSnap.id);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, wsPath);
  }
}

export async function propagateWorkspaceMembersToCases(
  workspace: SharedWorkspace
): Promise<void> {
  if (!navigator.onLine) return;
  const casesPath = `workspaces/${workspace.id}/cases`;
  const casesCol = collection(firestoreDb, 'workspaces', workspace.id, 'cases');

  try {
    const snap = await getDocs(query(casesCol, where('memberUids', 'array-contains', workspace.ownerId)));
    for (const d of snap.docs) {
      const data = d.data();
      const existingEmails: string[] = Array.isArray(data.memberEmails) ? data.memberEmails : [];
      const existingUids: string[] = Array.isArray(data.memberUids) ? data.memberUids : [];
      const needsUpdate =
        existingEmails.length !== workspace.memberEmails.length ||
        existingUids.length !== workspace.memberUids.length ||
        workspace.memberEmails.some((e) => !existingEmails.includes(e)) ||
        workspace.memberUids.some((u) => !existingUids.includes(u));

      if (needsUpdate) {
        await updateDoc(d.ref, {
          memberUids: workspace.memberUids.slice(0, 20),
          memberEmails: workspace.memberEmails.slice(0, 20),
          updatedAt: serverTimestamp(),
        });

        // Propagate to images under this case as well
        const imgsCol = collection(firestoreDb, 'workspaces', workspace.id, 'cases', d.id, 'images');
        const imgSnap = await getDocs(query(imgsCol, where('memberUids', 'array-contains', workspace.ownerId)));
        for (const imgDoc of imgSnap.docs) {
          await updateDoc(imgDoc.ref, {
            memberUids: workspace.memberUids.slice(0, 20),
            memberEmails: workspace.memberEmails.slice(0, 20),
            updatedAt: serverTimestamp(),
          });
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, casesPath);
  }
}

export async function addMemberEmailToWorkspace(
  workspace: SharedWorkspace,
  rawEmail: string
): Promise<SharedWorkspace> {
  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes('@')) {
    throw new Error('Vui lòng nhập địa chỉ Gmail hợp lệ.');
  }
  if (workspace.memberEmails.includes(email)) {
    return workspace;
  }
  if (workspace.memberEmails.length >= 20) {
    throw new Error('Kho chung đạt giới hạn tối đa 20 tài khoản.');
  }

  const nextEmails = [...workspace.memberEmails, email];
  const wsPath = `workspaces/${workspace.id}`;

  try {
    await updateDoc(doc(firestoreDb, 'workspaces', workspace.id), {
      memberEmails: nextEmails,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, wsPath);
  }

  const updated: SharedWorkspace = { ...workspace, memberEmails: nextEmails };
  await propagateWorkspaceMembersToCases(updated);
  return updated;
}

export async function removeMemberEmailFromWorkspace(
  workspace: SharedWorkspace,
  rawEmail: string
): Promise<SharedWorkspace> {
  const email = normalizeEmail(rawEmail);
  const nextEmails = workspace.memberEmails.filter((e) => e !== email);
  if (nextEmails.length === 0) {
    throw new Error('Không thể xóa chủ sở hữu khỏi kho chung.');
  }

  const wsPath = `workspaces/${workspace.id}`;
  try {
    await updateDoc(doc(firestoreDb, 'workspaces', workspace.id), {
      memberEmails: arrayRemove(email),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, wsPath);
  }

  const updated: SharedWorkspace = { ...workspace, memberEmails: nextEmails };
  await propagateWorkspaceMembersToCases(updated);
  return updated;
}

export function subscribeToWorkspace(
  workspaceId: string,
  currentUserId: string,
  onUpdated: (ws: SharedWorkspace) => void
): Unsubscribe {
  const wsPath = `workspaces/${workspaceId}`;
  return onSnapshot(
    doc(firestoreDb, 'workspaces', workspaceId),
    async (snap) => {
      if (!snap.exists()) return;
      const ws = docToWorkspace(snap.data(), snap.id);
      onUpdated(ws);
      if (ws.ownerId === currentUserId) {
        await propagateWorkspaceMembersToCases(ws);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, wsPath);
    }
  );
}

async function syncCaseImagesToCloud(
  user: User,
  caseId: string,
  ctScanImages: ClinicalImage[],
  endoscopyImages: ClinicalImage[],
  workspace: SharedWorkspace | null
): Promise<void> {
  const userEmail = normalizeEmail(user.email);
  const imagesColPath = workspace
    ? `workspaces/${workspace.id}/cases/${caseId}/images`
    : `users/${user.uid}/cases/${caseId}/images`;

  const imagesColRef = workspace
    ? collection(firestoreDb, 'workspaces', workspace.id, 'cases', caseId, 'images')
    : collection(firestoreDb, 'users', user.uid, 'cases', caseId, 'images');

  const existingRemoteIds = new Set<string>();
  try {
    const q = workspace
      ? query(imagesColRef, where('memberEmails', 'array-contains', userEmail))
      : query(imagesColRef, where('ownerId', '==', user.uid));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data();
      if (!data.deleted) {
        existingRemoteIds.add(d.id);
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, imagesColPath);
  }

  const allLocalImages = [...(ctScanImages || []), ...(endoscopyImages || [])];
  const activeLocalIds = new Set<string>();

  for (const img of allLocalImages) {
    const safeImgId = sanitizeId(img.id);
    activeLocalIds.add(safeImgId);
    const imgPath = `${imagesColPath}/${safeImgId}`;
    const imgRef = workspace
      ? doc(firestoreDb, 'workspaces', workspace.id, 'cases', caseId, 'images', safeImgId)
      : doc(firestoreDb, 'users', user.uid, 'cases', caseId, 'images', safeImgId);

    const compactDataUrl = await compressImageToDataUrl(img.dataUrl);
    const safeDataUrl = compactDataUrl.slice(0, 745000);

    try {
      const imgSnap = await getDoc(imgRef);
      const baseFields = {
        type: img.type === 'ENDOSCOPY' ? 'ENDOSCOPY' : 'CT_SCAN',
        timing: img.timing === 'POST_OP' ? 'POST_OP' : 'PRE_OP',
        title: clampStr(img.title, 200, ''),
        notes: clampStr(img.notes, 1000, ''),
        dataUrl: safeDataUrl,
        uploadedAt: typeof img.uploadedAt === 'number' ? img.uploadedAt : Date.now(),
        deleted: false,
      };

      if (!imgSnap.exists()) {
        await setDoc(imgRef, {
          id: safeImgId,
          ...(workspace
            ? {
                workspaceId: workspace.id,
                memberUids: workspace.memberUids.slice(0, 20),
                memberEmails: workspace.memberEmails.slice(0, 20),
              }
            : {}),
          ownerId: user.uid,
          caseId,
          ...baseFields,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const existingData = imgSnap.data();
        if (
          existingData.deleted ||
          existingData.notes !== baseFields.notes ||
          existingData.title !== baseFields.title ||
          existingData.timing !== baseFields.timing ||
          existingData.dataUrl !== baseFields.dataUrl
        ) {
          await updateDoc(imgRef, {
            ...(workspace
              ? {
                  memberUids: workspace.memberUids.slice(0, 20),
                  memberEmails: workspace.memberEmails.slice(0, 20),
                }
              : {}),
            ...baseFields,
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, imgPath);
    }
  }

  for (const remoteImgId of existingRemoteIds) {
    if (!activeLocalIds.has(remoteImgId)) {
      const imgPath = `${imagesColPath}/${remoteImgId}`;
      const imgRef = workspace
        ? doc(firestoreDb, 'workspaces', workspace.id, 'cases', caseId, 'images', remoteImgId)
        : doc(firestoreDb, 'users', user.uid, 'cases', caseId, 'images', remoteImgId);
      try {
        await updateDoc(imgRef, {
          deleted: true,
          dataUrl: '',
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, imgPath);
      }
    }
  }
}

export async function pushCaseToCloud(
  user: User,
  patientCase: PatientCase,
  workspace: SharedWorkspace | null = null
): Promise<boolean> {
  if (!navigator.onLine) return false;

  const userEmail = normalizeEmail(user.email);
  const safeCaseId = sanitizeId(patientCase.id);
  const casePath = workspace
    ? `workspaces/${workspace.id}/cases/${safeCaseId}`
    : `users/${user.uid}/cases/${safeCaseId}`;
  const caseRef = workspace
    ? doc(firestoreDb, 'workspaces', workspace.id, 'cases', safeCaseId)
    : doc(firestoreDb, 'users', user.uid, 'cases', safeCaseId);

  const clientCreatedAt =
    typeof patientCase.createdAt === 'number' ? patientCase.createdAt : Date.now();
  const clientUpdatedAt =
    typeof patientCase.updatedAt === 'number' ? patientCase.updatedAt : Date.now();

  const mutableFields = {
    caseCode: clampStr(patientCase.caseCode, 64, 'UNKNOWN') || 'UNKNOWN',
    surgeryDate: sanitizeDate(patientCase.surgeryDate),
    primaryDiagnosis: clampStr(patientCase.primaryDiagnosis, 500, ''),
    surgeryType: clampStr(patientCase.surgeryType, 300, ''),
    complexityGrade: clampStr(patientCase.complexityGrade, 120, 'Grade I — Cơ bản'),
    totalLundMackayScore: clampNum(patientCase.totalLundMackayScore, 0, 24, 0),
    clientUpdatedAt,
    deleted: false,
    casePayload: buildCasePayload(patientCase),
    updatedAt: serverTimestamp(),
    ...(workspace
      ? {
          lastEditedByEmail: userEmail,
          memberUids: workspace.memberUids.slice(0, 20),
          memberEmails: workspace.memberEmails.slice(0, 20),
        }
      : {}),
  };

  try {
    const existingSnap = await getDoc(caseRef);
    if (!existingSnap.exists()) {
      await setDoc(caseRef, {
        id: safeCaseId,
        ownerId: user.uid,
        ...(workspace ? { workspaceId: workspace.id } : {}),
        clientCreatedAt,
        ...mutableFields,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(caseRef, mutableFields);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, casePath);
  }

  await syncCaseImagesToCloud(
    user,
    safeCaseId,
    patientCase.images?.ctScanImages || [],
    patientCase.images?.endoscopyImages || [],
    workspace
  );

  await db.cases.update(patientCase.id, { syncedToCloud: true });
  await db.deletedCases.delete(patientCase.id);
  return true;
}

export async function softDeleteCaseOnCloud(
  user: User,
  caseId: string,
  workspace: SharedWorkspace | null = null
): Promise<void> {
  if (!navigator.onLine) return;

  const userEmail = normalizeEmail(user.email);
  const safeCaseId = sanitizeId(caseId);
  const casePath = workspace
    ? `workspaces/${workspace.id}/cases/${safeCaseId}`
    : `users/${user.uid}/cases/${safeCaseId}`;
  const caseRef = workspace
    ? doc(firestoreDb, 'workspaces', workspace.id, 'cases', safeCaseId)
    : doc(firestoreDb, 'users', user.uid, 'cases', safeCaseId);

  try {
    const snap = await getDoc(caseRef);
    if (snap.exists()) {
      await updateDoc(caseRef, {
        deleted: true,
        clientUpdatedAt: Date.now(),
        updatedAt: serverTimestamp(),
        ...(workspace ? { lastEditedByEmail: userEmail } : {}),
      });
    }
    await db.deletedCases.delete(caseId);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, casePath);
  }
}

export async function syncAllPendingToCloud(
  user: User,
  workspace: SharedWorkspace | null = null
): Promise<number> {
  if (!navigator.onLine) return 0;

  let syncedCount = 0;

  const pendingDeletes = await db.deletedCases.toArray();
  for (const del of pendingDeletes) {
    await softDeleteCaseOnCloud(user, del.id, workspace);
    syncedCount++;
  }

  const allLocal = await db.cases.toArray();
  for (const c of allLocal) {
    if (!c.syncedToCloud) {
      await pushCaseToCloud(user, c, workspace);
      syncedCount++;
    }
  }

  return syncedCount;
}

async function fetchRemoteCaseImages(
  user: User,
  caseId: string,
  workspace: SharedWorkspace | null
): Promise<{ ctScanImages: ClinicalImage[]; endoscopyImages: ClinicalImage[] }> {
  const userEmail = normalizeEmail(user.email);
  const imagesPath = workspace
    ? `workspaces/${workspace.id}/cases/${caseId}/images`
    : `users/${user.uid}/cases/${caseId}/images`;
  const imagesRef = workspace
    ? collection(firestoreDb, 'workspaces', workspace.id, 'cases', caseId, 'images')
    : collection(firestoreDb, 'users', user.uid, 'cases', caseId, 'images');

  const ctScanImages: ClinicalImage[] = [];
  const endoscopyImages: ClinicalImage[] = [];

  try {
    const q = workspace
      ? query(imagesRef, where('memberEmails', 'array-contains', userEmail))
      : query(imagesRef, where('ownerId', '==', user.uid));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.deleted) return;
      const img: ClinicalImage = {
        id: data.id || docSnap.id,
        dataUrl: data.dataUrl || '',
        title: data.title || '',
        uploadedAt: typeof data.uploadedAt === 'number' ? data.uploadedAt : Date.now(),
        type: data.type === 'ENDOSCOPY' ? 'ENDOSCOPY' : 'CT_SCAN',
        timing: data.timing === 'POST_OP' ? 'POST_OP' : 'PRE_OP',
        notes: data.notes || '',
      };
      if (img.type === 'ENDOSCOPY') {
        endoscopyImages.push(img);
      } else {
        ctScanImages.push(img);
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, imagesPath);
  }

  ctScanImages.sort((a, b) => a.uploadedAt - b.uploadedAt);
  endoscopyImages.sort((a, b) => a.uploadedAt - b.uploadedAt);
  return { ctScanImages, endoscopyImages };
}

function reconstructPatientCase(
  remoteData: Record<string, any>,
  images: { ctScanImages: ClinicalImage[]; endoscopyImages: ClinicalImage[] }
): PatientCase {
  const payload = remoteData.casePayload || {};
  return {
    id: remoteData.id,
    caseCode: remoteData.caseCode,
    surgeryDate: remoteData.surgeryDate,
    createdAt: remoteData.clientCreatedAt || Date.now(),
    updatedAt: remoteData.clientUpdatedAt || Date.now(),
    syncedToCloud: true,

    age: payload.age ?? null,
    gender: payload.gender || 'Nam',
    address: payload.address || 'TP HCM',
    provinceDetails: payload.provinceDetails ?? undefined,
    ethnicity: payload.ethnicity || 'Kinh',
    occupation: payload.occupation || 'Khác',

    complexityGrade: remoteData.complexityGrade,
    primaryDiagnosis: remoteData.primaryDiagnosis || '',
    surgeryType: remoteData.surgeryType || '',

    comorbidities: payload.comorbidities,
    admissionReasons: payload.admissionReasons || [],
    symptomDurationDays: payload.symptomDurationDays ?? null,
    treatmentBeforeAdmission: payload.treatmentBeforeAdmission || 'Không điều trị',
    priorTreatmentDetails: payload.priorTreatmentDetails ?? undefined,

    nasalSymptoms: payload.nasalSymptoms,
    eyeSymptoms: payload.eyeSymptoms,
    neurologicalSymptoms: payload.neurologicalSymptoms,
    vitalSigns: payload.vitalSigns,
    labResults: payload.labResults,
    diseaseExtent: payload.diseaseExtent,
    lundMackay: payload.lundMackay,
    totalLundMackayScore: remoteData.totalLundMackayScore ?? 0,
    nasalPolypScoreR: payload.nasalPolypScoreR ?? 0,
    nasalPolypScoreL: payload.nasalPolypScoreL ?? 0,
    snot22Score: payload.snot22Score ?? undefined,
    treatmentFeatures: payload.treatmentFeatures,
    images,
    auditStatus: payload.auditStatus ?? undefined,
  };
}

export function subscribeToCloudCases(
  user: User,
  workspace: SharedWorkspace | null,
  onSyncUpdate: () => void,
  onSyncStateChange?: (syncing: boolean) => void
): Unsubscribe {
  const userEmail = normalizeEmail(user.email);
  const casesPath = workspace
    ? `workspaces/${workspace.id}/cases`
    : `users/${user.uid}/cases`;
  const casesColRef = workspace
    ? collection(firestoreDb, 'workspaces', workspace.id, 'cases')
    : collection(firestoreDb, 'users', user.uid, 'cases');

  const q = workspace
    ? query(casesColRef, where('memberEmails', 'array-contains', userEmail))
    : query(casesColRef, where('ownerId', '==', user.uid));

  return onSnapshot(
    q,
    async (snapshot) => {
      onSyncStateChange?.(true);
      try {
        let changed = false;

        for (const docSnap of snapshot.docs) {
          const remote = docSnap.data();
          const caseId = remote.id || docSnap.id;
          const remoteUpdatedAt =
            typeof remote.clientUpdatedAt === 'number' ? remote.clientUpdatedAt : 0;

          const local = await db.cases.get(caseId);
          const localDeleted = await db.deletedCases.get(caseId);

          if (remote.deleted === true) {
            if (local && remoteUpdatedAt >= local.updatedAt) {
              await db.cases.delete(caseId);
              changed = true;
            }
            if (localDeleted && remoteUpdatedAt >= localDeleted.deletedAt) {
              await db.deletedCases.delete(caseId);
            }
            continue;
          }

          if (localDeleted && localDeleted.deletedAt > remoteUpdatedAt) {
            await softDeleteCaseOnCloud(user, caseId, workspace);
            continue;
          }

          if (!local || remoteUpdatedAt > local.updatedAt) {
            const images = await fetchRemoteCaseImages(user, caseId, workspace);
            const reconstructed = reconstructPatientCase(remote, images);
            await db.cases.put(reconstructed);
            changed = true;
          } else if (local.updatedAt > remoteUpdatedAt && !local.syncedToCloud) {
            await pushCaseToCloud(user, local, workspace);
            changed = true;
          } else if (!local.syncedToCloud && local.updatedAt === remoteUpdatedAt) {
            await db.cases.update(caseId, { syncedToCloud: true });
            changed = true;
          }
        }

        if (changed) {
          onSyncUpdate();
        }
      } finally {
        onSyncStateChange?.(false);
      }
    },
    (error) => {
      onSyncStateChange?.(false);
      handleFirestoreError(error, OperationType.LIST, casesPath);
    }
  );
}
