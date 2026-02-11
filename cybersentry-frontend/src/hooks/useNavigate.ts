import { useCallback } from 'react';

export const useNavigate = () => {
  return useCallback((path: string) => {
    window.location.pathname = path;
  }, []);
};
