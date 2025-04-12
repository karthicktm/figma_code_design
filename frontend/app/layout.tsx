import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { WorkflowProvider } from '@/contexts/workflow-context';
import { FigmaProvider } from '@/contexts/figma-context';
import { EDSProvider } from '@/contexts/eds-context';
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WorkflowProvider>
            <FigmaProvider>
              <EDSProvider>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <div className="flex flex-1">
                    <Sidebar />
                    <main className="flex-1 p-6">{children}</main>
                  </div>
                </div>
              </EDSProvider>
            </FigmaProvider>
          </WorkflowProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}