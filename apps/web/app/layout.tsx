import "../src/index.css";
import { Providers } from "./providers";
import Link from "next/link";

export const metadata = {
  title: "IMSSA Media Evaluation",
  description: "Media evaluation platform for IMSSA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <nav className="bg-navy-950 p-2 flex space-x-4 text-white text-sm overflow-x-auto">
            <Link href="/" className="hover:underline whitespace-nowrap">
              Marketing (Coordinator)
            </Link>
            <Link href="/designer" className="hover:underline whitespace-nowrap">
              My Work (Designer)
            </Link>
            <Link href="/director" className="hover:underline whitespace-nowrap">
              Review Inbox (Director)
            </Link>
            <Link href="/analytics" className="hover:underline whitespace-nowrap">
              Analytics (Chief)
            </Link>
            <Link href="/admin" className="hover:underline whitespace-nowrap">
              Admin
            </Link>
            <Link href="/marketing-plan" className="hover:underline whitespace-nowrap">
              Google Plan
            </Link>
          </nav>
          {children}
        </Providers>
      </body>
    </html>
  );
}
