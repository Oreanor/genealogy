import type { ContentBlock } from '@/lib/types/spread';
import { RichText } from './RichText';

interface ContentBlocksProps {
  blocks: ContentBlock[];
}

export function ContentBlocks({ blocks }: ContentBlocksProps) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => {
        if (block.type === 'html') {
          return (
            <div
              key={index}
              className="prose prose-sm max-w-none text-(--ink) [&_a]:text-(--link) [&_a:hover]:underline"
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          );
        }

        const content = <RichText nodes={block.content} />;

        switch (block.type) {
          case 'heading':
            return (
              <h2
                key={index}
                className="text-xl font-semibold text-(--ink)"
              >
                {content}
              </h2>
            );
          case 'paragraph':
            return (
              <p key={index} className="text-(--ink)">
                {content}
              </p>
            );
          case 'list':
            return (
              <ul key={index} className="list-inside list-disc text-(--ink)">
                <li>{content}</li>
              </ul>
            );
          default:
            return (
              <p key={index} className="text-(--ink)">
                {content}
              </p>
            );
        }
      })}
    </div>
  );
}
