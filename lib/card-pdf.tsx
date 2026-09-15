import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

// FPDF-style card size: 54mm x 86mm, converted to points (1mm = 2.83465pt)
const MM_TO_PT = 2.83465;
export const CARD_WIDTH = 54 * MM_TO_PT; // ~153.07pt
export const CARD_HEIGHT = 86 * MM_TO_PT; // ~243.78pt

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
}

const styles = StyleSheet.create({
  page: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#0b3d91',
    paddingVertical: 10,
    alignItems: 'center',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 1,
  },
  subHeaderText: {
    color: '#0b3d91',
    fontSize: 7,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  photoWrap: {
    alignItems: 'center',
    marginTop: 10,
  },
  photo: {
    width: 68,
    height: 76,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: '#b4b4b4',
  },
  photoPlaceholder: {
    width: 68,
    height: 76,
    borderWidth: 1,
    borderColor: '#b4b4b4',
    backgroundColor: '#f0f0f0',
  },
  fullName: {
    fontSize: 10,
    fontWeight: 700,
    textAlign: 'center',
    marginTop: 8,
    color: '#1c2628',
  },
  sigWrap: {
    alignItems: 'center',
    marginTop: 6,
  },
  signature: {
    width: 50,
    height: 18,
    objectFit: 'contain',
  },
  sigLabel: {
    fontSize: 6,
    color: '#1c2628',
    marginTop: 2,
  },
  infoBlock: {
    marginTop: 8,
    paddingHorizontal: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0b3d91',
    borderRadius: 3,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 3,
  },
  infoLabel: { color: '#ffffff', fontSize: 6.5, fontWeight: 700 },
  infoValue: { color: '#ffffff', fontSize: 6.5, fontWeight: 700 },
  backPage: {
    padding: 14,
    alignItems: 'center',
  },
  qr: {
    width: 68,
    height: 68,
    marginTop: 14,
  },
  scanText: { fontSize: 7, marginTop: 5, color: '#1c2628', fontWeight: 700 },
  disclaimer: {
    fontSize: 6,
    marginTop: 16,
    textAlign: 'center',
    color: '#1c2628',
    lineHeight: 1.5,
  },
  addressTitle: { fontSize: 8, fontWeight: 700, marginTop: 18, textAlign: 'center', color: '#1c2628' },
  addressLine: { fontSize: 6, textAlign: 'center', color: '#1c2628', marginTop: 2 },
});

export function StaffIdCardDocument({ data }: { data: StaffCardData }) {
  return (
    <Document>
      {/* ---- FRONT ---- */}
      <Page size={[CARD_WIDTH, CARD_HEIGHT]} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerText}>RSTV</Text>
        </View>
        <Text style={styles.subHeaderText}>STAFF IDENTITY CARD</Text>

        <View style={styles.photoWrap}>
          {data.photoDataUri ? (
            <Image src={data.photoDataUri} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder} />
          )}
        </View>

        <Text style={styles.fullName}>{data.fullName.toUpperCase()}</Text>

        {data.signatureDataUri && (
          <View style={styles.sigWrap}>
            <Image src={data.signatureDataUri} style={styles.signature} />
            <Text style={styles.sigLabel}>Holder&apos;s Signature</Text>
          </View>
        )}

        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>STAFF ID:</Text>
            <Text style={styles.infoValue}>{data.staffIdNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DEPT:</Text>
            <Text style={styles.infoValue}>{data.department}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ROLE:</Text>
            <Text style={styles.infoValue}>{data.role}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SINCE:</Text>
            <Text style={styles.infoValue}>{data.employmentDate}</Text>
          </View>
          {data.expiresAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>VALID UNTIL:</Text>
              <Text style={styles.infoValue}>{data.expiresAt}</Text>
            </View>
          )}
        </View>
      </Page>

      {/* ---- BACK ---- */}
      <Page size={[CARD_WIDTH, CARD_HEIGHT]} style={styles.backPage}>
        <Image src={data.qrDataUri} style={styles.qr} />
        <Text style={styles.scanText}>Scan to Verify</Text>

        <Text style={styles.disclaimer}>
          This card identifies the holder whose name and photograph appear on
          the front. It remains RStV property and must be surrendered upon
          request or on end of employment.
        </Text>

        <Text style={styles.addressTitle}>RStV</Text>
        <Text style={styles.addressLine}>Port Harcourt, Rivers State</Text>
      </Page>
    </Document>
  );
}
