
import React from "react";
<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>


export default function Spinner({
  size = 34,                 // ⬅️ bigger by default
  speed = 0.9,               // seconds per full turn
  thickness = 4,             // ring thickness
  track = "rgba(255,255,255,0.18)",     // background ring
  colors = ["#60a5fa", "#22d3ee", "#34d399", "#f59e0b", "#f472b6"] // cycle list
}) {
  const [i, setI] = React.useState(0);
  const color = colors[i % colors.length];

  return (
    <div
      role="status"
      aria-label="Loading"
      onAnimationIteration={() => setI(v => (v + 1) % colors.length)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `${thickness}px solid ${track}`,
        borderTop: `${thickness}px solid ${color}`, // color updates every rotation
        animation: `spin ${speed}s linear infinite`
      }}
    />
  );
}


