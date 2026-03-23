import { useEffect } from "react";

export default function useTopbarColorTracker(setTopbarColor) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let activeGradient = null;
        entries.forEach((entry) => {
          const rect = entry.boundingClientRect;
          const mid = rect.top + rect.height / 2;

          if (
            entry.isIntersecting &&
            mid > 0 &&
            mid < 60 &&
            entry.target.dataset.gradient
          ) {
            activeGradient = entry.target.dataset.gradient;
          }
        });

        setTopbarColor(activeGradient || "rgba(236, 237, 240, 0.5)");
      },
      {
        root: document.querySelector("[data-scroll-container]") || null,
        threshold: [0.1, 0.5, 1],
      }
    );

    // ✅ Delay to ensure DOM is ready
    const timeout = setTimeout(() => {
      const targets = document.querySelectorAll("[data-gradient]");
      console.log("🕵️ Tracking gradient nodes:", targets.length);
      targets.forEach((el) => observer.observe(el));
    }, 100); // slight delay to wait for elements to render

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [setTopbarColor]);
}
