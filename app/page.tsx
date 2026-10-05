import type { Metadata } from 'next';
import HomePage from '@/components/pages/HomePage';

export const metadata: Metadata = {
  description: 'Find Connect & Grow scouts football talent in conflict-affected regions and connects them to European clubs.'
};

export default function Page() {
  return <HomePage />;
}
