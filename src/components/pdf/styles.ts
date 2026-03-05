import { StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontWeight: 400, fontStyle: 'italic' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bolditalic-webfont.ttf', fontWeight: 700, fontStyle: 'italic' },
  ],
});

export const COLORS = {
  ink: '#1a1a1a',
  inkMuted: '#666666',
  accent: '#6b4c3b',
  border: '#ccbbaa',
  bg: '#faf8f5',
  white: '#ffffff',
};

export const A5_PT = { width: 419.53, height: 595.28 };
export const A4_LANDSCAPE_PT = { width: 841.89, height: 595.28 };

export const s = StyleSheet.create({
  pageA5: {
    width: A5_PT.width,
    height: A5_PT.height,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 32,
    fontFamily: 'Roboto',
    fontSize: 10,
    color: COLORS.ink,
    backgroundColor: COLORS.bg,
  },
  pageA4L: {
    width: A4_LANDSCAPE_PT.width,
    height: A4_LANDSCAPE_PT.height,
    padding: 24,
    fontFamily: 'Roboto',
    fontSize: 9,
    color: COLORS.ink,
    backgroundColor: COLORS.bg,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 16,
    color: COLORS.accent,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
    color: COLORS.ink,
  },
  label: {
    fontSize: 9,
    fontWeight: 500,
    color: COLORS.inkMuted,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: COLORS.ink,
  },
  caption: {
    fontSize: 8,
    color: COLORS.inkMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    fontSize: 8,
    textAlign: 'center',
    color: COLORS.inkMuted,
  },
});
