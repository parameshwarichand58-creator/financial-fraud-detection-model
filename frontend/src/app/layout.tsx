import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FraudIQ — Financial Fraud Risk Intelligence",
  description: "Financial Fraud Risk Intelligence Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
