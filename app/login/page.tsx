import type { Metadata } from 'next';
import LoginPage from '@/components/pages/LoginPage';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return <LoginPage />;
}
