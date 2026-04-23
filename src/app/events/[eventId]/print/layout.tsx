import type { ReactNode } from "react";
import PrintTrigger from "./PrintTrigger";

export default function PrintLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PrintTrigger />
      {children}
    </>
  );
}
