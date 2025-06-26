import { AuthProvider } from "./AuthProvider";
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {

  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}