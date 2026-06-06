'use client';

import { createContext, useContext, ReactNode } from 'react';
import { supabase } from '../services/supabase/client';

const SupabaseContext = createContext(supabase);

export { supabase };

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>;
}
