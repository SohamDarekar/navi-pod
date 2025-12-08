import React, { createContext, useContext, useState, useCallback } from "react";

export interface SyncStatus {
  isSyncing: boolean;
  progress: number;
  currentStep: string;
  totalItems: number;
  syncedItems: number;
  lastSyncTime: number | null;
}

interface SyncStatusContextType {
  syncStatus: SyncStatus;
  updateSyncStatus: (updates: Partial<SyncStatus>) => void;
  resetSyncStatus: () => void;
}

const defaultSyncStatus: SyncStatus = {
  isSyncing: false,
  progress: 0,
  currentStep: "",
  totalItems: 0,
  syncedItems: 0,
  lastSyncTime: null,
};

const SyncStatusContext = createContext<SyncStatusContextType>({
  syncStatus: defaultSyncStatus,
  updateSyncStatus: () => {},
  resetSyncStatus: () => {},
});

export const useSyncStatus = () => useContext(SyncStatusContext);

interface Props {
  children: React.ReactNode;
}

export const SyncStatusProvider = ({ children }: Props) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);

  const updateSyncStatus = useCallback((updates: Partial<SyncStatus>) => {
    setSyncStatus((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetSyncStatus = useCallback(() => {
    setSyncStatus(defaultSyncStatus);
  }, []);

  return (
    <SyncStatusContext.Provider
      value={{ syncStatus, updateSyncStatus, resetSyncStatus }}
    >
      {children}
    </SyncStatusContext.Provider>
  );
};
