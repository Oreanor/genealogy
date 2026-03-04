import { hasPageContent } from '@/lib/utils/pageContent';
import type { PageContent } from '@/lib/types/spread';
import { ContentBlocks } from './ContentBlocks';
import { ImageWithHotspots } from './ImageWithHotspots';

interface PageContentRendererProps {
  content: PageContent;
}

export function PageContentRenderer({ content }: PageContentRendererProps) {
  if (!hasPageContent(content)) return null;

  return (
    <div className="flex flex-col gap-4">
      {content.blocks && content.blocks.length > 0 && (
        <ContentBlocks blocks={content.blocks} />
      )}
      {content.image?.src &&
        (content.image.hotspots && content.image.hotspots.length > 0 ? (
          <ImageWithHotspots config={content.image} />
        ) : (
          <ImageWithHotspots
            config={{
              src: content.image.src,
              alt: content.image.alt,
            }}
          />
        ))}
    </div>
  );
}
