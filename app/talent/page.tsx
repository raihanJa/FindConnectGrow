import { redirect } from 'next/navigation';
import { TALENTS } from '@/lib/data';

/* A profile URL without an id shows the first talent, as before. */
export default function Page() {
  redirect(`/talent/${TALENTS[0].id}`);
}
