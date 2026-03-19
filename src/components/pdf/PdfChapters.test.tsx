import React from 'react';
import { describe, it, expect } from 'vitest';
import { TextsChapter } from './TextsChapter';
import { PersonsChapter } from './PersonsChapter';
import { PhotosChapter } from './PhotosChapter';
import { PdfDocument } from './PdfDocument';

function collectStrings(node: unknown, out: string[] = []) {
  if (node == null || typeof node === 'boolean') return out;
  if (typeof node === 'string' || typeof node === 'number') {
    out.push(String(node));
    return out;
  }
  if (Array.isArray(node)) {
    for (const n of node) collectStrings(n, out);
    return out;
  }
  if (React.isValidElement(node)) {
    collectStrings((node as { props?: { children?: unknown } }).props?.children, out);
  }
  return out;
}

describe('PDF chapters', () => {
  it('TextsChapter renders labels (toc + chapter)', () => {
    const tree = TextsChapter({
      labels: { chapterTexts: 'Texts label', tocTitle: 'TOC label' },
    });
    const strings = collectStrings(tree);
    expect(strings).toContain('Texts label');
    expect(strings).toContain('TOC label');
  });

  it('PersonsChapter renders chapter title label', () => {
    const tree = PersonsChapter({
      labels: {
        chapterPersons: 'Persons label',
        spouseM: 'spouseM',
        spouseF: 'spouseF',
        parents: 'parents',
        children: 'children',
        siblings: 'siblings',
        years: 'years',
        birthPlace: 'birthPlace',
        residenceCity: 'residenceCity',
        occupation: 'occupation',
        comment: 'comment',
        mentionedIn: 'mentionedIn',
        photo: 'photo',
      },
    });
    const strings = collectStrings(tree);
    expect(strings).toContain('Persons label');
  });

  it('PhotosChapter renders chapter title label', () => {
    const tree = PhotosChapter({ labels: { chapterPhotos: 'Photos label' } });
    const strings = collectStrings(tree);
    expect(strings).toContain('Photos label');
  });

  it('PdfDocument builds the full PDF tree', () => {
    const tree = PdfDocument({
      labels: {
        bookTitle: 'Book',
        chapterTree: 'Tree',
        chapterPersons: 'Persons label',
        chapterTexts: 'Texts label',
        chapterPhotos: 'Photos label',
        tocTitle: 'TOC label',
        spouseM: 'spouseM',
        spouseF: 'spouseF',
        parents: 'parents',
        children: 'children',
        siblings: 'siblings',
        years: 'years',
        birthPlace: 'birthPlace',
        residenceCity: 'residenceCity',
        occupation: 'occupation',
        comment: 'comment',
        mentionedIn: 'mentionedIn',
        photo: 'photo',
        roleLabels: {},
      },
    });

    const doc = tree as any;
    expect(doc?.props?.title).toBe('Book');
  });
});

