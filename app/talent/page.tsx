import { redirect } from 'next/navigation';
import { loadSiteData } from '@/lib/site-data';

export const revalidate = 300;

/* A profile URL without an id shows the first talent, as before. */
export default async function Page() {
  const { TALENTS } = await loadSiteData();
  redirect(`/talent/${TALENTS[0].id}`);
}
