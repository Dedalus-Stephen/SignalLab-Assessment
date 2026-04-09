import type { Metadata } from "next";
import { QueryProvider } from "@/lib/query-provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal Lab",
  description: "Observability playground",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <main className="min-h-screen bg-background">
            <nav className="border-b px-6 py-3">
              <h1 className="text-xl font-bold">Signal Lab</h1>
            </nav>
            <div className="container mx-auto py-8 px-4">
              {children}
            </div>
          </main>
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
