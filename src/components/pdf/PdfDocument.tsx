import React from 'react';
import { Document } from '@react-pdf/renderer';
import { TreePage } from './TreePage';
import { PersonsChapter } from './PersonsChapter';
import { TextsChapter } from './TextsChapter';
import { PhotosChapter } from './PhotosChapter';

export interface PdfLabels {
  bookTitle: string;
  chapterTree: string;
  chapterPersons: string;
  chapterTexts: string;
  chapterPhotos: string;
  tocTitle: string;
  spouseM: string;
  spouseF: string;
  parents: string;
  children: string;
  siblings: string;
  years: string;
  birthPlace: string;
  occupation: string;
  mentionedIn: string;
  photo: string;
  roleLabels: Record<string, string>;
}

export function PdfDocument({ labels }: { labels: PdfLabels }) {
  return (
    <Document
      title={labels.bookTitle}
      author="Genealogy Book"
      producer="@react-pdf/renderer"
    >
      <TreePage
        labels={{
          chapterTree: labels.chapterTree,
          roleLabels: labels.roleLabels,
        }}
      />
      <PersonsChapter
        labels={{
          chapterPersons: labels.chapterPersons,
          spouseM: labels.spouseM,
          spouseF: labels.spouseF,
          parents: labels.parents,
          children: labels.children,
          siblings: labels.siblings,
          years: labels.years,
          birthPlace: labels.birthPlace,
          occupation: labels.occupation,
          mentionedIn: labels.mentionedIn,
          photo: labels.photo,
        }}
      />
      <TextsChapter
        labels={{
          chapterTexts: labels.chapterTexts,
          tocTitle: labels.tocTitle,
        }}
      />
      <PhotosChapter
        labels={{
          chapterPhotos: labels.chapterPhotos,
        }}
      />
    </Document>
  );
}
