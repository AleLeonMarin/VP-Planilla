"use client";

import Sidebar from "@/components/ui/Sidebar";
import Header from "@/components/ui/Header";
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { useEffect } from 'react';

function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname.startsWith('/pages/auth');

  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthPage) {
      router.push('/pages/auth');
    }
  }, [loading, isAuthenticated, isAuthPage, router]);

  return isAuthPage ? (
    <div className="h-screen bg-[#FBF8F0] dark:bg-[#1a1a1a]">{children}</div>
  ) : (
    <div className="flex h-screen bg-[#E7DCC1] dark:bg-[#121212]">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <InnerLayout>{children}</InnerLayout>
      </ThemeProvider>
    </AuthProvider>
  );
}
