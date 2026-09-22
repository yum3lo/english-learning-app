import { useState, useEffect } from 'react';

// delays reflecting a fast-changing value (e.g. search input) until it's stopped changing for
// `delayMs` - keeps server-side search from firing a request on every keystroke
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
