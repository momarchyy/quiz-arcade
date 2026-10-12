import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-space-grotesk',
});

export const metadata = {
  title: 'Quiz Arcade',
  description: 'Pick a quiz. Beat the clock. Get graded.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <body>
        <Navbar />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
