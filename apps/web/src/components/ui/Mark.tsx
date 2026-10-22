import { cn } from "@/lib/cn";

// La marca del producto. Esta es genérica: reemplazala por la tuya y mantené la
// gramática del sistema, que es una forma en currentColor y un solo acento en
// ember. La marca hereda el color del texto que la rodea, así que funciona en
// el papel y en el escenario sin variantes.
export function Mark({ size = 25, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
      fill="none"
    >
      <path d="M7 2h8.5L20 6.5V22H7z" fill="currentColor" />
      <path d="M3.5 11.5 6.5 12.7v7.8l-3-1.5z" fill="var(--color-ember)" />
    </svg>
  );
}
