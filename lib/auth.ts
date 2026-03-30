import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export type UserRole = 'OWNER' | 'EMPLOYEE' | null;
export type Department =
  | 'SALES'
  | 'ENGINEERING'
  | 'EXECUTION'
  | 'ACCOUNTS'
  | 'OVERALL'
  | null;

export async function getUserRole(): Promise<{
  role: UserRole;
  department: Department;
}> {
  const user = await currentUser();
  if (!user) return { role: null, department: null };

  return {
    role: (user.publicMetadata?.role as UserRole) ?? null,
    department: (user.publicMetadata?.department as Department) ?? null,
  };
}

export async function requireRole(requiredRole: UserRole): Promise<void> {
  const { role } = await getUserRole();
  if (role !== requiredRole) redirect('/dashboard');
}
