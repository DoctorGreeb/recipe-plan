import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Recipe Plan — рецепты и меню на неделю",
    template: "%s · Recipe Plan",
  },
  description: "Сохраняйте рецепты, планируйте меню на неделю и собирайте список покупок в одном месте.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
