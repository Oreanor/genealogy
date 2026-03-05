'use client';

import { useTranslations } from '@/lib/i18n/context';
import type { AdminTabId } from '@/lib/constants/storage';
import { Dialog } from '@/components/ui/molecules/Dialog';

interface AdminHelpDialogProps {
  activeTab: AdminTabId;
  onClose: () => void;
}

const HELP_KEYS_BY_TAB: Partial<Record<AdminTabId, string[]>> = {
  persons: ['helpPersonsAdd', 'helpPersonsRoot', 'helpPersonsDelete', 'adminSaveReminder'],
  texts: ['adminHistoryHowItWorks', 'adminSaveReminder'],
  photos: ['adminPhotosHowItWorks', 'helpPhotosFolders', 'helpPhotosNewBadge', 'helpPhotosSteps', 'adminSaveReminder'],
};

export function AdminHelpDialog({ activeTab, onClose }: AdminHelpDialogProps) {
  const t = useTranslations();
  const keys = HELP_KEYS_BY_TAB[activeTab] ?? [];

  return (
    <Dialog
      open
      onClose={onClose}
      title={t('adminHelp')}
      variant="alert"
      confirmLabel={t('dialogOk')}
      aria-label={t('adminHelp')}
    >
      <ul className="list-inside list-disc space-y-2 text-left text-sm text-(--ink)">
        {keys.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </Dialog>
  );
}
