import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentBlocks } from './ContentBlocks';
import type { ContentBlock } from '@/lib/types/spread';

const paraBlock: ContentBlock = {
  type: 'paragraph',
  content: [{ type: 'text', value: 'Paragraph text' }],
};

const headingBlock: ContentBlock = {
  type: 'heading',
  content: [{ type: 'text', value: 'Heading' }],
};

const listBlock: ContentBlock = {
  type: 'list',
  content: [{ type: 'text', value: 'Item' }],
};

describe('ContentBlocks', () => {
  it('renders paragraph', () => {
    render(<ContentBlocks blocks={[paraBlock]} />);
    const text = screen.getByText('Paragraph text');
    expect(text).toBeInTheDocument();
    expect(text.closest('p')).toBeInTheDocument();
  });

  it('renders heading', () => {
    render(<ContentBlocks blocks={[headingBlock]} />);
    expect(screen.getByRole('heading', { name: 'Heading' })).toBeInTheDocument();
  });

  it('renders list', () => {
    render(<ContentBlocks blocks={[listBlock]} />);
    expect(screen.getByText('Item')).toBeInTheDocument();
  });

  it('renders multiple blocks', () => {
    render(<ContentBlocks blocks={[headingBlock, paraBlock]} />);
    expect(screen.getByRole('heading', { name: 'Heading' })).toBeInTheDocument();
    expect(screen.getByText('Paragraph text')).toBeInTheDocument();
  });
});
