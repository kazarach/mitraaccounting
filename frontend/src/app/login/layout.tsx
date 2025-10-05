// app/login/layout.tsx
import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  // Boleh bungkus pakai <div> / <section>, tapi BUKAN <html>/<body>
  return <>{children}</>;
}
