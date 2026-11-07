import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { AdminLoginForm } from '@/components/AdminLoginForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Вход в панель',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect('/admin');
  return <AdminLoginForm />;
}
