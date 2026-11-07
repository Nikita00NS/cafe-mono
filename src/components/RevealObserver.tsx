'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    nodes.forEach((node) => {
      if (node.getBoundingClientRect().top < window.innerHeight * 0.92) {
        node.classList.add('is-visible');
      } else {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
