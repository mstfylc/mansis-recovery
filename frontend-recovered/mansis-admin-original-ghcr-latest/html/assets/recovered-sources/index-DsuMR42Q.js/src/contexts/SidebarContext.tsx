import { createContext } from 'react';

export const SidebarContext = createContext({
  sidebarToggle: false,
  toggleSidebar: () => {},
  closeSidebar: () => {}
});
