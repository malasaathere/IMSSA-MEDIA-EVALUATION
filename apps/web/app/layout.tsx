import "../src/index.css";
import { Providers } from "./providers";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppFrame } from "@/components/layout/AppFrame";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('imssa-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <Providers>
            <AuthGuard>
              <AppFrame>{children}</AppFrame>
            </AuthGuard>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
