'use client';

import { Fragment, useEffect, useState } from 'react';
import { CONTENT_LINK_CLASS } from '@/lib/constants/theme';
import { getPersonById, getPersons } from '@/lib/data/persons';
import { getHistoryEntriesByPerson } from '@/lib/data/history';
import { getLightboxFacesFromPhoto, splitPersonPhotosForCarousels } from '@/lib/data/photos';
import { buildPersonSummary } from '@/lib/utils/personSummary';
import { formatNameByLocale, formatNamePartsByLocale, formatPersonNameForLocale } from '@/lib/utils/person';
import { stableModuloHash } from '@/lib/utils/string';
import { normalizePlace } from '@/lib/utils/mapPlace';
import { getChildren, getCousins, getSecondCousins, getSpouse, getSiblings } from '@/lib/data/familyRelations';
import type { Person } from '@/lib/types/person';
import type { PhotoEntry } from '@/lib/types/photo';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import Image from 'next/image';
import { List, ListX } from 'lucide-react';
import { PhotoThumbnails } from './PhotoThumbnails';
import { CityPreviewMap } from '@/components/book/CityPreviewMap';

interface PersonSpreadLeftContentProps {
  person: Person;
  personPhotos: PhotoEntry[];
  /** Current big photo (for toggle back on same thumb). */
  selectedPhoto?: PhotoEntry | null;
  onPhotoClick: (photo: PhotoEntry, toggleBack?: boolean) => void;
  onHistoryClick: (index: number) => void;
  /** Render link/button for a relative (Link in persons section, button in tree). */
  renderPersonLink: (person: Person, displayName?: string) => React.ReactNode;
  /** Called when a city mention is clicked in summary text. */
  onCityClick?: (city: string) => void;
}

