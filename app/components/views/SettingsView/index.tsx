import { useCallback, useEffect, useMemo, useState } from "react";

import { SelectableList, SelectableListOption } from "components";
import { SplitScreenPreview } from "components/previews";
import viewConfigMap, { AboutView } from "components/views";
import { useMenuHideView, useMenuNavigation, useViewContext, useSettings } from "hooks";
import { MENU_CONFIG_STANDARD } from "utils/constants";
import {
  isAuthenticated,
  saveCredentials,
  clearCredentials,
  testConnection,
  getAutoSyncEnabled,
  setAutoSyncEnabled,
} from "utils/navidrome/client";
import type { NavidromeCredentials } from "utils/navidrome/types";
import { useQueryClient } from "@tanstack/react-query";
import { useSyncStatus } from "providers/SyncStatusProvider";

const SettingsView = () => {
  useMenuHideView(viewConfigMap.settings.id);
  const queryClient = useQueryClient();
  const { syncStatus, updateSyncStatus } = useSyncStatus();
  const { setPreview } = useViewContext();
  const { deviceTheme, setDeviceTheme } = useSettings();

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize state from localStorage on mount
  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
    setAutoSync(getAutoSyncEnabled());
  }, []);

  // Sync music library now
  const syncNow = useCallback(async () => {
    if (syncStatus.isSyncing) return;
    
    setIsSyncing(true);
    updateSyncStatus({ 
      isSyncing: true, 
      progress: 0, 
      currentStep: "Starting sync...",
      totalItems: 4,
      syncedItems: 0
    });
    
    // Change preview to sync status
    setPreview(SplitScreenPreview.SyncStatus);
    
    try {
      updateSyncStatus({ 
        currentStep: "Clearing cache...",
        progress: 10
      });

      // Remove all cached queries to force fresh fetches
      queryClient.removeQueries({ queryKey: ["albums"] });
      queryClient.removeQueries({ queryKey: ["artists"] });
      queryClient.removeQueries({ queryKey: ["artist"] });
      queryClient.removeQueries({ queryKey: ["artistAlbums"] });
      queryClient.removeQueries({ queryKey: ["playlists"] });
      queryClient.removeQueries({ queryKey: ["playlist"] });

      updateSyncStatus({ 
        syncedItems: 1,
        progress: 25,
        currentStep: "Fetching artists..."
      });

      // Refetch artists with fresh data
      await queryClient.refetchQueries({ 
        queryKey: ["artists"],
        type: "active"
      });
      
      updateSyncStatus({ 
        syncedItems: 2,
        progress: 50,
        currentStep: "Fetching albums..."
      });

      // Refetch albums
      await queryClient.refetchQueries({ 
        queryKey: ["albums"],
        type: "active"
      });

      updateSyncStatus({ 
        syncedItems: 3,
        progress: 75,
        currentStep: "Fetching playlists..."
      });

      // Refetch playlists
      await queryClient.refetchQueries({ 
        queryKey: ["playlists"],
        type: "active"
      });
      
      updateSyncStatus({ 
        progress: 100,
        currentStep: "Sync complete!",
        syncedItems: 4,
        lastSyncTime: Date.now()
      });
      
      // Dispatch event for any other listeners
      window.dispatchEvent(new CustomEvent("navidrome-sync-completed"));
      
      // Keep success message for 2 seconds
      setTimeout(() => {
        updateSyncStatus({ isSyncing: false });
      }, 2000);
    } catch (error) {
      console.error("Sync failed:", error);
      updateSyncStatus({ 
        isSyncing: false,
        progress: 0,
        currentStep: "Sync failed"
      });
    } finally {
      setIsSyncing(false);
    }
  }, [syncStatus.isSyncing, queryClient, updateSyncStatus, setPreview]);

  // Auto-sync interval (every 5 minutes when enabled)
  useEffect(() => {
    if (!autoSync || !isLoggedIn) return;

    const syncInterval = setInterval(() => {
      syncNow();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(syncInterval);
  }, [autoSync, isLoggedIn, syncNow]);

  // Start sign in flow using window.prompt
  const startSignIn = useCallback(async () => {
    setConnectionError(null);

    // Get server URL
    const serverUrlInput = window.prompt("Enter Navidrome Server URL:", "https://");
    if (!serverUrlInput) return;

    let serverUrl = serverUrlInput.trim();
    if (!serverUrl.startsWith("http://") && !serverUrl.startsWith("https://")) {
      serverUrl = `https://${serverUrl}`;
    }

    // Get username
    const username = window.prompt("Enter Username:");
    if (!username) return;

    // Get password
    const password = window.prompt("Enter Password:");
    if (!password) return;

    // Test connection
    setIsConnecting(true);

    const credentials: NavidromeCredentials = {
      serverUrl,
      username: username.trim(),
      password,
    };

    try {
      const success = await testConnection(credentials);
      if (success) {
        saveCredentials(credentials);
        setIsLoggedIn(true);
        setConnectionError(null);
        window.dispatchEvent(new CustomEvent("navidrome-authenticated"));
      } else {
        setConnectionError("Invalid credentials");
      }
    } catch (err) {
      setConnectionError(
        err instanceof Error ? err.message : "Connection failed"
      );
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Handle sign out
  const handleSignOut = useCallback(() => {
    clearCredentials();
    setIsLoggedIn(false);
    setAutoSync(false);
    setAutoSyncEnabled(false);
    window.dispatchEvent(new CustomEvent("navidrome-signed-out"));
  }, []);

  // Toggle auto sync
  const toggleAutoSync = useCallback(() => {
    const newValue = !autoSync;
    setAutoSync(newValue);
    setAutoSyncEnabled(newValue);
    
    if (newValue) {
      // Trigger initial sync when enabling auto-sync
      syncNow();
    }
  }, [autoSync, syncNow]);

  const options: SelectableListOption[] = useMemo(() => {
    const baseOptions: SelectableListOption[] = [
      {
        type: "view",
        label: "About",
        viewId: viewConfigMap.about.id,
        component: () => <AboutView />,
        preview: SplitScreenPreview.Settings,
      },
    ];

    // Show sign in when logged out
    if (!isLoggedIn) {
      baseOptions.push({
        type: "action",
        label: connectionError
          ? `Sign In (Error)`
          : isConnecting
            ? "Connecting..."
            : "Sign In",
        onSelect: !isConnecting ? startSignIn : () => {},
      });
    }

    // Show these options when logged in
    if (isLoggedIn) {
      baseOptions.push(
        {
          type: "action",
          label: isSyncing ? "Syncing..." : "Sync Now",
          onSelect: !isSyncing ? syncNow : () => {},
          preview: SplitScreenPreview.SyncStatus,
        },
        {
          type: "action",
          label: `Auto Sync: ${autoSync ? "On" : "Off"}`,
          onSelect: toggleAutoSync,
          preview: SplitScreenPreview.SyncStatus,
        },
        {
          type: "action",
          label: "Sign Out",
          onSelect: handleSignOut,
        }
      );
    }

    // Device theme (always available)
    baseOptions.push({
      type: "actionSheet",
      id: viewConfigMap.deviceThemeActionSheet.id,
      label: "Device Theme",
      listOptions: [
        {
          type: "action",
          isSelected: deviceTheme === "silver",
          label: `Silver ${deviceTheme === "silver" ? "(Current)" : ""}`,
          onSelect: () => setDeviceTheme("silver"),
        },
        {
          type: "action",
          isSelected: deviceTheme === "black",
          label: `Black ${deviceTheme === "black" ? "(Current)" : ""}`,
          onSelect: () => setDeviceTheme("black"),
        },
        {
          type: "action",
          isSelected: deviceTheme === "u2",
          label: `U2 Edition ${deviceTheme === "u2" ? "(Current)" : ""}`,
          onSelect: () => setDeviceTheme("u2"),
        },
      ],
      preview: SplitScreenPreview.Theme,
    });

    return baseOptions;
  }, [
    isLoggedIn,
    autoSync,
    deviceTheme,
    setDeviceTheme,
    isConnecting,
    isSyncing,
    connectionError,
    startSignIn,
    syncNow,
    toggleAutoSync,
    handleSignOut,
  ]);

  const { selectedIndex, scrollOffset } = useMenuNavigation({
    id: viewConfigMap.settings.id,
    items: options,
    ...MENU_CONFIG_STANDARD,
  });

  return (
    <SelectableList
      options={options}
      activeIndex={selectedIndex}
      scrollOffset={scrollOffset}
      itemHeight={MENU_CONFIG_STANDARD.itemHeight}
      visibleCount={MENU_CONFIG_STANDARD.visibleCount}
    />
  );
};

export default SettingsView;
