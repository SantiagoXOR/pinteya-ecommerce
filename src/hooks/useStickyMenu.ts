// ===================================
// PINTEYA E-COMMERCE - HOOK PARA STICKY MENU
// ===================================

import { useState, useEffect, useCallback } from 'react';

interface UseStickyMenuReturn {
  isSticky: boolean;
}

export function useStickyMenu(threshold: number = 80): UseStickyMenuReturn {
  const [isSticky, setIsSticky] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    setIsSticky(scrollTop >= threshold);
  }, [threshold]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return {
    isSticky,
  };
}
