import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { getHistoryEntries } from '@/lib/data/history';
import { s, COLORS } from './styles';
import { htmlToPdfElements } from './htmlToPdf';

export interface TextsLabels {
  chapterTexts: string;
  tocTitle: string;
}

export function TextsChapter({ labels }: { labels: TextsLabels }) {
  const entries = getHistoryEntries();

  return (
    <>
      {/* Chapter title page */}
      <Page size="A5" style={[s.pageA5, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={s.chapterTitle}>{labels.chapterTexts}</Text>
      </Page>

      {/* Table of contents */}
      {entries.length > 0 && (
        <Page size="A5" style={s.pageA5}>
          <Text style={[s.sectionTitle, { marginBottom: 12 }]}>{labels.tocTitle}</Text>
          {entries.map((entry, idx) => (
            <View key={idx} style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ fontSize: 9, color: COLORS.inkMuted, width: 20, textAlign: 'right', marginRight: 6 }}>
                {idx + 1}.
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.ink, flex: 1 }}>
                {entry.title || `#${idx + 1}`}
              </Text>
            </View>
          ))}
          <Text style={s.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
        </Page>
      )}

      {/* Each text entry */}
      {entries.map((entry, idx) => (
        <Page key={idx} size="A5" style={s.pageA5} wrap>
          <Text style={[s.sectionTitle, { marginBottom: 10 }]}>
            {entry.title || `#${idx + 1}`}
          </Text>
          <View>{htmlToPdfElements(entry.richText, 10)}</View>
          <Text style={s.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
        </Page>
      ))}
    </>
  );
}
