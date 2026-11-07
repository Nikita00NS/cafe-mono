'use client';

import { useEffect, useState } from 'react';

type Props = {
  initialOpen: boolean;
  initialLabel: string;
};

export function OpenStatus({ initialOpen, initialLabel }: Props) {
  const [state, setState] = useState({ open: initialOpen, label: initialLabel });

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch('/api/state', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (!active || !data?.open) return;
          setState({ open: Boolean(data.open.isOpen), label: String(data.open.label) });
        })
        .catch(() => undefined);

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <span className={`status${state.open ? '' : ' status--closed'}`}>
      <span className="status__dot" aria-hidden="true" />
      {state.label}
    </span>
  );
}
