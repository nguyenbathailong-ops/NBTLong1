import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, firestoreDb } from '../firebase';
import { AppAccount } from '../types/medical';
import {
  bootstrapAdminAccount,
  checkAdminInitialized,
  createGuestAccount as createGuestAccountService,
  fetchAppAccount,
  removeGuestAccount,
  setGuestAccountActive,
  signInWithSelfAccount,
  subscribeToCloudCases,
  subscribeToManagedAccounts,
  syncAllPendingToCloud,
  syncAuthorizedUidsToAllCases,
} from '../services/cloudSync';

export type BootstrapState = 'loading' | 'uninitialized' | 'initialized';

interface FirebaseContextValue {
  user: User | null;
  account: AppAccount | null;
  isAdmin: boolean;
  authReady: boolean;
  bootstrapState: BootstrapState;
  managedAccounts: AppAccount[];
  isSyncing: boolean;
  lastSyncedAt: number | null;
  authError: string | null;
  clearAuthError: () => void;
  refreshBootstrapState: () => Promise<void>;
  initializeAdminAccount: (
    identifier: string,
    password: string,
    displayName: string
  ) => Promise<AppAccount>;
  signInWithAccount: (identifier: string, password: string) => Promise<AppAccount>;
  createGuestAccount: (
    identifier: string,
    password: string,
    displayName: string
  ) => Promise<AppAccount>;
  toggleGuestActive: (guestUid: string, active: boolean) => Promise<void>;
  deleteGuestAccount: (guestUid: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  triggerManualSync: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

const ACCOUNT_CACHE_KEY = 'rhinolog_cached_account';

export const FirebaseProvider: React.FC<{
  children: React.ReactNode;
  onCasesChanged: () => void;
}> = ({ children, onCasesChanged }) => {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<AppAccount | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>('loading');
  const [managedAccounts, setManagedAccounts] = useState<AppAccount[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const refreshBootstrapState = useCallback(async () => {
    try {
      const status = await checkAdminInitialized();
      setBootstrapState(status.initialized ? 'initialized' : 'uninitialized');
    } catch {
      setBootstrapState('initialized');
    }
  }, []);

  useEffect(() => {
    refreshBootstrapState();
  }, [refreshBootstrapState]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setAccount(null);
        setManagedAccounts([]);
        localStorage.removeItem(ACCOUNT_CACHE_KEY);
        setAuthReady(true);
        return;
      }

      if (!navigator.onLine) {
        try {
          const raw = localStorage.getItem(ACCOUNT_CACHE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as AppAccount;
            if (parsed.uid === currentUser.uid && parsed.active) {
              setAccount(parsed);
              setAuthReady(true);
              return;
            }
          }
        } catch {
          // ignore cache error
        }
      }

      try {
        const fetched = await fetchAppAccount(currentUser.uid);
        if (fetched && fetched.active) {
          setAccount(fetched);
          setBootstrapState('initialized');
          localStorage.setItem(ACCOUNT_CACHE_KEY, JSON.stringify(fetched));
        } else if (fetched && !fetched.active) {
          await signOut(auth);
          setAccount(null);
          setAuthError('Tài khoản khách này đã bị Admin tạm khóa quyền truy cập.');
        } else {
          // Might be mid-bootstrap right before batch write finishes; don't force-signout if bootstrap in progress
          setAccount(null);
        }
      } catch (err: any) {
        setAuthError(err?.message || 'Không thể tải thông tin tài khoản.');
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen to own /accounts/{uid} doc so Admin disabling a Guest revokes access immediately
  useEffect(() => {
    if (!authReady || !user || !account) return;
    const unsubSelf = onSnapshot(
      doc(firestoreDb, 'accounts', user.uid),
      async (snap) => {
        if (!snap.exists()) {
          await signOut(auth);
          setAccount(null);
          localStorage.removeItem(ACCOUNT_CACHE_KEY);
          setAuthError('Tài khoản của bạn đã bị Admin xóa khỏi hệ thống.');
          return;
        }
        const d = snap.data();
        if (d.active !== true) {
          await signOut(auth);
          setAccount(null);
          localStorage.removeItem(ACCOUNT_CACHE_KEY);
          setAuthError('Tài khoản khách này đã bị Admin tạm khóa.');
          return;
        }
        const updated: AppAccount = {
          uid: d.uid || user.uid,
          username: d.username || account.username,
          email: d.email || account.email,
          displayName: d.displayName || account.displayName,
          role: d.role === 'admin' ? 'admin' : 'guest',
          adminUid: d.adminUid || account.adminUid,
          active: true,
        };
        setAccount(updated);
        localStorage.setItem(ACCOUNT_CACHE_KEY, JSON.stringify(updated));
      },
      () => {
        // Ignore transient offline listener warnings
      }
    );
    return () => unsubSelf();
  }, [authReady, user?.uid, Boolean(account)]);

  // Admin: subscribe to managed Guest accounts
  useEffect(() => {
    if (!authReady || !account || account.role !== 'admin') {
      setManagedAccounts([]);
      return;
    }
    const unsub = subscribeToManagedAccounts(account.uid, (list) => {
      setManagedAccounts(list);
    });
    return () => unsub();
  }, [authReady, account?.uid, account?.role]);

  // Two-way Cloud Sync subscription for authenticated active account
  useEffect(() => {
    if (!authReady || !account || !account.active) return;

    let active = true;
    let unsubscribeCases: (() => void) | null = null;

    const initSync = async () => {
      if (navigator.onLine) {
        setIsSyncing(true);
        try {
          if (account.role === 'admin') {
            await syncAuthorizedUidsToAllCases(account);
          }
          await syncAllPendingToCloud(account);
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
          account,
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
      }
    };

    initSync();

    const handleOnline = async () => {
      if (!active) return;
      setIsSyncing(true);
      try {
        if (account.role === 'admin') {
          await syncAuthorizedUidsToAllCases(account);
        }
        await syncAllPendingToCloud(account);
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
    };
  }, [authReady, account?.uid, account?.role, account?.active, onCasesChanged]);

  const initializeAdminAccount = useCallback(
    async (identifier: string, password: string, displayName: string) => {
      setAuthError(null);
      setIsSyncing(true);
      try {
        const adminAcc = await bootstrapAdminAccount(identifier, password, displayName);
        setAccount(adminAcc);
        setBootstrapState('initialized');
        localStorage.setItem(ACCOUNT_CACHE_KEY, JSON.stringify(adminAcc));
        await syncAllPendingToCloud(adminAcc);
        setLastSyncedAt(Date.now());
        onCasesChanged();
        return adminAcc;
      } catch (err: any) {
        setAuthError(err?.message || 'Không thể khởi tạo tài khoản Admin.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [onCasesChanged]
  );

  const signInWithAccount = useCallback(
    async (identifier: string, password: string) => {
      setAuthError(null);
      setIsSyncing(true);
      try {
        const acc = await signInWithSelfAccount(identifier, password);
        setAccount(acc);
        setBootstrapState('initialized');
        localStorage.setItem(ACCOUNT_CACHE_KEY, JSON.stringify(acc));
        return acc;
      } catch (err: any) {
        setAuthError(err?.message || 'Không thể đăng nhập.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const createGuestAccount = useCallback(
    async (identifier: string, password: string, displayName: string) => {
      if (!account || account.role !== 'admin') {
        throw new Error('Chỉ Admin mới có quyền tạo tài khoản khách.');
      }
      setAuthError(null);
      setIsSyncing(true);
      try {
        const guest = await createGuestAccountService(account, identifier, password, displayName);
        return guest;
      } catch (err: any) {
        setAuthError(err?.message || 'Không thể tạo tài khoản khách.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [account]
  );

  const toggleGuestActive = useCallback(
    async (guestUid: string, active: boolean) => {
      if (!account || account.role !== 'admin') return;
      setAuthError(null);
      setIsSyncing(true);
      try {
        await setGuestAccountActive(account, guestUid, active);
      } catch (err: any) {
        setAuthError(err?.message || 'Không thể cập nhật trạng thái tài khoản khách.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [account]
  );

  const deleteGuestAccount = useCallback(
    async (guestUid: string) => {
      if (!account || account.role !== 'admin') return;
      setAuthError(null);
      setIsSyncing(true);
      try {
        await removeGuestAccount(account, guestUid);
      } catch (err: any) {
        setAuthError(err?.message || 'Không thể xóa tài khoản khách.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [account]
  );

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    setAccount(null);
    setManagedAccounts([]);
    localStorage.removeItem(ACCOUNT_CACHE_KEY);
    await signOut(auth);
  }, []);

  const triggerManualSync = useCallback(async () => {
    if (!account) return;
    if (!navigator.onLine) {
      setAuthError('Thiết bị đang ngoại tuyến (Offline). Kết nối Internet để đồng bộ ngay.');
      return;
    }
    setIsSyncing(true);
    try {
      if (account.role === 'admin') {
        await syncAuthorizedUidsToAllCases(account);
      }
      await syncAllPendingToCloud(account);
      setLastSyncedAt(Date.now());
      onCasesChanged();
    } finally {
      setIsSyncing(false);
    }
  }, [account, onCasesChanged]);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        account,
        isAdmin: account?.role === 'admin',
        authReady,
        bootstrapState,
        managedAccounts,
        isSyncing,
        lastSyncedAt,
        authError,
        clearAuthError,
        refreshBootstrapState,
        initializeAdminAccount,
        signInWithAccount,
        createGuestAccount,
        toggleGuestActive,
        deleteGuestAccount,
        signOutUser,
        triggerManualSync,
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
