import Link from 'next/link';
import type { RichTextNode } from '@/lib/types/spread';

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
          className="text-amber-800 underline hover:text-amber-900"
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
