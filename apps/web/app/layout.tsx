import "../src/index.css";
import { Providers } from "./providers";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/auth/AuthGuard";

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
    <html lang="en" className="dark">
      <body className="bg-navy-950 text-navy-50 antialiased">
        <AuthProvider>
          <Providers>
            <AuthGuard>
              {children}
            </AuthGuard>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
