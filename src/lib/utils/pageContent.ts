import type { PageContent } from '@/lib/types/spread';

export function hasPageContent(content: PageContent): boolean {
  const hasBlocks = content.blocks && content.blocks.length > 0;
  const hasImage = !!content.image?.src;
  return hasBlocks || hasImage;
}
