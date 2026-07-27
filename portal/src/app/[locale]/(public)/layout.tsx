import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { mainContentId } from "@/components/layout/SkipLink";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id={mainContentId} className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
