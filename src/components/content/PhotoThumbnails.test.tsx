import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { PhotoEntry } from '@/lib/types/photo';
import { PhotoThumbnails } from './PhotoThumbnails';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt?: string }) => <img src={src} alt={alt ?? ''} />,
}));

describe('PhotoThumbnails', () => {
  it('renders null for empty photos', () => {
    const { container } = render(
      <PhotoThumbnails
        photos={[]}
        selectedPhoto={null}
        onSelect={vi.fn()}
        title="Title"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('toggles expanded grid and selects photo/back', () => {
    const onSelect = vi.fn();

    const p1: PhotoEntry = {
      id: 'p1',
      src: 'front1.jpg',
      backSrc: 'back1.jpg',
      caption: 'Caption 1',
      backCaption: 'Back Caption 1',
    };
    const p2: PhotoEntry = {
      id: 'p2',
      src: 'front2.jpg',
      caption: 'Caption 2',
    };

    render(
      <PhotoThumbnails
        photos={[p1, p2]}
        selectedPhoto={p1}
        onSelect={onSelect}
        title="My Photos"
      />
    );

    const toggle = screen.getByRole('button', { name: /My Photos/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('img')).toBeNull();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const selectedBtn = screen.getByRole('button', { name: /Caption 1/i });
    expect(selectedBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(selectedBtn);
    expect(onSelect).toHaveBeenCalledWith(p1, true);

    const otherBtn = screen.getByRole('button', { name: /Caption 2/i });
    expect(otherBtn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(otherBtn);
    expect(onSelect).toHaveBeenLastCalledWith(p2);
  });
});

