import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, firestoreDb, getGuestCreatorAuth, handleFirestoreError, OperationType } from '../firebase';
import { db } from '../db/indexedDB';
import { AppAccount, ClinicalImage, PatientCase } from '../types/medical';
import { compressImageToDataUrl } from '../utils/imageCompression';

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

export function normalizeAccountIdentifier(rawInput: string): {
  username: string;
  email: string;
} {
  const cleaned = (rawInput || '').trim().toLowerCase();
  if (!cleaned) {
    throw new Error('Vui lòng nhập tên đăng nhập hoặc email.');
  }
  if (cleaned.includes('@')) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned) || cleaned.length > 320) {
      throw new Error('Địa chỉ email không hợp lệ.');
    }
    return {
      username: cleaned.slice(0, 160),
      email: cleaned,
    };
  }
  if (!/^[a-z0-9._-]{3,40}$/.test(cleaned)) {
    throw new Error(
      'Tên đăng nhập chỉ dùng chữ không dấu (a-z), số (0-9), dấu chấm (.), gạch dưới (_) hoặc gạch ngang (-), dài 3-40 ký tự.'
    );
  }
  return {
    username: cleaned,
    email: `${cleaned}@rhinolog.local`,
  };
}

export function mapAuthErrorMessage(err: any): string {
  const code = err?.code || '';
  if (code === 'auth/operation-not-allowed') {
    return 'Chức năng đăng nhập bằng Tài khoản/Mật khẩu (Email/Password) chưa được bật trên Firebase Console. Vui lòng vào Firebase Console -> Authentication -> Sign-in method -> bật Email/Password.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Tên đăng nhập/email hoặc mật khẩu không đúng.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Tên đăng nhập hoặc email này đã tồn tại trong hệ thống.';
  }
  if (code === 'auth/weak-password') {
    return 'Mật khẩu quá yếu. Vui lòng nhập tối thiểu 6 ký tự.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Thao tác quá nhiều lần liên tiếp. Vui lòng đợi vài phút rồi thử lại.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Không thể kết nối máy chủ xác thực. Vui lòng kiểm tra kết nối Internet.';
  }
  return err?.message || 'Lỗi xác thực tài khoản. Vui lòng thử lại.';
}

export async function checkAdminInitialized(): Promise<{
  initialized: boolean;
  adminUid: string | null;
}> {
  const ref = doc(firestoreDb, 'appMeta', 'bootstrap');
  try {
    const snap = navigator.onLine ? await getDocFromServer(ref) : await getDoc(ref);
    if (snap.exists() && snap.data().initialized === true) {
      return {
        initialized: true,
        adminUid: typeof snap.data().adminUid === 'string' ? snap.data().adminUid : null,
      };
    }
    return { initialized: false, adminUid: null };
  } catch {
    try {
      const cached = await getDoc(ref);
      if (cached.exists() && cached.data().initialized === true) {
        return {
          initialized: true,
          adminUid: typeof cached.data().adminUid === 'string' ? cached.data().adminUid : null,
        };
      }
    } catch {
      // ignore offline cache miss
    }
    return { initialized: false, adminUid: null };
  }
}

