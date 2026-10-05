import TalentsPage from '@/components/pages/TalentsPage';

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';

export default async function Page({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  return <TalentsPage initial={{ q: one(sp.q), pos: one(sp.pos), region: one(sp.region), squad: one(sp.squad), status: one(sp.status) }} />;
}
