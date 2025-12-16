import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acclaim Commissioning Form",
  description:
    "Web-based commissioning form that stores responses in Google Sheets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-surface text-surface-foreground">
        {children}
      </body>
    </html>
  );
}
