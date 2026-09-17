import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { colors, cardPdf, spacing, typography } from './design-tokens';

// FPDF-style card size: 54mm x 86mm, converted to points (1mm = 2.83465pt)
const MM_TO_PT = 2.83465;
export const CARD_WIDTH = cardPdf.widthMm * MM_TO_PT; // ~153.07pt
export const CARD_HEIGHT = cardPdf.heightMm * MM_TO_PT; // ~243.78pt

export interface StaffCardData {
  fullName: string;
  staffIdNumber: string;
  department: string;
  role: string;
  employmentDate: string;
  expiresAt?: string | null;
  photoDataUri?: string | null;
  signatureDataUri?: string | null;
  qrDataUri: string;
  organizationName: string;
  organizationLogoUrl?: string | null;
  organizationPrimaryColor?: string | null;
}

const styles = StyleSheet.create({
  page: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.white,
    fontFamily: typography.fontFamilyPdf,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  headerLogo: {
    width: 16,
    height: 16,
    marginBottom: 2,
  },
  headerText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
  },
  subHeaderText: {
    color: colors.primary,
    fontSize: 6.5,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  fullName: {
    fontSize: 15,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    color: colors.text,
  },
  photoWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  photo: {
    width: 64,
    height: 72,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoPlaceholder: {
    width: 64,
    height: 72,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  sigWrap: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  signature: {
    width: 46,
    height: 16,
    objectFit: 'contain',
  },
  sigLabel: {
    fontSize: 5.5,
    color: colors.text,
    marginTop: 2,
  },
  // ---- Staff ID hero block: the number's own tinted, monospaced block ----
  idHero: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.sm,
    backgroundColor: colors.accentLight,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  idHeroLabel: {
    fontSize: 6,
    fontWeight: 700,
    color: colors.accentDark,
    letterSpacing: 1,
  },
  idHeroValue: {
    fontFamily: 'Courier-Bold',
    fontSize: 13,
    fontWeight: 700,
    color: colors.text,
    marginTop: 1,
  },
  // ---- Plain text row replacing the five stacked navy pills ----
  detailRow: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 7,
    textAlign: 'center',
    color: colors.text,
    lineHeight: 1.4,
  },
  validUntilRow: {
    marginTop: 2,
    paddingHorizontal: spacing.sm,
    fontSize: 7,
    fontWeight: 700,
    textAlign: 'center',
    color: colors.accentDark,
  },
  flipNote: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    fontSize: 6,
    textAlign: 'center',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  backPage: {
    padding: spacing.md,
    alignItems: 'center',
  },
  qr: {
    width: 68,
    height: 68,
    marginTop: spacing.lg,
  },
  scanText: { fontSize: 7, marginTop: spacing.xs, color: colors.text, fontWeight: 700 },
  disclaimer: {
    fontSize: 7.5,
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.text,
    lineHeight: 1.5,
    paddingHorizontal: spacing.sm,
  },
  footerOrgName: { fontSize: 8, fontWeight: 700, marginTop: spacing.lg, textAlign: 'center', color: colors.text },
});

export function StaffIdCardDocument({ data }: { data: StaffCardData }) {
  const headerStyle = data.organizationPrimaryColor
    ? [styles.header, { backgroundColor: data.organizationPrimaryColor }]
    : styles.header;

  return (
    <Document>
      {/* ---- FRONT ---- */}
      <Page size={[CARD_WIDTH, CARD_HEIGHT]} style={styles.page}>
        <View style={headerStyle}>
          {data.organizationLogoUrl && (
            <Image src={data.organizationLogoUrl} style={styles.headerLogo} />
          )}
          <Text style={styles.headerText}>{data.organizationName.toUpperCase()}</Text>
        </View>
        <Text style={styles.subHeaderText}>STAFF IDENTITY CARD</Text>

        <Text style={styles.fullName}>{data.fullName.toUpperCase()}</Text>

        <View style={styles.photoWrap}>
          {data.photoDataUri ? (
            <Image src={data.photoDataUri} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder} />
          )}
        </View>

        {data.signatureDataUri && (
          <View style={styles.sigWrap}>
            <Image src={data.signatureDataUri} style={styles.signature} />
            <Text style={styles.sigLabel}>Holder&apos;s Signature</Text>
          </View>
        )}

        <View style={styles.idHero}>
          <Text style={styles.idHeroLabel}>STAFF ID</Text>
          <Text style={styles.idHeroValue}>{data.staffIdNumber}</Text>
        </View>

        <Text style={styles.detailRow}>
          {data.department} · {data.role} · Since {data.employmentDate}
        </Text>
        {data.expiresAt && <Text style={styles.validUntilRow}>Valid until {data.expiresAt}</Text>}

        <Text style={styles.flipNote}>FLIP TO SCAN →</Text>
      </Page>

      {/* ---- BACK ---- */}
      <Page size={[CARD_WIDTH, CARD_HEIGHT]} style={styles.backPage}>
        <Image src={data.qrDataUri} style={styles.qr} />
        <Text style={styles.scanText}>Scan to Verify</Text>

        <Text style={styles.disclaimer}>
          This card identifies the holder whose name and photograph appear on
          the front. It remains {data.organizationName} property and must be
          surrendered upon request or on end of employment.
        </Text>

        <Text style={styles.footerOrgName}>{data.organizationName}</Text>
      </Page>
    </Document>
  );
}
