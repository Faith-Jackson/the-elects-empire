import { useEffect } from 'react';

export function useAutosave<T>(value: T, callback: (val: T) => Promise<void>, delay: number = 2000) {
  useEffect(() => {
    const handler = setTimeout(() => {
      callback(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, callback, delay]);
}
