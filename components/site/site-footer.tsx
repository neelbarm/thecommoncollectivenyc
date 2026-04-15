export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-card/35">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-12 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <p className="font-heading text-base tracking-tight text-foreground">The Common Collective</p>
        <p className="max-w-xl text-[0.9375rem] leading-relaxed">
          A live NYC members club for thoughtful people who want recurring, social, real-world connection.
        </p>
        <div className="pt-2 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground/80">
          New York
        </div>
      </div>
    </footer>
  );
}
