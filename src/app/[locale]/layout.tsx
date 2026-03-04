import { I18nProvider } from '@/lib/i18n/context';
import { getMessages } from '@/lib/i18n/messages';
import { isLocale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { LocalePreferenceRedirect } from '@/components/LocalePreferenceRedirect';
import { SetDocumentLang } from '@/components/SetDocumentLang';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);

  return (
    <I18nProvider locale={locale} messages={messages}>
      <SetDocumentLang locale={locale} />
      <LocalePreferenceRedirect />
      {children}
    </I18nProvider>
  );
}
