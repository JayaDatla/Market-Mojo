
"use client";

// A collection of reusable SVG filter definitions.
// Using filters as components allows for cleaner SVG markup in charts and other graphics.

/**
 * A standard drop shadow filter.
 * Apply to an SVG element with `filter="url(#drop-shadow)"`.
 */
export function DropShadowFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
      <feOffset in="blur" dx="2" dy="2" result="offsetBlur" />
      <feFlood floodColor="#000" floodOpacity="0.3" result="offsetColor" />
      <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur" />
      <feMerge>
        <feMergeNode in="offsetBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}
