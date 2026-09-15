import Link from "next/link";
import { colors, spacing, radius } from "@/lib/design-tokens";

export default function Home() {
  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: `${spacing["3xl"]}px ${spacing.xl}px`,
        background: colors.background,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 560, width: "100%" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: colors.primary,
            background: colors.primaryLight,
            borderRadius: radius.pill,
            padding: "6px 14px",
            marginBottom: spacing.lg,
          }}
        >
          RSTV
        </span>

        <h1
          style={{
            fontSize: 32,
            lineHeight: 1.2,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
            letterSpacing: 0.5,
          }}
        >
          RSTV STAFF ID SYSTEM
        </h1>

        <p
          style={{
            marginTop: spacing.md,
            fontSize: 16,
            lineHeight: 1.6,
            color: colors.textMuted,
          }}
        >
          Issue, manage, and verify staff identification cards for Rivers
          State Television. Admins create and revoke ID records; anyone can
          confirm a card is genuine by scanning its QR code.
        </p>

        <div
          style={{
            marginTop: spacing["2xl"],
            display: "flex",
            flexWrap: "wrap",
            gap: spacing.md,
            justifyContent: "center",
          }}
        >
          <Link href="/admin/login" className="btn btn-primary" style={{ minWidth: 200 }}>
            Admin Login
          </Link>
          <Link href="/verify" className="btn btn-secondary" style={{ minWidth: 200 }}>
            Verify a Card
          </Link>
        </div>
      </div>
    </main>
  );
}
