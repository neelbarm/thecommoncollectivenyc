import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

// Force dynamic rendering so that SiteHeader's auth() call (which reads
// NEXTAUTH_URL) runs at request time, not during the static build phase.
// NEXTAUTH_URL is only available at runtime on Railway after the service
// receives its public domain — it is not present during `next build`.
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
