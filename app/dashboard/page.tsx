import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  // currentUser() fetches LIVE data from Clerk backend — never stale
  const user = await currentUser();

  if (!user) redirect('/sign-in');

  // Read from publicMetadata directly — always up to date
  const role = user.publicMetadata?.role as string | undefined;
  const department = user.publicMetadata?.department as string | undefined;

  if (role === 'OWNER') {
    redirect('/dashboard/owner');
  }

  if (role === 'EMPLOYEE' && department) {
    redirect(`/dashboard/department/${department}`);
  }

  // Only show pending if role is truly missing after fresh API call
  redirect('/dashboard/pending');
}
