import type { Metadata } from 'next';
import '../styles/globals.css';
import { AuthProvider } from '../context/auth-context';

export const metadata: Metadata = {
  title: 'Practical Roof Solutions Ltd — EMS | Enterprise Management System',
  description:
    'Practical Roof Solutions Ltd enterprise Employee Management System with attendance, leaves, payroll, and performance management.',
  icons: {
    icon: '/logo.png',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700&family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-slate-900 antialiased selection:bg-primary-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
