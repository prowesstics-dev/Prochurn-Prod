import { useEffect, useState } from "react";

export default function useTopbarHighlight() {
  const [highlight, setHighlight] = useState({
    left: 0,
    width: 0,
    gradient: null
  });

  useEffect(() => {
    const handleScroll = () => {
      const topbarHeight = 60;
      const scrollY = window.scrollY;
      const sections = document.querySelectorAll("[data-gradient]");

      let found = null;
      for (const el of sections) {
        const rect = el.getBoundingClientRect();
        const elTop = rect.top + scrollY;
        const elBottom = elTop + rect.height;

        if (scrollY + topbarHeight > elTop && scrollY < elBottom) {
          const bounding = el.getBoundingClientRect();
          found = {
            left: bounding.left,
            width: bounding.width,
            gradient: el.dataset.gradient,
          };
          break;
        }
      }

      setHighlight(
        found || {
          left: 0,
          width: 0,
          gradient: null,
        }
      );
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return highlight;
}