export function PersonSpreadLeftContent({
  person,
  personPhotos,
  selectedPhoto = null,
  onPhotoClick,
  onHistoryClick,
  renderPersonLink,
  onCityClick,
}: PersonSpreadLeftContentProps) {
  const t = useTranslations();
  const locale = useLocale();
  const children = getChildren(person.id);
  const siblings = getSiblings(person.id);
  const cousins = getCousins(person.id);
  const secondCousins = getSecondCousins(person.id);
  const historyMentions = getHistoryEntriesByPerson(person.id);
  const parents = [person.fatherId, person.motherId]
    .filter(Boolean)
    .map((id) => getPersonById(id as string))
    .filter((p): p is Person => p != null);
  const spouse = getSpouse(person.id);
  const displayPersonName = formatPersonNameForLocale(person, locale);
  const formatRelativeName = (p: Person) => formatPersonNameForLocale(p, locale);
  const summaryLines = buildPersonSummary(person, t).map((line) => formatNameByLocale(line, locale));
  const summaryCityMentions = (() => {
    const mentions: Array<{ original: string; display: string; key: string }> = [];
    const seen = new Set<string>();
    const pushCity = (raw: string) => {
      const original = raw.trim().replace(/\s+/g, ' ');
      const key = normalizePlace(original).toLowerCase();
      if (!original || !key || seen.has(key)) return;
      seen.add(key);
      mentions.push({
        original,
        display: formatNameByLocale(original, locale),
        key,
      });
    };

    if (person.birthPlace?.trim()) pushCity(person.birthPlace);
    if (person.residenceCity?.trim()) {
      for (const part of person.residenceCity.split(',')) pushCity(part);
    }
    return mentions.sort((a, b) => b.display.length - a.display.length);
  })();
  const isDeceased = Boolean(person.deathDate?.trim());
  const pickVariant = (seed: string, count: number) => stableModuloHash(seed, count);
  const renderTemplateWithNode = (template: string, token: string, node: React.ReactNode) => {
    const [before, ...rest] = template.split(token);
    return (
      <>
        {before}
        {node}
        {rest.join(token)}
      </>
    );
  };
  const renderLinkedNames = (items: Person[]) =>
    items.map((p, i) => (
      <Fragment key={p.id}>
        {i > 0 && ', '}
        {renderPersonLink(p, formatRelativeName(p))}
      </Fragment>
    ));
  const spouseSentence = (() => {
    if (spouse) {
      const spouseLink = renderPersonLink(spouse, formatRelativeName(spouse));
      const idx = pickVariant(`${person.id}:spouse`, 3) + 1;
      const key = `personBioSpouse${person.gender === 'f' ? 'Female' : 'Male'}${isDeceased ? 'Deceased' : 'Alive'}_${idx}`;
      return renderTemplateWithNode(t(key), '{{spouse}}', spouseLink);
    }
    return isDeceased
      ? t('personBioSpouseUnknownDeceased')
      : t('personBioSpouseUnknownAlive');
  })();
  const relativesSentences: React.ReactNode[] = [];
  if (parents.length > 0) {
    const idx = pickVariant(`${person.id}:parents`, 3) + 1;
    relativesSentences.push(
      renderTemplateWithNode(
        t(`personBioParents_${idx}`, { pronoun: person.gender === 'f' ? t('personBioPronounHer') : t('personBioPronounHis') }),
        '{{relatives}}',
        renderLinkedNames(parents)
      )
    );
  }
  if (children.length > 0) {
    const idx = pickVariant(`${person.id}:children`, 3) + 1;
    relativesSentences.push(
      renderTemplateWithNode(t(`personBioChildren_${idx}`), '{{relatives}}', renderLinkedNames(children))
    );
  }
  if (siblings.length > 0) {
    relativesSentences.push(
      renderTemplateWithNode(t('personBioSiblings'), '{{relatives}}', renderLinkedNames(siblings))
    );
  }
  if (cousins.length > 0) {
    relativesSentences.push(
      renderTemplateWithNode(t('personBioCousins'), '{{relatives}}', renderLinkedNames(cousins))
    );
  }
  if (secondCousins.length > 0) {
    relativesSentences.push(
      renderTemplateWithNode(t('personBioSecondCousins'), '{{relatives}}', renderLinkedNames(secondCousins))
    );
  }
  const summaryParagraphCount =
    summaryLines.length >= 6 ? 2 : summaryLines.length > 0 ? 1 : 0;
  const summaryPerParagraph = summaryParagraphCount > 0 ? Math.ceil(summaryLines.length / summaryParagraphCount) : 0;
  const summaryParagraphs =
    summaryParagraphCount > 0
      ? Array.from({ length: summaryParagraphCount }, (_, i) =>
          summaryLines.slice(i * summaryPerParagraph, (i + 1) * summaryPerParagraph)
        ).filter((paragraph) => paragraph.length > 0)
      : [];
  const relationLines: React.ReactNode[] = [];
  if (spouseSentence) relationLines.push(spouseSentence);
  relationLines.push(...relativesSentences);
  const renderSummarySentence = (sentence: string, keyBase: string): React.ReactNode => {
    if (!onCityClick || summaryCityMentions.length === 0) return sentence;

    const escaped = summaryCityMentions.map((m) =>
      m.display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const re = new RegExp(`(${escaped.join('|')})`, 'g');
    const parts = sentence.split(re);
    if (parts.length === 1) return sentence;

    return (
      <>
        {parts.map((part, idx) => {
          const mention = summaryCityMentions.find((m) => m.display === part);
          if (!mention) return <Fragment key={`${keyBase}-txt-${idx}`}>{part}</Fragment>;
          return (
            <button
              key={`${keyBase}-city-${idx}`}
              type="button"
              className={CONTENT_LINK_CLASS}
              onClick={() => onCityClick(mention.original)}
            >
              {mention.display}
            </button>
          );
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-5 overflow-y-auto">
      <h2 className="book-serif border-b border-(--ink-muted)/35 pb-0 text-2xl font-semibold text-(--ink)">
        {displayPersonName}
      </h2>
      {summaryParagraphs.length > 0 && (
        <div className="space-y-2.5 book-serif text-sm leading-relaxed text-(--ink)">
          {summaryParagraphs.map((paragraph, paragraphIdx) => (
            <p key={`${person.id}-bio-${paragraphIdx}`}>
              {paragraph.map((sentence, sentenceIdx) => (
                <Fragment key={`${person.id}-bio-${paragraphIdx}-${sentenceIdx}`}>
                  {renderSummarySentence(
                    sentence,
                    `${person.id}-bio-${paragraphIdx}-${sentenceIdx}`
                  )}
                  {sentenceIdx < paragraph.length - 1 ? ' ' : ''}
                </Fragment>
              ))}
            </p>
          ))}
        </div>
      )}
      {relationLines.length > 0 && (
        <div className="space-y-1.5 book-serif text-sm leading-relaxed text-(--ink)">
          {relationLines.map((line, idx) => (
            <p key={`${person.id}-rel-line-${idx}`}>{line}</p>
          ))}
        </div>
      )}
      <div className="space-y-3 pt-2">
        <h3 className="book-serif border-b border-(--ink-muted)/35 pb-0 text-base font-semibold text-(--ink)">
          {t('personPhotos')}
        </h3>
        {personPhotos.length > 0 ? (
          (() => {
            const { noSeries, bySeries } = splitPersonPhotosForCarousels(personPhotos);
            return (
              <>
                {noSeries.length > 0 && (
                  <PhotoThumbnails
                    photos={noSeries}
                    selectedPhoto={selectedPhoto}
                    onSelect={onPhotoClick}
                  />
                )}
                {bySeries.map(({ seriesName, photos: seriesPhotos }) => (
                  <PhotoThumbnails
                    key={seriesName}
                    title={t('photoSeriesTitle', { name: seriesName })}
                    photos={seriesPhotos}
                    selectedPhoto={selectedPhoto}
                    onSelect={onPhotoClick}
                  />
                ))}
              </>
            );
          })()
        ) : (
          <p className="text-sm text-(--ink-muted)">{t('noPhotosYet')}</p>
        )}
      </div>
      <div className="space-y-2 pt-2">
        <h3 className="book-serif border-b border-(--ink-muted)/35 pb-0 text-base font-semibold text-(--ink)">
          {t('personMentionedInStories')}
        </h3>
        {historyMentions.length > 0 ? (
          <ul className="space-y-1.5">
            {historyMentions.map(({ entry, index }) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => onHistoryClick(index)}
                  className={`text-left text-sm ${CONTENT_LINK_CLASS}`}
                >
                  {entry.title || `${t('chapters_history')} ${index + 1}`}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-(--ink-muted)">{t('noTextsYet')}</p>
        )}
      </div>
    </div>
  );
}

interface PersonSpreadRightContentProps {
  person?: Person | null;
  photo: PhotoEntry | null;
  showFaces: boolean;
  showBack: boolean;
  historyEntry: { title: string; richText: string } | null;
  onBigPhotoClick?: () => void;
  onToggleFaces: () => void;
  photoContainerRef?: React.RefObject<HTMLDivElement | null>;
  imageBounds?: { left: number; top: number; width: number; height: number } | null;
  onPhotoImageLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  /** Caption to show below photo (when showing back, use backCaption). */
  caption?: string | null;
  /** When set, show focused map for the city instead of photo/history. */
  mapCity?: string | null;
}

export function PersonSpreadRightContent({
  person = null,
  photo,
  showFaces,
  showBack,
  historyEntry,
  onBigPhotoClick,
  onToggleFaces,
  photoContainerRef,
  imageBounds,
  onPhotoImageLoad,
  caption,
  mapCity = null,
}: PersonSpreadRightContentProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [persistentMapCity, setPersistentMapCity] = useState<string | null>(mapCity);
  const [persistentMapPerson, setPersistentMapPerson] = useState<Person | null>(person);
  useEffect(() => {
    if (!mapCity) return;
    const timeoutId = window.setTimeout(() => {
      setPersistentMapCity(mapCity);
      if (person) setPersistentMapPerson(person);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [mapCity, person]);
  const showMap = Boolean(mapCity);

  let mediaContent: React.ReactNode;
  if (historyEntry) {
    mediaContent = (
      <div className="flex-1 overflow-y-auto">
        <h3 className="book-serif text-xl font-semibold text-(--ink) mb-4">
          {historyEntry.title}
        </h3>
        <div
          className="book-serif prose-sm text-(--ink) leading-relaxed"
          dangerouslySetInnerHTML={{ __html: historyEntry.richText }}
        />
      </div>
    );
  } else if (!photo) {
    mediaContent = (
      <div className="flex flex-1 items-center justify-center text-center text-sm text-(--ink-muted)">
        {t('noMediaData')}
      </div>
    );
  } else {
    const persons = getPersons();
    const faces = getLightboxFacesFromPhoto(photo, persons);
    const hasFaces = faces.length > 0;
    const hasBack = Boolean(photo.backSrc);
    const displaySrc = hasBack && showBack && photo.backSrc ? photo.backSrc : photo.src;
    const displayCaption = hasBack && showBack && photo.backCaption != null ? photo.backCaption : photo.caption;
    const normalizedCaption = (caption ?? '').trim();
    const personalFace = photo.category === 'personal' ? faces[0] : null;
    const personalFaceFullName = personalFace
      ? [personalFace.lastName, personalFace.firstName, personalFace.patronymic]
          .filter((part): part is string => Boolean(part && part.trim()))
          .map((part) => formatNameByLocale(part, locale))
          .join(' ')
      : '';
    const personalFaceCaption =
      personalFaceFullName || (personalFace?.displayName ? formatNameByLocale(personalFace.displayName, locale) : '');
    const finalCaption = normalizedCaption !== '' ? normalizedCaption : personalFaceCaption || '—';
    const bounds = imageBounds ?? { left: 0, top: 0, width: 100, height: 100 };

    const imageBlock = (
      <>
        <Image
          src={displaySrc}
          alt={displayCaption ?? ''}
          fill
          className="object-contain"
          sizes="(max-width: 600px) 100vw, 50vw"
          onLoad={onPhotoImageLoad}
        />
        {hasFaces &&
          !(hasBack && showBack) &&
          showFaces && (
            <div
              className="pointer-events-none absolute"
              style={{
                left: `${bounds.left}%`,
                top: `${bounds.top}%`,
                width: `${bounds.width}%`,
                height: `${bounds.height}%`,
              }}
            >
              {faces.map((face, i) => {
                const [l, t_, r, b] = face.coords;
                const w = r - l;
                const h = b - t_;
                const localizedFaceName = formatNamePartsByLocale(face, locale);
                return (
                  <div key={`${i}-${face.displayName}`} className="absolute inset-0">
                    <div
                      className="absolute border-2 border-white/90"
                      style={{
                        left: `${l}%`,
                        top: `${t_}%`,
                        width: `${w}%`,
                        height: `${h}%`,
                      }}
                    />
                    <div
                      className="absolute rounded bg-black/75 px-2 py-0.5 text-xs font-medium text-white leading-tight text-center"
                      style={{
                        left: `${(l + r) / 2}%`,
                        top: `${b + 1}%`,
                        transform: 'translateX(-50%)',
                      }}
                    >
                      {face.lastName != null || face.firstName != null || face.patronymic != null ? (
                        <>
                          {localizedFaceName.lastName && <span className="block">{localizedFaceName.lastName}</span>}
                          {localizedFaceName.firstName && <span className="block">{localizedFaceName.firstName}</span>}
                          {localizedFaceName.patronymic && <span className="block">{localizedFaceName.patronymic}</span>}
                        </>
                      ) : (
                        face.displayName ? formatNameByLocale(face.displayName, locale) : face.displayName
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </>
    );

    mediaContent = (
      <>
        <div
          ref={photoContainerRef}
          className="relative flex flex-1 min-h-0 overflow-hidden rounded bg-(--paper-light)"
        >
          {onBigPhotoClick ? (
            <button
              type="button"
              className="relative h-full w-full cursor-pointer focus:outline-none"
              onClick={onBigPhotoClick}
              aria-label={t('openFullscreen')}
            >
              <div className="relative h-full w-full">{imageBlock}</div>
            </button>
          ) : (
            <div className="relative h-full w-full">{imageBlock}</div>
          )}
          {hasFaces && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onToggleFaces();
              }}
              className={`absolute bottom-2 right-2 z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80 focus:outline-none ${hasBack && showBack ? 'invisible pointer-events-none' : ''}`}
              title={showFaces ? t('lightboxHideLabels') : t('lightboxShowLabels')}
              aria-label={showFaces ? t('lightboxHideLabels') : t('lightboxShowLabels')}
            >
              {showFaces ? <ListX className="size-[18px]" /> : <List className="size-[18px]" />}
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-sm font-semibold text-(--ink)">
          {finalCaption}
        </p>
      </>
    );
  }

  if (!persistentMapCity) {
    return <>{mediaContent}</>;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className={showMap ? 'flex h-full min-h-0 flex-1 flex-col gap-2' : 'hidden h-full min-h-0 flex-1 flex-col gap-2'}>
        <h3 className="book-serif text-lg font-semibold text-(--ink)">{t('personLifePathMapTitle')}</h3>
        <div className="min-h-0 flex-1">
          {persistentMapPerson ? (
            <CityPreviewMap
              person={persistentMapPerson}
              selectedCity={mapCity ?? persistentMapCity}
            />
          ) : null}
        </div>
      </div>
      <div className={showMap ? 'hidden' : 'flex h-full min-h-0 flex-1 flex-col'}>
        {mediaContent}
      </div>
    </div>
  );
}
