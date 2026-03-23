import React from "react";

export function Table({ children }) {  // ✅ Change from default export to named export
  return <table className="border-collapse border w-full">{children}</table>;
}
