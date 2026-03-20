'use client';

import { Dialog } from '@/components/ui/molecules/Dialog';
import { useLocaleRoutes } from '@/lib/i18n/context';
import type { SectionId } from '@/lib/constants/sections';

const STEP_KEYS = [
  'treeHelpStep1', 'treeHelpStep2', 'treeHelpStep3', 'treeHelpStep4',
  'treeHelpStep5', 'treeHelpStep6', 'treeHelpStep7', 'treeHelpStep8',
];

const HELP_TARGETS: SectionId[] = ['tree', 'persons', 'history', 'photos'];

function isHelpTarget(value: string): value is SectionId {
  return HELP_TARGETS.includes(value as SectionId);
}

interface BookHelpDialogProps {
  open: boolean;
  section?: string;
  onClose: () => void;
}

export function BookHelpDialog({ open, section, onClose }: BookHelpDialogProps) {
  const { t } = useLocaleRoutes();
  const targetSection: SectionId = section && isHelpTarget(section) ? section : 'tree';
  const titleKey =
    targetSection === 'tree'
      ? 'chapters_family-tree'
      : targetSection === 'persons'
        ? 'chapters_persons'
        : targetSection === 'history'
          ? 'chapters_history'
          : 'chapters_photos';

  const contextualHelpKeys: Record<SectionId, string[]> = {
    tree: STEP_KEYS,
    persons: ['bookHelpPersons1', 'bookHelpPersons2', 'bookHelpPersons3'],
    history: ['bookHelpHistory1', 'bookHelpHistory2', 'bookHelpHistory3'],
    photos: ['bookHelpPhotos1', 'bookHelpPhotos2', 'bookHelpPhotos3', 'bookHelpPhotos4'],
    kinship: [],
    help: [],
  };

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
            {STEP_KEYS.map((key) => (
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
