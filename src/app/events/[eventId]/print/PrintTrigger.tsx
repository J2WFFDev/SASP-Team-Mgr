"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PrintTrigger() {
  useEffect(() => {
    // Small delay so page content renders before print dialog opens
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="no-print fixed top-0 left-0 right-0 z-50 bg-blue-800 text-white px-4 py-2 flex items-center gap-4 text-sm">
      <button
        onClick={() => window.print()}
        className="bg-white text-blue-800 font-semibold px-4 py-1 rounded hover:bg-blue-100"
      >
        🖨 Print
      </button>
      <button
        onClick={() => window.history.back()}
        className="text-blue-200 hover:text-white"
      >
        ← Back
      </button>
      <span className="text-blue-300 text-xs ml-auto">Print view — nav hidden in print</span>
    </div>
  );
}
