import Image from "next/image";
import Link from "next/link";

export function Brand({
  inverse = false,
  compact = false,
}: {
  inverse?: boolean;
  compact?: boolean;
}) {
  const source = compact
    ? "/images/voltixa-mark.svg"
    : inverse
      ? "/images/voltixa-logo-white.svg"
      : "/images/voltixa-logo.svg";

  return (
    <Link
      href="/"
      aria-label="Voltixa home"
      className="inline-flex shrink-0 items-center"
    >
      <Image
        src={source}
        alt="Voltixa"
        width={compact ? 40 : 184}
        height={compact ? 40 : 42}
        priority
        className={compact ? "size-10" : "h-10 w-auto"}
      />
    </Link>
  );
}
