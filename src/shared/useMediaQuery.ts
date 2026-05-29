import { useEffect, useState } from 'react';

/** Reaktiv matchMedia-hook. Returnerer true når `query` matcher viewporten,
 *  og oppdateres når den krysser breakpoint-et (resize, orientering, devtools). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange(); // sync i tilfelle query endret seg mellom render og effekt
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
