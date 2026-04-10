'use client';

import { Dialog } from '@/components/ui/molecules/Dialog';
import { useLocaleRoutes } from '@/lib/i18n/context';
import { bookHelpSectionTitleMessageKey, resolveBookHelpTargetSection } from '@/lib/constants/sections';
import {
  BOOK_HELP_CONTEXTUAL_KEYS_DIALOG,
  TREE_HELP_STEP_MESSAGE_KEYS,
} from '@/lib/utils/bookHelpContent';

interface BookHelpDialogProps {
  open: boolean;
  section?: string;
  onClose: () => void;
}

export function BookHelpDialog({ open, section, onClose }: BookHelpDialogProps) {
  const { t } = useLocaleRoutes();
  const targetSection = resolveBookHelpTargetSection(section);
  const titleKey = bookHelpSectionTitleMessageKey(targetSection);
  const contextualHelpKeys = BOOK_HELP_CONTEXTUAL_KEYS_DIALOG;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`${t('chapters_help')}: ${t(titleKey)}`}
      variant="alert"
      confirmLabel={t('dialogOk')}
      aria-label={t('chapters_help')}
    >
      {targetSection === 'tree' ? (
        <div className="max-h-[55vh] overflow-y-auto text-left text-sm text-(--ink)">
          <p className="mb-3 leading-relaxed">{t('treeHelpIntro')}</p>
          <p className="mb-2 font-medium">{t('treeHelpStepsTitle')}</p>
          <ul className="list-inside list-disc space-y-1.5">
            {TREE_HELP_STEP_MESSAGE_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="max-h-[55vh] list-inside list-disc space-y-1.5 overflow-y-auto text-left text-sm text-(--ink)">
          {contextualHelpKeys[targetSection].map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
