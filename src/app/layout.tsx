import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import SpeedInsightsClient from "@/component/SpeedInsightsClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meet Stranger - Talk to Strangers",
  description:
    "Meet Stranger is the new Omegle alternative, where you can meet new friends. Connect with strangers through text or video chat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Pre-hydration inline script: remove attributes that some browser
          extensions inject into the <html> element (e.g. crxemulator). This
          runs immediately in the client while the parser executes so React
          hydration sees an unmodified DOM.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `;(function(){try{var h=document.documentElement; if(!h) return; var attrs=Array.from(h.attributes); attrs.forEach(function(a){ if(/^crx|^__crx|^bekkpoin|^extension|^devtools/i.test(a.name)){ h.removeAttribute(a.name); } }); }catch(e){} })();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <SpeedInsights />
         {/* Client-only component to avoid hydration issues */}
        <SpeedInsightsClient />
      </body>
    </html>
  );
}
