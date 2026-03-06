import { StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'PTSerif',
  fonts: [
    { src: '/fonts/PTSerif-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/PTSerif-Bold.ttf', fontWeight: 700 },
    { src: '/fonts/PTSerif-Italic.ttf', fontWeight: 400, fontStyle: 'italic' },
    { src: '/fonts/PTSerif-BoldItalic.ttf', fontWeight: 700, fontStyle: 'italic' },
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

export const FONT_SERIF = 'PTSerif';
export const FONT_SANS = 'PTSerif';

export const A5_PT = { width: 419.53, height: 595.28 };
export const A4_LANDSCAPE_PT = { width: 841.89, height: 595.28 };

export const s = StyleSheet.create({
  pageA5: {
    width: A5_PT.width,
    height: A5_PT.height,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 32,
    fontFamily: FONT_SERIF,
    fontSize: 10,
    color: COLORS.ink,
    backgroundColor: COLORS.bg,
  },
  pageA4L: {
    width: A4_LANDSCAPE_PT.width,
    height: A4_LANDSCAPE_PT.height,
    padding: 24,
    fontFamily: FONT_SANS,
    fontSize: 9,
    color: COLORS.ink,
    backgroundColor: COLORS.bg,
  },
  chapterTitle: {
    fontFamily: FONT_SERIF,
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 16,
    color: COLORS.accent,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: FONT_SERIF,
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
    color: COLORS.ink,
  },
  label: {
    fontFamily: FONT_SANS,
    fontSize: 8,
    fontWeight: 500,
    color: COLORS.inkMuted,
  },
  bodyText: {
    fontFamily: FONT_SERIF,
    fontSize: 10,
    lineHeight: 1.6,
    color: COLORS.ink,
  },
  caption: {
    fontFamily: FONT_SERIF,
    fontSize: 9,
    fontStyle: 'italic',
    color: COLORS.inkMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    fontFamily: FONT_SANS,
    fontSize: 8,
    textAlign: 'center',
    color: COLORS.inkMuted,
  },
});
