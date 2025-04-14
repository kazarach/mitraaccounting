// app/login/layout.tsx
export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en">
        <body className="bg-gray-100">
          {children}  {/* Hanya menampilkan halaman login tanpa sidebar atau header */}
        </body>
      </html>
    );
  }
  