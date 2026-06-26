// SafeImage — render <img> with built-in error handling and a graceful
// emoji placeholder fallback when the URL is missing or 404s.
//
// Props:
//   src          — image URL (may be null/undefined/empty/broken)
//   alt          — alt text
//   fallback     — emoji or letter to render when no image is available
//   className    — passed to the outer wrapper
//   imgClassName — passed to the <img> tag
//
// Strategy:
//   1. If `src` is falsy OR starts with 'placeholder:' → show fallback.
//   2. Otherwise load the URL. On `onError`, flip to fallback and stop retrying.

import { useState } from 'react';

export default function SafeImage({
  src,
  alt = '',
  fallback = '🛍️',
  className = '',
  imgClassName = '',
  ...rest
}) {
  const [errored, setErrored] = useState(false);
  const hasRealImage = !!src && !errored && !String(src).startsWith('placeholder:');

  if (!hasRealImage) {
    return (
      <div
        className={`flex items-center justify-center bg-bazaar-bg2 text-bazaar-ink3 select-none ${className}`}
        role="img"
        aria-label={alt || 'placeholder'}
      >
        <span className="text-3xl leading-none">{fallback}</span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-bazaar-bg2 ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setErrored(true)}
        className={`w-full h-full object-cover ${imgClassName}`}
        {...rest}
      />
    </div>
  );
}
