import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function ProductArt({
  kind,
  color,
  alt = "Product photo",
  className,
  priority = false,
}: {
  kind: string;
  color: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "product-art relative aspect-square overflow-hidden rounded-2xl",
        className,
      )}
      style={{ "--product-accent": color } as CSSProperties}
    >
      <Image
        src={kind}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
        className="object-contain p-2 transition duration-500 group-hover:scale-[1.035]"
      />
    </div>
  );
}
