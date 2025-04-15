export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en">
        <body className="bg-gray-100">
          {children}  
        </body>
      </html>
    );
  }
  