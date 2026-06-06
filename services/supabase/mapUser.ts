import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../../src/modules/auth/types';

export function mapSupabaseUser(user: SupabaseUser): User {
  const firstName = user.user_metadata?.first_name as string | undefined;
  const lastName = user.user_metadata?.last_name as string | undefined;
  const combinedName = [firstName, lastName].filter(Boolean).join(' ');

  return {
    id: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.name as string | undefined) || combinedName || undefined,
    avatar: user.user_metadata?.avatar_url as string | undefined,
    createdAt: user.created_at,
    updatedAt: user.updated_at ?? user.created_at,
  };
}
