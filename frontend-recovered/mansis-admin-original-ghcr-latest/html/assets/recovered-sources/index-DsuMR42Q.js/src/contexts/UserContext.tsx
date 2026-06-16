import { ReactNode, createContext, useEffect, useState } from 'react';
import { setUser } from '@/store/userStore';
import { tokenDecoder } from '@/utils/jwt';
import { validateToken } from '@/utils/auth';
import { userService } from '@/data/userService';

interface UserProviderProps {
  children: ReactNode;
}

export const UserContext = createContext<{
  isLoading: boolean;
  fetchUserData: () => Promise<void>;
}>({
  isLoading: true,
  fetchUserData: async () => {}
});

export const UserProvider = ({ children }: UserProviderProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!validateToken(token)) {
        setIsLoading(false);
        return;
      }

      const decodedToken = token ? tokenDecoder(token) : null;
      const userId = decodedToken?.sub;

      if (!userId) {
        console.warn('No user ID found in token');
      }

      const result = await userService.getProfile();

      if (result) {
        await setUser(result);
      } else {
        console.error('No user data returned from profile endpoint');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <UserContext.Provider value={{ isLoading, fetchUserData }}>
      {children}
    </UserContext.Provider>
  );
};
