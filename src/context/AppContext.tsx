import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, HealthStatus, ApplicationStatus, UserProfile, setAuthToken, getAuthToken } from '../services/apiClient';
import { useToast } from '../components/common/Toast';

export type NavTab =
  | 'overview'
  | 'suppliers'
  | 'products'
  | 'inventory'
  | 'purchase-orders'
  | 'shipments'
  | 'disruptions'
  | 'recovery-plans'
  | 'approvals'
  | 'incident-history'
  | 'ai-agents'
  | 'integrations'
  | 'audit-logs'
  | 'settings';

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedRecordId: number | null;
  setSelectedRecordId: (id: number | null) => void;
  navigateToRecord: (tab: NavTab, recordId: number) => void;
  
  // Auth state
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  loginUser: (email: string, pass: string) => Promise<boolean>;
  logoutUser: () => void;

  // Diagnostics & Status
  dataStatus: any | null;
  health: HealthStatus | null;
  appStatus: ApplicationStatus | null;
  isLoadingStatus: boolean;
  refreshData: () => Promise<void>;
  seedFixtures: () => Promise<void>;
  clearData: () => Promise<void>;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [dataStatus, setDataStatus] = useState<any | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [appStatus, setAppStatus] = useState<ApplicationStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const { showToast } = useToast();

  const refreshData = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const [h, s, detailed] = await Promise.all([
        apiClient.checkHealth().catch(() => null),
        apiClient.getDataStatus().catch(() => null),
        apiClient.getApplicationStatus().catch(() => null),
      ]);
      if (h) setHealth(h);
      if (s) setDataStatus(s);
      if (detailed) setAppStatus(detailed);

      // Verify current token if present
      if (getAuthToken()) {
        try {
          const me = await apiClient.getMe();
          setCurrentUser(me);
        } catch {
          setAuthToken(null);
          setCurrentUser(null);
        }
      }
    } catch (err: any) {
      console.warn('Backend probe warning:', err.message);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const loginUser = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await apiClient.login(email, pass);
      setCurrentUser(res.user);
      showToast('success', `Welcome back, ${res.user.full_name}`, `Authenticated with role '${res.user.role}'`);
      await refreshData();
      return true;
    } catch (err: any) {
      showToast('error', 'Login Failed', err.message);
      return false;
    }
  };

  const logoutUser = () => {
    apiClient.logout();
    setCurrentUser(null);
    showToast('info', 'Logged Out', 'You have been signed out of the resilience control tower.');
  };

  const navigateToRecord = (tab: NavTab, recordId: number) => {
    setActiveTab(tab);
    setSelectedRecordId(recordId);
  };

  const seedFixtures = async () => {
    try {
      setIsLoadingStatus(true);
      await apiClient.seedFixtures();
      showToast('success', 'Development Fixtures Loaded', 'Isolated records seeded with full data provenance tracking.');
      await refreshData();
    } catch (err: any) {
      showToast('error', 'Failed to Seed Fixtures', err.message);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const clearData = async () => {
    try {
      setIsLoadingStatus(true);
      await apiClient.clearData();
      showToast('info', 'Database Reset', 'All operational records cleared. System in awaiting data mode.');
      await refreshData();
    } catch (err: any) {
      showToast('error', 'Failed to Clear Data', err.message);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedRecordId,
        setSelectedRecordId,
        navigateToRecord,
        currentUser,
        isAuthenticated: !!currentUser,
        loginUser,
        logoutUser,
        dataStatus,
        health,
        appStatus,
        isLoadingStatus,
        refreshData,
        seedFixtures,
        clearData,
        globalSearch,
        setGlobalSearch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
