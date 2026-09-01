import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/auth/AuthProvider";
import { Toaster } from "@/components/ui/toast";
import { ReactQueryProvider } from "@/lib/queryClient";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
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
