import ProfilePage from '@/components/pages/ProfilePage';
import { TALENTS } from '@/lib/data';

export function generateStaticParams() {
  return TALENTS.map((t) => ({ id: t.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfilePage key={id} id={id} />;
}
