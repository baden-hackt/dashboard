import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lagersystem Dashboard",
  description: "KI-gestütztes Lagerüberwachungssystem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
