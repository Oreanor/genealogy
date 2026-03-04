import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';
import type { RichTextNode } from '@/lib/types/spread';
import Link from 'next/link';

interface RichTextProps {
  nodes: RichTextNode[];
}

function renderNode(node: RichTextNode, index: number): React.ReactNode {
  switch (node.type) {
    case 'text':
      return <span key={index}>{node.value}</span>;
    case 'bold':
      return (
        <strong key={index}>
          {node.children.map((n, i) => renderNode(n, i))}
        </strong>
      );
    case 'italic':
      return (
        <em key={index}>
          {node.children.map((n, i) => renderNode(n, i))}
        </em>
      );
    case 'link':
      return (
        <Link
          key={index}
          href={node.href}
          className={CONTENT_LINK_CLASS}
        >
          {node.children.map((n, i) => renderNode(n, i))}
        </Link>
      );
    default:
      return null;
  }
}

export function RichText({ nodes }: RichTextProps) {
  return (
    <>
      {nodes.map((node, index) => (
        <span key={index}>{renderNode(node, index)}</span>
      ))}
    </>
  );
}
