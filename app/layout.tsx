import { WhopIframeSdkProvider, WhopThemeScript } from "@whop/react";
import type { Metadata, Viewport } from "next";
import { Shell } from "@/components/layout/Shell";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Whop Job Listings",
  description:
    "Discover open roles and referral opportunities curated for Whop partners."
};

export const viewport: Viewport = {
  themeColor: "#0F1117"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <WhopThemeScript />
      </head>
      <body>
        <WhopIframeSdkProvider>
          <Shell>{children}</Shell>
        </WhopIframeSdkProvider>
      </body>
    </html>
  );
}
