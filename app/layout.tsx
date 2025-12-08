import StyledComponentsRegistry from "lib/registry";
import { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "styles/globals.css";

// Configure the custom font
const myriad = localFont({
  src: "../public/fonts/MyriadPro.otf", // Check if your file is .otf or .ttf
  variable: "--font-myriad",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NaviPod",
  description: "A Navidrome client with classic iPod interface.",
  applicationName: "NaviPod",
  appleWebApp: {
    capable: true,
    title: "NaviPod",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    url: "/",
    title: "NaviPod",
    description: "A Navidrome client with classic iPod interface.",
    type: "website",
  },
  icons: [
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: "/apple-touch-icon.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: "/favicon-16x16.png",
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={myriad.className}>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}