import { redirect } from 'next/navigation';
import { CHAPTER_IDS } from '@/lib/constants/chapters';
import { isLocale } from '@/lib/i18n/config';

const SLUG_TO_SECTION: Record<string, string> = {
  [CHAPTER_IDS.TREE]: '',
  [CHAPTER_IDS.HISTORY]: 'history',
  [CHAPTER_IDS.PHOTOS]: 'photos',
  [CHAPTER_IDS.PERSONS]: 'persons',
};

interface ChapterPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ id?: string; spread?: string }>;
}

/** Редирект со старых URL глав на главную с ?section= (и ?id= для персон) */
export default async function ChapterPage({ params, searchParams }: ChapterPageProps) {
  const { locale, slug } = await params;
  const { id } = await searchParams;
  if (!isLocale(locale)) return null;
  const section = SLUG_TO_SECTION[slug];
  const search = new URLSearchParams();
  if (section) search.set('section', section);
  if (id) search.set('id', id);
  const qs = search.toString();
  redirect(qs ? `/${locale}?${qs}` : `/${locale}`);
}
