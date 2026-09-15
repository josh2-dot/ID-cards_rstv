/**
 * Single source of truth for the RSTV Staff ID System's visual language —
 * colors, type scale, spacing, radius, and shadows.
 *
 * Imported directly by:
 *  - Web components (inline styles / className hooks into the mirrored CSS
 *    variables in app/globals.css)
 *  - lib/card-pdf.tsx (via @react-pdf/renderer's StyleSheet.create, which
 *    cannot read CSS custom properties — it needs plain JS values)
 *
 * Rebranding the org (new navy, new accent, a type-scale bump) means editing
 * values here once; every screen and the printed ID card pick it up.
 *
 * NOTE: app/globals.css mirrors `colors`/`spacing`/`radius`/`shadow` below as
 * CSS custom properties so Tailwind utilities and plain CSS can use them too.
 * If you change a value here, update the matching `--*` variable there.
 */

export const colors = {
  primary: '#0b3d91',
  primaryDark: '#082a66',
  primaryLight: '#e8edfa',

  accent: '#c98a11',
  accentDark: '#9c6b0c',
  accentLight: '#fbf0da',

  success: '#166534',
  successBg: '#dcfce7',
  danger: '#b91c1c',
  dangerBg: '#fee2e2',
  warning: '#92400e',
  warningBg: '#fef3c7',

  white: '#ffffff',
  black: '#000000',

  text: '#171717',
  /** Replaces the old #6b7280 helper-text gray, which fails 4.5:1 on white. */
  textMuted: '#4b5563',
  textOnPrimary: '#ffffff',
  textOnAccent: '#171717',

  border: '#b4b4b4',
  borderLight: '#e5e7eb',

  surface: '#ffffff',
  surfaceMuted: '#f7f7f8',
  background: '#f4f5f7',
} as const;

export const typography = {
  fontSans:
    "var(--font-geist-sans), system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontMono: "var(--font-geist-mono), 'SFMono-Regular', Consolas, monospace",
  /** @react-pdf/renderer ships Helvetica/Courier as built-in core fonts. */
  fontFamilyPdf: 'Helvetica',
  fontFamilyPdfMono: 'Courier',

  size: {
    caption: 12,
    bodySm: 13,
    body: 14,
    bodyLg: 16,
    h3: 18,
    h2: 22,
    h1: 28,
    display: 36,
  },

  weight: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export const shadow = {
  sm: '0 1px 4px rgba(0,0,0,0.1)',
  md: '0 2px 16px rgba(0,0,0,0.08)',
} as const;

/** WCAG 2.5.5 / platform HIG minimum for any tap/click target. */
export const HIT_TARGET_MIN = 44;

export const cardPdf = {
  widthMm: 54,
  heightMm: 86,
};
