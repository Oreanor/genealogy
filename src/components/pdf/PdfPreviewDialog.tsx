'use client';

import { useEffect, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { BlobProvider } from '@react-pdf/renderer';
import { Download, X, Loader2 } from 'lucide-react';
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
    occupation: t('occupation'),
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

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface PdfPreviewDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PdfPreviewDialog({ open, onClose }: PdfPreviewDialogProps) {
  const t = useTranslations();
  const labels = usePdfLabels();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const filename = `${labels.bookTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')}.pdf`;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/80"
      role="dialog"
      aria-modal
      aria-label={t('pdfPreview')}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-(--surface) px-4 py-2 shadow">
        <span className="text-sm font-medium text-(--ink)">{t('pdfPreview')}</span>
        <div className="flex items-center gap-2">
          <BlobProvider document={<PdfDocument labels={labels} />}>
            {({ blob, loading }) => (
              <button
                type="button"
                disabled={loading || !blob}
                onClick={() => blob && saveBlob(blob, filename)}
                className="flex items-center gap-1.5 rounded-lg bg-(--accent) px-3 py-1.5 text-sm font-medium text-white shadow transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {t('pdfDownload')}
              </button>
            )}
          </BlobProvider>
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
