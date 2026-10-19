// Custom hooks for GameZone OS
import { useState, useEffect, useRef } from 'react';

// Live clock hook — updates every `interval` ms
export function useLiveClock(interval = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Session elapsed timer — returns elapsed ms for an active session
export function useSessionElapsed(startTime: string, pausedDuration: number, status: string): number {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (status === 'ended') {
      setElapsed(0);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const start = new Date(startTime).getTime();
      const active = now - start - pausedDuration;
      setElapsed(Math.max(0, active));
      if (status === 'active') {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    // Update once per second using setInterval to avoid excessive renders
    const id = setInterval(() => {
      const now = Date.now();
      const start = new Date(startTime).getTime();
      const active = now - start - pausedDuration;
      setElapsed(Math.max(0, active));
    }, 1000);

    // Initial calc
    const now = Date.now();
    const start = new Date(startTime).getTime();
    setElapsed(Math.max(0, now - start - pausedDuration));

    return () => clearInterval(id);
  }, [startTime, pausedDuration, status]);

  return elapsed;
}
