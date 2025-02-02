import { Suspense } from 'react';
import './globals.css';

export const metadata = {
  title: 'Jalebi-Fafda - Peer-to-peer File Sharing',
  description: 'Secure peer-to-peer file sharing directly through your browser',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}