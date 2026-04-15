import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-card/35">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-12 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/common-collective-mark.svg"
            alt="The Common Collective mark"
            width={30}
            height={30}
            className="h-7 w-auto opacity-95"
          />
          <Image
            src="/brand/common-collective-wordmark.svg"
            alt="The Common Collective"
            width={240}
            height={43}
            className="h-7 w-auto opacity-95"
          />
        </div>
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
