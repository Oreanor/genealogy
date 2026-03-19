import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { PhotoEntry } from '@/lib/types/photo';
import { getPersons } from '@/lib/data/persons';
import { getHistoryEntriesByPerson } from '@/lib/data/history';
import { withI18n } from '@/lib/i18n/test-utils';
import {
  PersonSpreadLeftContent,
  PersonSpreadRightContent,
} from './PersonSpreadContent';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt?: string }) => <img src={src} alt={alt ?? ''} />,
}));

describe('PersonSpreadContent', () => {
  it('left content: shows no photos / no texts', () => {
    const persons = getPersons();
    const person =
      persons.find((p) => getHistoryEntriesByPerson(p.id).length === 0) ?? persons[0];

    render(
      withI18n(
        <PersonSpreadLeftContent
          person={person}
          personPhotos={[]}
          selectedPhoto={null}
          onPhotoClick={vi.fn()}
          onHistoryClick={vi.fn()}
          renderPersonLink={(p) => <span>{p.id}</span>}
        />
      )
    );

    expect(screen.getByText('Нет фотографий')).toBeInTheDocument();
    expect(screen.getByText('Не добавлено ни одного текста')).toBeInTheDocument();
  });

  it('right content: history view and no-media view', () => {
    const { unmount } = render(
      withI18n(
        <PersonSpreadRightContent
          photo={null}
          showFaces={false}
          showBack={false}
          historyEntry={{ title: 'History title', richText: '<p>Hi</p>' }}
          onToggleFaces={vi.fn()}
        />
      )
    );
    expect(screen.getByText('History title')).toBeInTheDocument();
    unmount();

    render(
      withI18n(
        <PersonSpreadRightContent
          photo={null}
          showFaces={false}
          showBack={false}
          historyEntry={null}
          onToggleFaces={vi.fn()}
        />
      )
    );
    expect(
      screen.getByText('Нет дополнительных данных для просмотра')
    ).toBeInTheDocument();
  });

  it('right content: shows faces overlay and supports fullscreen + back caption', () => {
    const onToggleFaces = vi.fn();
    const onBigPhotoClick = vi.fn();

    const photo: PhotoEntry = {
      id: 'photo1',
      src: 'front.jpg',
      backSrc: 'back.jpg',
      caption: 'Front caption',
      backCaption: 'Back caption',
      people: [{ label: 'Test Face', coords: [10, 20, 30, 40] }],
    };

    const { unmount } = render(
      withI18n(
        <PersonSpreadRightContent
          photo={photo}
          showFaces={true}
          showBack={false}
          historyEntry={null}
          onBigPhotoClick={onBigPhotoClick}
          onToggleFaces={onToggleFaces}
          caption="Shown caption"
        />
      )
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Front caption');
    expect(screen.getByText('Test Face')).toBeInTheDocument();

    const fullscreenBtn = screen.getByRole('button', { name: 'Открыть в полном размере' });
    fireEvent.click(fullscreenBtn);
    expect(onBigPhotoClick).toHaveBeenCalled();

    // When showFaces=true, toggle button uses "Спрятать подписи".
    const toggleBtn = screen.getByRole('button', { name: 'Спрятать подписи' });
    fireEvent.click(toggleBtn);
    expect(onToggleFaces).toHaveBeenCalled();

    expect(screen.getByText('Shown caption')).toBeInTheDocument();

    unmount();
    // Now switch to back side: overlay should hide and alt should use backCaption.
    render(
      withI18n(
        <PersonSpreadRightContent
          photo={photo}
          showFaces={true}
          showBack={true}
          historyEntry={null}
          onBigPhotoClick={onBigPhotoClick}
          onToggleFaces={onToggleFaces}
          caption="Shown caption (back)"
        />
      )
    );

    const imgBack = screen.getByRole('img');
    expect(imgBack).toHaveAttribute('alt', 'Back caption');
    expect(screen.queryByText('Test Face')).toBeNull();
  });
});

