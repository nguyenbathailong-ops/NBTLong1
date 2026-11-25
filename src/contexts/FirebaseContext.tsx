import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import {
  addMemberEmailToWorkspace,
  createSharedWorkspace,
  discoverWorkspaceForUser,
  joinWorkspaceByInviteCode,
  removeMemberEmailFromWorkspace,
  setUserActiveWorkspace,
  SharedWorkspace,
  subscribeToCloudCases,
  subscribeToWorkspace,
  syncAllPendingToCloud,
} from '../services/cloudSync';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  workspace: SharedWorkspace | null;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  triggerManualSync: () => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
  joinWorkspace: (inviteCode: string) => Promise<void>;
  addMemberEmail: (email: string) => Promise<void>;
  removeMemberEmail: (email: string) => Promise<void>;
  leaveWorkspace: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export const FirebaseProvider: React.FC<{
  children: React.ReactNode;
  onCasesChanged: () => void;
}> = ({ children, onCasesChanged }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [workspace, setWorkspace] = useState<SharedWorkspace | null>(null);
  const [workspaceResolvedForUid, setWorkspaceResolvedForUid] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setWorkspace(null);
        setWorkspaceResolvedForUid(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  // Step 1: Discover user profile & active shared workspace when authenticated
  useEffect(() => {
    if (!authReady || !user) return;
    let active = true;

    const resolveWorkspace = async () => {
      if (!navigator.onLine) {
        if (active) setWorkspaceResolvedForUid(user.uid);
        return;
      }
      setIsSyncing(true);
      try {
        const discovered = await discoverWorkspaceForUser(user);
        if (active) {
          setWorkspace(discovered);
          setWorkspaceResolvedForUid(user.uid);
        }
      } catch (err: any) {
        if (active) {
          setAuthError(err?.message || 'Không thể tải thông tin kho đồng bộ.');
          setWorkspaceResolvedForUid(user.uid);
        }
      } finally {
        if (active) setIsSyncing(false);
      }
    };

    resolveWorkspace();
    return () => {
      active = false;
    };
  }, [authReady, user]);

  // Step 2: Subscribe to cases (and workspace updates if in shared workspace)
  const activeWorkspaceId = workspace?.id || null;

  useEffect(() => {
    if (!authReady || !user || workspaceResolvedForUid !== user.uid) return;

    let active = true;
    let unsubscribeCases: (() => void) | null = null;
    let unsubscribeWorkspace: (() => void) | null = null;

    const initSync = async () => {
      if (navigator.onLine) {
        setIsSyncing(true);
        try {
          await syncAllPendingToCloud(user, workspace);
          if (active) {
            setLastSyncedAt(Date.now());
            onCasesChanged();
          }
        } finally {
          if (active) setIsSyncing(false);
        }
      }

      if (active) {
        unsubscribeCases = subscribeToCloudCases(
          user,
          workspace,
          () => {
            if (active) {
              setLastSyncedAt(Date.now());
              onCasesChanged();
            }
          },
          (syncing) => {
            if (active) {
              setIsSyncing(syncing);
              if (!syncing) setLastSyncedAt(Date.now());
            }
          }
        );

        if (workspace) {
          unsubscribeWorkspace = subscribeToWorkspace(workspace.id, user.uid, (updatedWs) => {
            if (active) {
              setWorkspace(updatedWs);
            }
          });
        }
      }
    };

    initSync();

    const handleOnline = async () => {
      if (!active) return;
      setIsSyncing(true);
      try {
        const refreshedWs = await discoverWorkspaceForUser(user);
        if (active && refreshedWs?.id !== workspace?.id) {
          setWorkspace(refreshedWs);
          return;
        }
        await syncAllPendingToCloud(user, refreshedWs || workspace);
        if (active) {
          setLastSyncedAt(Date.now());
          onCasesChanged();
        }
      } finally {
        if (active) setIsSyncing(false);
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      active = false;
      window.removeEventListener('online', handleOnline);
      if (unsubscribeCases) unsubscribeCases();
      if (unsubscribeWorkspace) unsubscribeWorkspace();
    };
  }, [authReady, user, workspaceResolvedForUid, activeWorkspaceId, onCasesChanged]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain') {
        setAuthError(
          `Tên miền "${window.location.hostname}" chưa được thêm vào Authorized Domains trong Firebase Authentication Console. Hãy vào Firebase Console -> Authentication -> Settings -> Authorized domains và thêm "${window.location.hostname}" để đăng nhập trên Vercel.`
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError(
          'Trình duyệt đã chặn cửa sổ đăng nhập bật lên (Popup). Vui lòng cho phép popup cho trang web này.'
        );
      } else {
        setAuthError(err?.message || 'Không thể đăng nhập Google. Vui lòng thử lại.');
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    setWorkspace(null);
    setWorkspaceResolvedForUid(null);
    await signOut(auth);
  }, []);

  const triggerManualSync = useCallback(async () => {
    if (!user) return;
    if (!navigator.onLine) {
      setAuthError('Thiết bị đang ngoại tuyến (Offline). Kết nối Internet để đồng bộ ngay.');
      return;
    }
    setIsSyncing(true);
    try {
      const refreshedWs = await discoverWorkspaceForUser(user);
      setWorkspace(refreshedWs);
      await syncAllPendingToCloud(user, refreshedWs);
      setLastSyncedAt(Date.now());
      onCasesChanged();
    } finally {
      setIsSyncing(false);
    }
  }, [user, onCasesChanged]);

  const createWorkspace = useCallback(
    async (name: string) => {
      if (!user) return;
      setAuthError(null);
      setIsSyncing(true);
      try {
        const ws = await createSharedWorkspace(user, name);
        setWorkspace(ws);
        await syncAllPendingToCloud(user, ws);
        setLastSyncedAt(Date.now());
        onCasesChanged();
      } catch (err: any) {
        setAuthError(err?.message || 'Không thể tạo kho đồng bộ chung.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [user, onCasesChanged]
  );

  const joinWorkspace = useCallback(
    async (inviteCode: string) => {
      if (!user) return;
      setAuthError(null);
      setIsSyncing(true);
      try {
        const ws = await joinWorkspaceByInviteCode(user, inviteCode);
        setWorkspace(ws);
        setLastSyncedAt(Date.now());
        onCasesChanged();
      } catch (err: any) {
        setAuthError(err?.message || 'Không thể tham gia kho đồng bộ bằng mã này.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [user, onCasesChanged]
  );

  const addMemberEmail = useCallback(
    async (email: string) => {
      if (!workspace) return;
      setAuthError(null);
      setIsSyncing(true);
      try {
        const updated = await addMemberEmailToWorkspace(workspace, email);
        setWorkspace(updated);
      } catch (err: any) {
        setAuthError(err?.message || 'Không thể thêm email tài khoản.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [workspace]
  );

  const removeMemberEmail = useCallback(
    async (email: string) => {
      if (!workspace) return;
      setAuthError(null);
      setIsSyncing(true);
      try {
        const updated = await removeMemberEmailFromWorkspace(workspace, email);
        setWorkspace(updated);
      } catch (err: any) {
        setAuthError(err?.message || 'Không thể xóa thành viên.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [workspace]
  );

  const leaveWorkspace = useCallback(async () => {
    if (!user) return;
    setAuthError(null);
    await setUserActiveWorkspace(user.uid, null);
    setWorkspace(null);
  }, [user]);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        workspace,
        isSyncing,
        lastSyncedAt,
        authError,
        clearAuthError,
        signInWithGoogle,
        signOutUser,
        triggerManualSync,
        createWorkspace,
        joinWorkspace,
        addMemberEmail,
        removeMemberEmail,
        leaveWorkspace,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebaseSync(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebaseSync must be used within a FirebaseProvider');
  }
  return ctx;
}
