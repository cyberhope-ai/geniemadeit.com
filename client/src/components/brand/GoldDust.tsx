/* Gilded Night — ambient gold-dust particle canvas (brand continuity). */
import { useEffect, useRef } from "react";

export function GoldDust() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const x = c.getContext("2d");
    if (!x) return;
    let W = 0,
      H = 0,
      raf = 0;
    type P = { x: number; y: number; r: number; s: number; d: number; h: string };
    let P: P[] = [];
    const seed = () => {
      W = c.width = innerWidth;
      H = c.height = innerHeight;
      const n = Math.min(70, (W * H) / 20000) | 0;
      P = [];
      for (let i = 0; i < n; i++)
        P.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.6 + 0.4,
          s: Math.random() * 0.4 + 0.1,
          d: Math.random() * 6.28,
          h: Math.random() < 0.22 ? "#66e3e8" : "#f5c451",
        });
    };
    seed();
    const onResize = () => seed();
    addEventListener("resize", onResize);
    const loop = () => {
      x.clearRect(0, 0, W, H);
      for (const p of P) {
        p.y -= p.s;
        p.x += Math.sin((p.d += 0.01)) * 0.22;
        if (p.y < -6) {
          p.y = H + 6;
          p.x = Math.random() * W;
        }
        x.globalAlpha = 0.5 + Math.sin(p.d * 2) * 0.4;
        x.fillStyle = p.h;
        x.shadowBlur = 8;
        x.shadowColor = p.h;
        x.beginPath();
        x.arc(p.x, p.y, p.r, 0, 7);
        x.fill();
      }
      x.globalAlpha = 1;
      x.shadowBlur = 0;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}