export async function fetchAppAccount(uid: string): Promise<AppAccount | null> {
  const accPath = `accounts/${uid}`;
  try {
    const snap = await getDoc(doc(firestoreDb, 'accounts', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      uid: d.uid || uid,
      username: d.username || d.email || uid,
      email: d.email || '',
      displayName: d.displayName || d.username || 'Bác sĩ',
      role: d.role === 'admin' ? 'admin' : 'guest',
      adminUid: d.adminUid || uid,
      active: d.active === true,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, accPath);
  }
}

export async function bootstrapAdminAccount(
  identifier: string,
  password: string,
  displayName: string
): Promise<AppAccount> {
  const { username, email } = normalizeAccountIdentifier(identifier);
  if (!password || password.length < 6) {
    throw new Error('Mật khẩu Admin phải có ít nhất 6 ký tự.');
  }
  const cleanName = clampStr(displayName.trim(), 160, username) || username;

  const currentStatus = await checkAdminInitialized();
  if (currentStatus.initialized) {
    throw new Error('Tài khoản Admin đã được khởi tạo trước đó. Vui lòng chuyển sang Đăng nhập.');
  }

  let fbUser: User;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    fbUser = cred.user;
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      try {
        const signInCred = await signInWithEmailAndPassword(auth, email, password);
        fbUser = signInCred.user;
      } catch (signInErr: any) {
        throw new Error(mapAuthErrorMessage(signInErr));
      }
    } else {
      throw new Error(mapAuthErrorMessage(err));
    }
  }

  try {
    await updateProfile(fbUser, { displayName: cleanName });
  } catch {
    // Non-fatal
  }

  try {
    const batch = writeBatch(firestoreDb);
    batch.set(doc(firestoreDb, 'appMeta', 'bootstrap'), {
      id: 'bootstrap',
      initialized: true,
      adminUid: fbUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(firestoreDb, 'admins', fbUser.uid), {
      uid: fbUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(firestoreDb, 'accounts', fbUser.uid), {
      uid: fbUser.uid,
      username,
      email,
      displayName: cleanName,
      role: 'admin',
      adminUid: fbUser.uid,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    await signOut(auth);
    handleFirestoreError(error, OperationType.WRITE, `accounts/${fbUser.uid}`);
  }

  // Mark any local unsynced cases for upload
  const allLocal = await db.cases.toArray();
  for (const c of allLocal) {
    if (!c.syncedToCloud) {
      await db.cases.update(c.id, { syncedToCloud: false });
    }
  }

  return {
    uid: fbUser.uid,
    username,
    email,
    displayName: cleanName,
    role: 'admin',
    adminUid: fbUser.uid,
    active: true,
  };
}

export async function signInWithSelfAccount(
  identifier: string,
  password: string
): Promise<AppAccount> {
  const { email } = normalizeAccountIdentifier(identifier);
  if (!password) {
    throw new Error('Vui lòng nhập mật khẩu.');
  }

  let fbUser: User;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    fbUser = cred.user;
  } catch (err: any) {
    throw new Error(mapAuthErrorMessage(err));
  }

  const acc = await fetchAppAccount(fbUser.uid);
  if (!acc) {
    await signOut(auth);
    throw new Error('Tài khoản này chưa được Admin cấp quyền trong hệ thống.');
  }
  if (!acc.active) {
    await signOut(auth);
    throw new Error('Tài khoản khách này đã bị Admin tạm khóa quyền truy cập.');
  }
  return acc;
}

export async function fetchManagedAccounts(adminUid: string): Promise<AppAccount[]> {
  if (!navigator.onLine) return [];
  const accPath = 'accounts';
  try {
    const snap = await getDocs(
      query(collection(firestoreDb, 'accounts'), where('adminUid', '==', adminUid))
    );
    const list: AppAccount[] = [];
    snap.forEach((d) => {
      const data = d.data();
      list.push({
        uid: data.uid || d.id,
        username: data.username || data.email || d.id,
        email: data.email || '',
        displayName: data.displayName || data.username || 'Khách',
        role: data.role === 'admin' ? 'admin' : 'guest',
        adminUid: data.adminUid || adminUid,
        active: data.active === true,
      });
    });
    list.sort((a, b) => (a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : a.username.localeCompare(b.username)));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, accPath);
  }
}

export async function getActiveAuthorizedUids(adminAccount: AppAccount): Promise<string[]> {
  if (adminAccount.role !== 'admin') {
    return [adminAccount.adminUid, adminAccount.uid];
  }
  try {
    const accounts = await fetchManagedAccounts(adminAccount.uid);
    const uids = new Set<string>([adminAccount.uid]);
    for (const acc of accounts) {
      if (acc.active && uids.size < 50) {
        uids.add(acc.uid);
      }
    }
    return Array.from(uids);
  } catch {
    return [adminAccount.uid];
  }
}

export async function syncAuthorizedUidsToAllCases(
  adminAccount: AppAccount,
  overrideUids?: string[]
): Promise<void> {
  if (!navigator.onLine || adminAccount.role !== 'admin') return;
  const targetUids = (overrideUids || (await getActiveAuthorizedUids(adminAccount))).slice(0, 50);
  if (!targetUids.includes(adminAccount.uid)) {
    targetUids.unshift(adminAccount.uid);
  }

  const casesCol = collection(firestoreDb, 'clinicCases');
  try {
    const snap = await getDocs(query(casesCol, where('adminUid', '==', adminAccount.uid)));
    for (const d of snap.docs) {
      const data = d.data();
      const existingUids: string[] = Array.isArray(data.authorizedUids) ? data.authorizedUids : [];
      const needsUpdate =
        existingUids.length !== targetUids.length ||
        targetUids.some((u) => !existingUids.includes(u)) ||
        existingUids.some((u) => !targetUids.includes(u));

      if (needsUpdate) {
        await updateDoc(d.ref, {
          authorizedUids: targetUids,
          updatedAt: serverTimestamp(),
        });

        const imgsCol = collection(firestoreDb, 'clinicCases', d.id, 'images');
        const imgSnap = await getDocs(query(imgsCol, where('adminUid', '==', adminAccount.uid)));
        for (const imgDoc of imgSnap.docs) {
          await updateDoc(imgDoc.ref, {
            authorizedUids: targetUids,
            updatedAt: serverTimestamp(),
          });
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'clinicCases');
  }
}

export async function createGuestAccount(
  adminAccount: AppAccount,
  identifier: string,
  password: string,
  displayName: string
): Promise<AppAccount> {
  if (adminAccount.role !== 'admin') {
    throw new Error('Chỉ tài khoản Admin mới có quyền tạo tài khoản khách.');
  }
  const { username, email } = normalizeAccountIdentifier(identifier);
  if (!password || password.length < 6) {
    throw new Error('Mật khẩu tài khoản khách phải có ít nhất 6 ký tự.');
  }
  const cleanName = clampStr(displayName.trim(), 160, username) || username;

  const existingAccounts = await fetchManagedAccounts(adminAccount.uid);
  if (existingAccounts.length >= 50) {
    throw new Error('Hệ thống đã đạt giới hạn tối đa 50 tài khoản.');
  }
  if (existingAccounts.some((a) => a.email === email || a.username === username)) {
    throw new Error('Tên đăng nhập hoặc email này đã tồn tại.');
  }

  const guestAuth = getGuestCreatorAuth();
  let guestUid = '';
  try {
    const cred = await createUserWithEmailAndPassword(guestAuth, email, password);
    guestUid = cred.user.uid;
    try {
      await updateProfile(cred.user, { displayName: cleanName });
    } catch {
      // Non-fatal
    }
  } catch (err: any) {
    throw new Error(mapAuthErrorMessage(err));
  } finally {
    try {
      await signOut(guestAuth);
    } catch {
      // Non-fatal
    }
  }

  const guestPath = `accounts/${guestUid}`;
  try {
    await setDoc(doc(firestoreDb, 'accounts', guestUid), {
      uid: guestUid,
      username,
      email,
      displayName: cleanName,
      role: 'guest',
      adminUid: adminAccount.uid,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, guestPath);
  }

  await syncAuthorizedUidsToAllCases(adminAccount);

  return {
    uid: guestUid,
    username,
    email,
    displayName: cleanName,
    role: 'guest',
    adminUid: adminAccount.uid,
    active: true,
  };
}

export async function setGuestAccountActive(
  adminAccount: AppAccount,
  guestUid: string,
  active: boolean
): Promise<void> {
  if (adminAccount.role !== 'admin' || guestUid === adminAccount.uid) return;
  const path = `accounts/${guestUid}`;
  try {
    await updateDoc(doc(firestoreDb, 'accounts', guestUid), {
      active,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
  await syncAuthorizedUidsToAllCases(adminAccount);
}

export async function removeGuestAccount(
  adminAccount: AppAccount,
  guestUid: string
): Promise<void> {
  if (adminAccount.role !== 'admin' || guestUid === adminAccount.uid) return;
  const currentUids = await getActiveAuthorizedUids(adminAccount);
  const filteredUids = currentUids.filter((u) => u !== guestUid);
  await syncAuthorizedUidsToAllCases(adminAccount, filteredUids);

  const path = `accounts/${guestUid}`;
  try {
    await deleteDoc(doc(firestoreDb, 'accounts', guestUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
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

async function syncCaseImagesToCloud(
  account: AppAccount,
  caseId: string,
  ctScanImages: ClinicalImage[],
  endoscopyImages: ClinicalImage[],
  clinicalImages: ClinicalImage[],
  authorizedUids: string[]
): Promise<void> {
  const imagesColPath = `clinicCases/${caseId}/images`;
  const imagesColRef = collection(firestoreDb, 'clinicCases', caseId, 'images');

  const existingRemoteIds = new Set<string>();
  try {
    const q =
      account.role === 'admin'
        ? query(imagesColRef, where('adminUid', '==', account.uid))
        : query(imagesColRef, where('authorizedUids', 'array-contains', account.uid));
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

  const allLocalImages = [
    ...(ctScanImages || []),
    ...(endoscopyImages || []),
    ...(clinicalImages || []),
  ];
  const activeLocalIds = new Set<string>();

  for (const img of allLocalImages) {
    const safeImgId = sanitizeId(img.id);
    activeLocalIds.add(safeImgId);
    const imgPath = `${imagesColPath}/${safeImgId}`;
    const imgRef = doc(firestoreDb, 'clinicCases', caseId, 'images', safeImgId);

    const compactDataUrl = await compressImageToDataUrl(img.dataUrl);
    const safeDataUrl = compactDataUrl.slice(0, 745000);

    try {
      const imgSnap = await getDoc(imgRef);
      const safeType =
        img.type === 'ENDOSCOPY' || img.type === 'CLINICAL_PHOTO' ? img.type : 'CT_SCAN';
      const safeTiming =
        img.timing === 'DISCHARGE' || img.timing === 'POST_OP' ? img.timing : 'PRE_OP';

      const baseFields = {
        type: safeType,
        timing: safeTiming,
        title: clampStr(img.title, 200, ''),
        notes: clampStr(img.notes, 1000, ''),
        dataUrl: safeDataUrl,
        uploadedAt: typeof img.uploadedAt === 'number' ? img.uploadedAt : Date.now(),
        deleted: false,
      };

      if (!imgSnap.exists()) {
        await setDoc(imgRef, {
          id: safeImgId,
          adminUid: account.adminUid,
          ownerId: account.uid,
          caseId,
          authorizedUids: authorizedUids.slice(0, 50),
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
            ...(account.role === 'admin'
              ? { authorizedUids: authorizedUids.slice(0, 50) }
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
      const imgRef = doc(firestoreDb, 'clinicCases', caseId, 'images', remoteImgId);
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
  account: AppAccount,
  patientCase: PatientCase,
  cachedAuthorizedUids?: string[]
): Promise<boolean> {
  if (!navigator.onLine) return false;

  const safeCaseId = sanitizeId(patientCase.id);
  const casePath = `clinicCases/${safeCaseId}`;
  const caseRef = doc(firestoreDb, 'clinicCases', safeCaseId);
  const authorizedUids = cachedAuthorizedUids || (await getActiveAuthorizedUids(account));
  const editorLabel = clampStr(
    patientCase.lastEditedBy || `${account.displayName} (${account.username})`,
    160,
    account.username
  );

  const clientCreatedAt =
    typeof patientCase.createdAt === 'number' ? patientCase.createdAt : Date.now();
  const clientUpdatedAt =
    typeof patientCase.updatedAt === 'number' ? patientCase.updatedAt : Date.now();

  const isTrashed = patientCase.isTrashed === true;
  const trashedAt = isTrashed ? patientCase.trashedAt || Date.now() : null;
  const trashedBy = isTrashed
    ? clampStr(patientCase.trashedBy || editorLabel, 160, editorLabel)
    : null;

  try {
    const existingSnap = await getDoc(caseRef);
    if (!existingSnap.exists()) {
      await setDoc(caseRef, {
        id: safeCaseId,
        adminUid: account.adminUid,
        ownerId: account.uid,
        lastEditedBy: editorLabel,
        authorizedUids: authorizedUids.slice(0, 50),
        isTrashed: false,
        trashedAt: null,
        trashedBy: null,
        deleted: false,
        caseCode: clampStr(patientCase.caseCode, 64, 'UNKNOWN') || 'UNKNOWN',
        surgeryDate: sanitizeDate(patientCase.surgeryDate),
        primaryDiagnosis: clampStr(patientCase.primaryDiagnosis, 500, ''),
        surgeryType: clampStr(patientCase.surgeryType, 300, ''),
        complexityGrade: clampStr(patientCase.complexityGrade, 120, 'Grade I — Cơ bản'),
        totalLundMackayScore: clampNum(patientCase.totalLundMackayScore, 0, 24, 0),
        clientCreatedAt,
        clientUpdatedAt,
        casePayload: buildCasePayload(patientCase),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (isTrashed) {
        await updateDoc(caseRef, {
          lastEditedBy: editorLabel,
          isTrashed: true,
          trashedAt,
          trashedBy,
          clientUpdatedAt,
          updatedAt: serverTimestamp(),
        });
      }
    } else if (isTrashed && account.role === 'guest') {
      await updateDoc(caseRef, {
        lastEditedBy: editorLabel,
        isTrashed: true,
        trashedAt,
        trashedBy,
        clientUpdatedAt,
        updatedAt: serverTimestamp(),
      });
    } else {
      const updateBody: Record<string, unknown> = {
        lastEditedBy: editorLabel,
        caseCode: clampStr(patientCase.caseCode, 64, 'UNKNOWN') || 'UNKNOWN',
        surgeryDate: sanitizeDate(patientCase.surgeryDate),
        primaryDiagnosis: clampStr(patientCase.primaryDiagnosis, 500, ''),
        surgeryType: clampStr(patientCase.surgeryType, 300, ''),
        complexityGrade: clampStr(patientCase.complexityGrade, 120, 'Grade I — Cơ bản'),
        totalLundMackayScore: clampNum(patientCase.totalLundMackayScore, 0, 24, 0),
        clientUpdatedAt,
        casePayload: buildCasePayload(patientCase),
        updatedAt: serverTimestamp(),
      };

      if (account.role === 'admin') {
        updateBody.authorizedUids = authorizedUids.slice(0, 50);
        updateBody.isTrashed = isTrashed;
        updateBody.trashedAt = trashedAt;
        updateBody.trashedBy = trashedBy;
        updateBody.deleted = false;
      }

      await updateDoc(caseRef, updateBody);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, casePath);
  }

  if (!isTrashed) {
    await syncCaseImagesToCloud(
      account,
      safeCaseId,
      patientCase.images?.ctScanImages || [],
      patientCase.images?.endoscopyImages || [],
      patientCase.images?.clinicalImages || [],
      authorizedUids
    );
  }

  if (isTrashed && account.role === 'guest') {
    // Guest cannot view trash; clean local trashed copy after cloud confirmation
    await db.cases.delete(patientCase.id);
  } else {
    await db.cases.update(patientCase.id, { syncedToCloud: true });
  }
  await db.deletedCases.delete(patientCase.id);
  return true;
}

export async function moveCaseToTrash(
  account: AppAccount | null,
  caseId: string
): Promise<void> {
  const existingLocal = await db.cases.get(caseId);
  const now = Date.now();
  const actorLabel = account
    ? `${account.displayName} (${account.username})`
    : 'Người dùng ngoại tuyến';

  if (existingLocal) {
    await db.cases.update(caseId, {
      isTrashed: true,
      trashedAt: now,
      trashedBy: actorLabel,
      lastEditedBy: actorLabel,
      updatedAt: now,
      syncedToCloud: false,
    });
  }

  if (!account || !navigator.onLine) return;

  const safeCaseId = sanitizeId(caseId);
  const casePath = `clinicCases/${safeCaseId}`;
  const caseRef = doc(firestoreDb, 'clinicCases', safeCaseId);

  try {
    const snap = await getDoc(caseRef);
    if (snap.exists()) {
      await updateDoc(caseRef, {
        lastEditedBy: clampStr(actorLabel, 160, account.username),
        isTrashed: true,
        trashedAt: now,
        trashedBy: clampStr(actorLabel, 160, account.username),
        clientUpdatedAt: now,
        updatedAt: serverTimestamp(),
      });
    }

    if (account.role === 'guest') {
      await db.cases.delete(caseId);
    } else if (existingLocal) {
      await db.cases.update(caseId, { syncedToCloud: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, casePath);
  }
}

export async function restoreCaseFromTrash(
  adminAccount: AppAccount,
  caseId: string
): Promise<void> {
  if (adminAccount.role !== 'admin') {
    throw new Error('Chỉ Admin mới có quyền hoàn tác ca bệnh từ Thùng rác.');
  }
  const now = Date.now();
  const actorLabel = `${adminAccount.displayName} (${adminAccount.username})`;
  const existingLocal = await db.cases.get(caseId);

  if (existingLocal) {
    await db.cases.update(caseId, {
      isTrashed: false,
      trashedAt: undefined,
      trashedBy: undefined,
      lastEditedBy: actorLabel,
      updatedAt: now,
      syncedToCloud: false,
    });
  }

  if (!navigator.onLine) return;

  const safeCaseId = sanitizeId(caseId);
  const casePath = `clinicCases/${safeCaseId}`;
  const caseRef = doc(firestoreDb, 'clinicCases', safeCaseId);

  try {
    const snap = await getDoc(caseRef);
    if (snap.exists()) {
      await updateDoc(caseRef, {
        lastEditedBy: clampStr(actorLabel, 160, adminAccount.username),
        isTrashed: false,
        trashedAt: null,
        trashedBy: null,
        clientUpdatedAt: now,
        updatedAt: serverTimestamp(),
      });
    }
    if (existingLocal) {
      await db.cases.update(caseId, { syncedToCloud: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, casePath);
  }
}

export async function permanentlyDeleteCase(
  adminAccount: AppAccount | null,
  caseId: string
): Promise<void> {
  if (adminAccount && adminAccount.role !== 'admin') {
    throw new Error('Chỉ Admin mới có quyền xóa vĩnh viễn ca bệnh.');
  }

  const now = Date.now();
  await db.cases.delete(caseId);
  await db.deletedCases.put({ id: caseId, deletedAt: now });

  if (!adminAccount || !navigator.onLine) return;

  const safeCaseId = sanitizeId(caseId);
  const casePath = `clinicCases/${safeCaseId}`;
  const caseRef = doc(firestoreDb, 'clinicCases', safeCaseId);
  const actorLabel = clampStr(
    `${adminAccount.displayName} (${adminAccount.username})`,
    160,
    adminAccount.username
  );

  try {
    const snap = await getDoc(caseRef);
    if (snap.exists()) {
      await updateDoc(caseRef, {
        lastEditedBy: actorLabel,
        isTrashed: true,
        trashedAt: snap.data().trashedAt || now,
        trashedBy: snap.data().trashedBy || actorLabel,
        deleted: true,
        clientUpdatedAt: now,
        updatedAt: serverTimestamp(),
      });

      const imgsCol = collection(firestoreDb, 'clinicCases', safeCaseId, 'images');
      const imgSnap = await getDocs(query(imgsCol, where('adminUid', '==', adminAccount.uid)));
      for (const imgDoc of imgSnap.docs) {
        await updateDoc(imgDoc.ref, {
          deleted: true,
          dataUrl: '',
          updatedAt: serverTimestamp(),
        });
      }
    }
    await db.deletedCases.delete(caseId);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, casePath);
  }
}

export async function syncAllPendingToCloud(account: AppAccount): Promise<number> {
  if (!navigator.onLine) return 0;

  let syncedCount = 0;
  const authorizedUids = await getActiveAuthorizedUids(account);

  if (account.role === 'admin') {
    const pendingDeletes = await db.deletedCases.toArray();
    for (const del of pendingDeletes) {
      await permanentlyDeleteCase(account, del.id);
      syncedCount++;
    }
  } else {
    // Guests cannot permanently delete; clear any stale local hard-delete tombstones
    await db.deletedCases.clear();
  }

  const allLocal = await db.cases.toArray();
  for (const c of allLocal) {
    if (!c.syncedToCloud) {
      await pushCaseToCloud(account, c, authorizedUids);
      syncedCount++;
    }
  }

  return syncedCount;
}

async function fetchRemoteCaseImages(
  account: AppAccount,
  caseId: string
): Promise<{
  ctScanImages: ClinicalImage[];
  endoscopyImages: ClinicalImage[];
  clinicalImages: ClinicalImage[];
}> {
  const imagesPath = `clinicCases/${caseId}/images`;
  const imagesRef = collection(firestoreDb, 'clinicCases', caseId, 'images');

  const ctScanImages: ClinicalImage[] = [];
  const endoscopyImages: ClinicalImage[] = [];
  const clinicalImages: ClinicalImage[] = [];

  try {
    const q =
      account.role === 'admin'
        ? query(imagesRef, where('adminUid', '==', account.uid))
        : query(imagesRef, where('authorizedUids', 'array-contains', account.uid));
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.deleted) return;
      const imgType: ClinicalImage['type'] =
        data.type === 'ENDOSCOPY' || data.type === 'CLINICAL_PHOTO' ? data.type : 'CT_SCAN';
      const imgTiming: ClinicalImage['timing'] =
        data.timing === 'DISCHARGE' || data.timing === 'POST_OP' ? data.timing : 'PRE_OP';

      const img: ClinicalImage = {
        id: data.id || docSnap.id,
        dataUrl: data.dataUrl || '',
        title: data.title || '',
        uploadedAt: typeof data.uploadedAt === 'number' ? data.uploadedAt : Date.now(),
        type: imgType,
        timing: imgTiming,
        notes: data.notes || '',
      };
      if (img.type === 'ENDOSCOPY') {
        endoscopyImages.push(img);
      } else if (img.type === 'CLINICAL_PHOTO') {
        clinicalImages.push(img);
      } else {
        ctScanImages.push(img);
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, imagesPath);
  }

  ctScanImages.sort((a, b) => a.uploadedAt - b.uploadedAt);
  endoscopyImages.sort((a, b) => a.uploadedAt - b.uploadedAt);
  clinicalImages.sort((a, b) => a.uploadedAt - b.uploadedAt);
  return { ctScanImages, endoscopyImages, clinicalImages };
}

function reconstructPatientCase(
  remoteData: Record<string, any>,
  images: {
    ctScanImages: ClinicalImage[];
    endoscopyImages: ClinicalImage[];
    clinicalImages: ClinicalImage[];
  }
): PatientCase {
  const payload = remoteData.casePayload || {};
  return {
    id: remoteData.id,
    caseCode: remoteData.caseCode,
    surgeryDate: remoteData.surgeryDate,
    createdAt: remoteData.clientCreatedAt || Date.now(),
    updatedAt: remoteData.clientUpdatedAt || Date.now(),
    syncedToCloud: true,
    isTrashed: remoteData.isTrashed === true,
    trashedAt: typeof remoteData.trashedAt === 'number' ? remoteData.trashedAt : undefined,
    trashedBy: typeof remoteData.trashedBy === 'string' ? remoteData.trashedBy : undefined,
    lastEditedBy: typeof remoteData.lastEditedBy === 'string' ? remoteData.lastEditedBy : undefined,

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
  account: AppAccount,
  onSyncUpdate: () => void,
  onSyncStateChange?: (syncing: boolean) => void
): Unsubscribe {
  const casesPath = 'clinicCases';
  const casesColRef = collection(firestoreDb, 'clinicCases');

  const q =
    account.role === 'admin'
      ? query(casesColRef, where('adminUid', '==', account.uid))
      : query(
          casesColRef,
          where('authorizedUids', 'array-contains', account.uid),
          where('isTrashed', '==', false),
          where('deleted', '==', false)
        );

  return onSnapshot(
    q,
    async (snapshot) => {
      onSyncStateChange?.(true);
      try {
        let changed = false;
        const activeUids =
          account.role === 'admin' ? await getActiveAuthorizedUids(account) : undefined;

        for (const change of snapshot.docChanges()) {
          if (change.type === 'removed') {
            const removedId = change.doc.id;
            const localRemoved = await db.cases.get(removedId);
            if (localRemoved) {
              await db.cases.delete(removedId);
              changed = true;
            }
          }
        }

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

          if (account.role === 'admin' && localDeleted && localDeleted.deletedAt > remoteUpdatedAt) {
            await permanentlyDeleteCase(account, caseId);
            continue;
          }

          if (!local || remoteUpdatedAt > local.updatedAt) {
            const images = await fetchRemoteCaseImages(account, caseId);
            const reconstructed = reconstructPatientCase(remote, images);
            await db.cases.put(reconstructed);
            changed = true;
          } else if (local.updatedAt > remoteUpdatedAt && !local.syncedToCloud) {
            await pushCaseToCloud(account, local, activeUids);
            changed = true;
          } else if (!local.syncedToCloud && local.updatedAt === remoteUpdatedAt) {
            if (local.isTrashed && account.role === 'guest') {
              await db.cases.delete(caseId);
            } else {
              await db.cases.update(caseId, { syncedToCloud: true });
            }
            changed = true;
          }
        }

        if (account.role === 'admin' && activeUids) {
          for (const docSnap of snapshot.docs) {
            const remote = docSnap.data();
            if (remote.deleted === true) continue;
            const existingUids: string[] = Array.isArray(remote.authorizedUids)
              ? remote.authorizedUids
              : [];
            const mismatch =
              existingUids.length !== activeUids.length ||
              activeUids.some((u) => !existingUids.includes(u)) ||
              existingUids.some((u) => !activeUids.includes(u));
            if (mismatch) {
              await updateDoc(docSnap.ref, {
                authorizedUids: activeUids.slice(0, 50),
                updatedAt: serverTimestamp(),
              });
            }
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

export function subscribeToManagedAccounts(
  adminUid: string,
  onUpdated: (accounts: AppAccount[]) => void
): Unsubscribe {
  const q = query(collection(firestoreDb, 'accounts'), where('adminUid', '==', adminUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AppAccount[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          uid: data.uid || d.id,
          username: data.username || data.email || d.id,
          email: data.email || '',
          displayName: data.displayName || data.username || 'Khách',
          role: data.role === 'admin' ? 'admin' : 'guest',
          adminUid: data.adminUid || adminUid,
          active: data.active === true,
        });
      });
      list.sort((a, b) =>
        a.role === 'admin' ? -1 : b.role === 'admin' ? 1 : a.username.localeCompare(b.username)
      );
      onUpdated(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'accounts');
    }
  );
}
