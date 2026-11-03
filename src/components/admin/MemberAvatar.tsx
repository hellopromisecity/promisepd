/** A member's profile photo in a circle, or their initials on brand blue when
 *  they haven't uploaded one. Pure (no hooks), so it renders from server and
 *  client components alike. */
export function initialsOf(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function MemberAvatar({ name, src, size = 40, className = "" }: {
  name: string;
  src: string | null | undefined;
  /** Pixel diameter. */
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} style={style} className={`shrink-0 rounded-full object-cover ${className}`} />
    );
  }
  return (
    <span style={style} className={`grid shrink-0 place-items-center rounded-full bg-brand-blue font-bold text-white ${className}`}>
      <span style={{ fontSize: Math.max(10, Math.round(size * 0.36)) }}>{initialsOf(name)}</span>
    </span>
  );
}
