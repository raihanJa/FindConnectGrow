import type { Metadata } from 'next';
import AdminPage from '@/components/pages/AdminPage';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return <AdminPage />;
}
