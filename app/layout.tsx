import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Umfrage – KI-personalisierte Abstimmungswerbung',
  description:
    'Akademische Umfrage zum Einfluss KI-personalisierter Abstimmungswerbung auf Wahlabsichten in der Schweiz.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
