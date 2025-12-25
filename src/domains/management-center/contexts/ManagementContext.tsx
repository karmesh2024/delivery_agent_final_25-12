'use client';

import React, { 
    createContext, 
    useContext, 
    useState, 
    useCallback, 
    useEffect, 
    ReactNode 
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ManagementTab } from '../types';

interface ManagementContextType {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  registerTabs: (tabs: ManagementTab[]) => void;
  availableTabs: ManagementTab[];
}

const ManagementContext = createContext<ManagementContextType | undefined>(undefined);

interface ManagementProviderProps {
  children: ReactNode;
  defaultTabId?: string;
}

export const ManagementProvider: React.FC<ManagementProviderProps> = ({ 
    children, 
    defaultTabId = 'overview' 
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setInternalActiveTab] = useState(defaultTabId);
  const [availableTabs, setAvailableTabs] = useState<ManagementTab[]>([]);

  // Read active tab from URL on initial load and whenever searchParams change
  useEffect(() => {
    if (searchParams) {
      const tabFromUrl = searchParams.get('tab');
      if (tabFromUrl && tabFromUrl !== activeTab) {
        setInternalActiveTab(tabFromUrl);
      } else if (!tabFromUrl && activeTab !== defaultTabId) {
        // If no tab in URL but activeTab is not default, set to default
        setInternalActiveTab(defaultTabId);
      }
    }
  }, [searchParams, activeTab, defaultTabId]);

  // Update URL when activeTab changes
  const setActiveTab = useCallback((tabId: string) => {
    setInternalActiveTab(tabId);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (tabId === defaultTabId) {
      params.delete('tab');
    } else {
      params.set('tab', tabId);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams, defaultTabId]);

  const registerTabs = useCallback((tabs: ManagementTab[]) => {
    setAvailableTabs(tabs);
  }, []);

  const value = React.useMemo(() => ({
    activeTab,
    setActiveTab,
    registerTabs,
    availableTabs,
  }), [activeTab, setActiveTab, registerTabs, availableTabs]);

  return (
    <ManagementContext.Provider value={value}>
      {children}
    </ManagementContext.Provider>
  );
};

export const useManagement = () => {
  const context = useContext(ManagementContext);
  if (context === undefined) {
    throw new Error('useManagement must be used within a ManagementProvider');
  }
  return context;
}; 