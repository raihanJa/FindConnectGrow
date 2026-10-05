import { notFound } from 'next/navigation';
import ProfilePage from '@/components/pages/ProfilePage';
import { loadSiteData } from '@/lib/site-data';

export const revalidate = 300;

export async function generateStaticParams() {
  const { TALENTS } = await loadSiteData();
  return TALENTS.map((t) => ({ id: t.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { TALENTS } = await loadSiteData();
  if (!TALENTS.some((t) => t.id === id)) notFound();
  return <ProfilePage key={id} id={id} />;
}
