import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageWithHotspots } from './ImageWithHotspots';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt?: string }) => (
    <img src={src} alt={alt ?? ''} data-testid="image" />
  ),
}));

import { ROUTES } from '@/lib/constants/routes';

describe('ImageWithHotspots', () => {
  beforeEach(() => mockPush.mockClear());

  it('renders image with src and alt', () => {
    render(<ImageWithHotspots config={{ src: '/photo.jpg', alt: 'Photo' }} />);
    const img = screen.getByTestId('image');
    expect(img).toHaveAttribute('src', '/photo.jpg');
    expect(img).toHaveAttribute('alt', 'Photo');
  });

  it('renders rect hotspots and navigates on click', () => {
    render(
      <ImageWithHotspots
        config={{
          src: '/x.jpg',
          hotspots: [
            { personId: 'person-1', shape: 'rect', coords: [10, 20, 50, 80] },
          ],
        }}
      />
    );
    const btn = screen.getByRole('button', { name: 'Перейти к персоне' });
    fireEvent.click(btn);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.person('person-1'));
  });

  it('renders polygon hotspots and navigates on click', () => {
    const { container } = render(
      <ImageWithHotspots
        config={{
          src: '/x.jpg',
          hotspots: [
            {
              personId: 'person-2',
              shape: 'polygon',
              coords: [0, 0, 100, 0, 50, 100],
            },
          ],
        }}
      />
    );
    const polygon = container.querySelector('polygon');
    expect(polygon).toBeTruthy();
    fireEvent.click(polygon!);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.person('person-2'));
  });
});
