"use client";
import * as React from "react";
import { resolveSrc } from "@/lib/design/images";
import { cn } from "@/lib/utils/cn";

/** <img> that understands `local-asset:` / `sb-asset:` references. Lazy-loaded. */
export function AssetImage({ src, alt = "", className, ...rest }: { src: string; alt?: string; className?: string } & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src">) {
  const [url, setUrl] = React.useState<string | null>(src.startsWith("data:") || src.startsWith("http") || src.startsWith("/") ? src : null);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    resolveSrc(src).then((u) => alive && setUrl(u)).catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [src]);
  if (failed) return <div className={cn("flex items-center justify-center bg-muted text-[10px] text-muted-foreground", className)}>Unavailable</div>;
  if (!url) return <div className={cn("animate-pulse bg-muted", className)} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading="lazy" decoding="async" className={className} {...rest} />;
}
