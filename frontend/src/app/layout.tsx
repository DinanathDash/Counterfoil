import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { AuthProvider } from "@/auth/AuthProvider";
import { Toaster } from "@/components/ui/toast";
import { ReactQueryProvider } from "@/lib/queryClient";

export const metadata: Metadata = {
  title: "Counterfoil ERP",
  description: "Operations tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <ReactQueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
