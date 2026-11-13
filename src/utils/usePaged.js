import { useState } from "react";

// Show a long list in pages so the browser never has to draw thousands of rows.
export function usePaged(list, size = 100) {
  const [count, setCount] = useState(size);
  return {
    shown: list.slice(0, count),
    remaining: Math.max(list.length - count, 0),
    showMore: () => setCount((current) => current + size),
  };
}
