// src/utils/index.js
import { useState, useEffect } from "react";

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export const RANK_NAMES = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Grandmaster",
  "Celestial",
  "Eternity+",
];

export function colorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const r = hash & 0xff,
    g = (hash >> 8) & 0xff,
    b = (hash >> 16) & 0xff;
  return `rgb(${r}, ${g}, ${b})`;
}

export function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}