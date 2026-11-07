import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { AdminApp } from '@/components/AdminApp';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Панель заказов',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/admin/login');
  return <AdminApp />;
}
