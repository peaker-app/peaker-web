import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { mainContentId } from "@/components/layout/SkipLink";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardSidebarSheet } from "./DashboardSidebarSheet";

interface DashboardLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) {
    redirect({ href: "/login", locale });
  }

  return (
    <>
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6">
        <aside className="hidden w-60 shrink-0 border-e border-border pe-4 lg:block">
          <Sidebar />
        </aside>
        <main id={mainContentId} className="min-w-0 flex-1">
          <DashboardSidebarSheet />
          {children}
        </main>
      </div>
    </>
  );
}
