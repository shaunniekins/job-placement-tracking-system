import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; // Assuming you have a providers file for NextUI etc.
import { ValidationBadgeProvider } from "@/contexts/ValidationBadgeContext"; // Import the provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JPTS",
  description: "Job Placement Tracking System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Assuming Providers wraps NextUIProvider, Redux Provider, etc. */}
        <Providers>
          {/* Wrap the children with ValidationBadgeProvider */}
          <ValidationBadgeProvider>
            {/* Your existing layout structure might be here, e.g., including Header, Sidebar */}
            {children}
            {/* End of existing layout structure */}
          </ValidationBadgeProvider>
        </Providers>
      </body>
    </html>
  );
}
