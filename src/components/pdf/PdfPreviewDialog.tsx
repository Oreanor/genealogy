'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';
import { useTranslations } from '@/lib/i18n/context';
import { getFamilySurname } from '@/lib/data/owner';
import { PdfDocument } from './PdfDocument';
import type { PdfLabels } from './PdfDocument';

const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((m) => m.PDFViewer),
  { ssr: false }
);

function usePdfLabels(): PdfLabels {
  const t = useTranslations();
  return {
    bookTitle: t('bookTitleTemplate').replace('{{surname}}', getFamilySurname()),
    chapterTree: t('chapters_family-tree'),
    chapterPersons: t('chapters_persons'),
    chapterTexts: t('chapters_history'),
    chapterPhotos: t('chapters_photos'),
    tocTitle: t('tocTitle'),
    spouseM: t('spouseM'),
    spouseF: t('spouseF'),
    parents: t('parents'),
    children: t('children'),
    siblings: t('siblings'),
    years: t('years'),
    birthPlace: t('birthPlace'),
    residenceCity: t('residenceCity'),
    occupation: t('occupation'),
    comment: t('comment'),
    mentionedIn: t('personMentionedInStories'),
    photo: t('personPhotos'),
    roleLabels: {
      roleMe: t('roleMe'),
      roleFather: t('roleFather'),
      roleMother: t('roleMother'),
      roleGrandfather: t('roleGrandfather'),
      roleGrandmother: t('roleGrandmother'),
      roleGreatGrandfather: t('roleGreatGrandfather'),
      roleGreatGrandmother: t('roleGreatGrandmother'),
      roleGgGrandfather: t('roleGgGrandfather'),
      roleGgGrandmother: t('roleGgGrandmother'),
      roleGggGrandfather: t('roleGggGrandfather'),
      roleGggGrandmother: t('roleGggGrandmother'),
    },
  };
}

interface PdfPreviewDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PdfPreviewDialog({ open, onClose }: PdfPreviewDialogProps) {
  const t = useTranslations();
  const labels = usePdfLabels();
  const [isClient] = useState(() => typeof window !== 'undefined');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open || !isClient) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/80"
      role="dialog"
      aria-modal
      aria-label={t('pdfPreview')}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-(--book-bg) px-4 py-2 shadow">
        <span className="text-sm font-medium text-(--ink)">{t('pdfPreview')}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-(--ink) hover:bg-(--paper-light)"
            aria-label={t('adminCancel')}
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        <PDFViewer width="100%" height="100%" showToolbar={false}>
          <PdfDocument labels={labels} />
        </PDFViewer>
      </div>
    </div>
  );
}
