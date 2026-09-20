import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { Organization } from '../types';

interface OrganizationContextType {
  organization: Organization | null;
  setOrganization: (org: Organization | null) => void;
  updateFeatureFlag: (key: string, value: boolean) => void;
  isLoading: boolean;
}

/**
 * Multi-tenant organization is not a live product surface yet.
 * Never invent a "Labora Enterprise Demo" or enterprise plan.
 */
const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setOrganization(null);
    setIsLoading(false);
  }, []);

  const updateFeatureFlag = (key: string, value: boolean) => {
    if (!organization) return;
    setOrganization((prev) => {
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
  if (!context) throw new Error('useOrganization must be used within an OrganizationProvider');
  return context;
};
