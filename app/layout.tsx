import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jalebi-Fafda',
  description: 'Enjoy the crispy and sweet delight of Jalebi-Fafda!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Jalebi-Fafda</title> 
        <meta name="description" content="Enjoy the crispy and sweet delight of Jalebi-Fafda!" />
        <link rel="icon" href="/jalebijheta-removebg-preview.png" type="image/png" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
