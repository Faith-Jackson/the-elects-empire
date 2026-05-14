import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTitle(title: string) {
  const location = useLocation();
  useEffect(() => {
    document.title = `${title} | The Elects Empire`;
  }, [location, title]);
}
