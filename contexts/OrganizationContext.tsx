
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { Organization, User } from '../types';

interface OrganizationContextType {
  organization: Organization | null;
  setOrganization: (org: Organization) => void;
  updateFeatureFlag: (key: string, value: boolean) => void;
  isLoading: boolean;
}

// Mock Default Org
const DEFAULT_ORG: Organization = {
  id: 'org_default',
  name: 'Labora Enterprise Demo',
  plan: 'enterprise',
  country_code: 'ES',
  feature_flags: {
    policy_engine: true,
    payroll_pro: true,
    delivery_pro: true,
    audit_log: true,
    beta_ai_analysis: false,
    dark_mode_force: false
  }
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching org based on logged in user
    setTimeout(() => {
      setOrganization(DEFAULT_ORG);
      setIsLoading(false);
    }, 500);
  }, []);

  const updateFeatureFlag = (key: string, value: boolean) => {
    if (!organization) return;
    
    setOrganization(prev => {
      if (!prev) return null;
      return {
        ...prev,
        feature_flags: {
          ...prev.feature_flags,
          [key]: value
        }
      };
    });
  };

  return (
    <OrganizationContext.Provider value={{ organization, setOrganization, updateFeatureFlag, isLoading }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error("useOrganization must be used within an OrganizationProvider");
  return context;
};
