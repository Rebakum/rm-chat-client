import AppChrome from "@/components/common/AppChrome";
import { AuthProvider } from "@/store/AuthProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rahmah Chat",
  description: "Connect, Collaborate, Create - Real-time messaging platform",
  icons: {
    icon: "/Rahmah-Institute-Icon.png",
    shortcut: "/Rahmah-Institute-Icon.png",
    apple: "/Rahmah-Institute-Icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AuthProvider>
          <AppChrome>{children}</AppChrome>
        </AuthProvider>
      </body>
    </html>
  );
}
