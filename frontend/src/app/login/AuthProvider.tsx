"use client";
import { createContext, useContext, useState, Dispatch, SetStateAction, useEffect } from 'react';
import useSWR, { KeyedMutator } from 'swr';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

interface AuthContextType {
  user: any;
  mutate: KeyedMutator<any>;
  accessToken: string | null;
  setAccessToken: Dispatch<SetStateAction<string | null>>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  const { data: user, error, mutate } = useSWR(accessToken ? '/api/me' : null, async (url) => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  });

  useEffect(() => {
    if (error) router.push('/login');
  }, [error]);

  return (
    <AuthContext.Provider value={{ user, mutate, accessToken, setAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
