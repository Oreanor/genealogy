import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageContentRenderer } from './PageContentRenderer';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt?: string }) => (
    <img src={src} alt={alt ?? ''} />
  ),
}));

vi.mock('./ImageWithHotspots', () => ({
  ImageWithHotspots: ({ config }: { config: { src: string; alt?: string } }) => (
    <img data-testid="hotspots" src={config.src} alt={config.alt ?? ''} />
  ),
}));

describe('PageContentRenderer', () => {
  it('returns null for empty content', () => {
    const { container } = render(<PageContentRenderer content={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null for empty blocks', () => {
    const { container } = render(<PageContentRenderer content={{ blocks: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders blocks when present', () => {
    render(
      <PageContentRenderer
        content={{
          blocks: [
            {
              type: 'paragraph',
              content: [{ type: 'text', value: 'Test paragraph' }],
            },
          ],
        }}
      />
    );
    expect(screen.getByText('Test paragraph')).toBeInTheDocument();
  });

  it('renders image when src present', () => {
    render(
      <PageContentRenderer
        content={{
          image: { src: '/photo.jpg', alt: 'Photo' },
        }}
      />
    );
    expect(screen.getByTestId('hotspots')).toBeInTheDocument();
  });

  it('renders blocks and image together', () => {
    render(
      <PageContentRenderer
        content={{
          blocks: [{ type: 'paragraph', content: [{ type: 'text', value: 'Text' }] }],
          image: { src: '/x.jpg' },
        }}
      />
    );
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByTestId('hotspots')).toBeInTheDocument();
  });
});
