import type { CSSProperties } from "react";

// The official ea-logo.svg is white-on-transparent, so it is rendered through a
// CSS mask and takes the color of `currentColor` — set the color via className.
const maskStyle: CSSProperties = {
  backgroundColor: "currentColor",
  maskImage: "url(/ea-logo.svg)",
  WebkitMaskImage: "url(/ea-logo.svg)",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
  maskSize: "contain",
  WebkitMaskSize: "contain",
};

export function EaLogo({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Eatable Adventures"
      style={maskStyle}
      className={`inline-block ${className}`}
    />
  );
}
