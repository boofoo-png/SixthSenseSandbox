import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { APP_NAME } from "@/lib/navigation";
import "./globals.css";

// Typeface of the SIXTH SENSE design system components.
const roboto = Roboto({
  variable: "--font-roboto-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description:
    "Understand your market, research competitors, create content, and plan campaigns in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
