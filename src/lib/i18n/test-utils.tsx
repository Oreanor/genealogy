import type { ReactNode } from 'react';
import { I18nProvider } from './context';
import { getMessages } from './messages';

export function withI18n(children: ReactNode, locale = 'ru') {
  return (
    <I18nProvider locale={locale as 'ru'} messages={getMessages(locale)}>
      {children}
    </I18nProvider>
  );
}
