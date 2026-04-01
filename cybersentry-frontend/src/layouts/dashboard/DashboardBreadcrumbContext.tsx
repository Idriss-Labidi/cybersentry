import { createContext, useContext } from 'react';

type DashboardBreadcrumbContextValue = {
  currentLabel: string | null;
  setCurrentLabel: (label: string | null) => void;
};

export const DashboardBreadcrumbContext = createContext<DashboardBreadcrumbContextValue | null>(null);

export const useDashboardBreadcrumb = () => {
  const context = useContext(DashboardBreadcrumbContext);

  if (!context) {
    throw new Error('useDashboardBreadcrumb must be used within DashboardLayout.');
  }

  return context;
};
