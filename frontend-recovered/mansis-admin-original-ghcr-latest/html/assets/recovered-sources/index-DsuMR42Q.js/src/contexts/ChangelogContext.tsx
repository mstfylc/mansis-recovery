import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode
} from 'react';
import { fetchChangelog } from '@/data/changelogService';
import { ChangelogApp } from '@/constants/changelog';

const STORAGE_KEY = `changelog_last_read_version_${ChangelogApp.ADMIN}`;

interface ChangelogContextValue {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  hasUnread: boolean;
  markAllRead: () => void;
}

const ChangelogContext = createContext<ChangelogContextValue | null>(null);

export function ChangelogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const markAllRead = useCallback(() => {
    fetchChangelog(ChangelogApp.ADMIN).then((releases) => {
      const latestVersion = releases[0]?.version;
      if (latestVersion) {
        localStorage.setItem(STORAGE_KEY, latestVersion);
        setHasUnread(false);
      }
    });
  }, []);

  useEffect(() => {
    fetchChangelog(ChangelogApp.ADMIN)
      .then((releases) => {
        const latestVersion = releases[0]?.version;
        const lastRead = localStorage.getItem(STORAGE_KEY);
        if (latestVersion && lastRead !== latestVersion) {
          setHasUnread(true);
        }
      })
      .catch(() => {
        // Silently ignore - changelog fetch failure should not break the app
      });
  }, []);

  return (
    <ChangelogContext.Provider
      value={{ isOpen, openDrawer, closeDrawer, hasUnread, markAllRead }}
    >
      {children}
    </ChangelogContext.Provider>
  );
}

export function useChangelog() {
  const ctx = useContext(ChangelogContext);
  if (!ctx) {
    throw new Error('useChangelog must be used within ChangelogProvider');
  }
  return ctx;
}
