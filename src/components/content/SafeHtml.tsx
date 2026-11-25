import { sanitizeRichHtml } from '@/lib/utils/sanitizeHtml';

interface SafeHtmlProps {
  html: string | null | undefined;
  className?: string;
}

/** Renders author/imported rich-text HTML through the allowlist sanitizer. Use instead of raw `dangerouslySetInnerHTML`. */
export function SafeHtml({ html, className }: SafeHtmlProps) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(html) }} />;
}
