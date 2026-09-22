import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RTPSC | Ross Tax Pro Software Co.",
    template: "%s | RTPSC",
  },
  description:
    "RTPSC TAXPRAC software, client operations, ERO resources, training, compliance, refund operations, and AI-assisted workflow tools for tax professionals.",
  keywords: [
    "tax software",
    "tax professional software",
    "ERO resources",
    "tax training",
    "TAXPRAC",
    "RTPSC",
    "tax workflow automation",
  ],
  openGraph: {
    title: "Ross Tax Pro Software Co.",
    description: "Smarter Software. Stronger Results.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
