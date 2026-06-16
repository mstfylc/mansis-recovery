import { useState, ReactNode, useCallback, useMemo } from 'react';
import { SidebarContext } from './SidebarContext';

type Props = {
  readonly children: ReactNode;
};

export function SidebarProvider({ children }: Props) {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);

  const toggleSidebar = useCallback(() => {
    setSidebarToggle((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarToggle(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      sidebarToggle,
      toggleSidebar,
      closeSidebar
    }),
    [sidebarToggle, toggleSidebar, closeSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}
