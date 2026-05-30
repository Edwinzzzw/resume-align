import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "简历对齐工具",
  description: "把经历对齐到目标岗位，让面试官一眼看到匹配点",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}