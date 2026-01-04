import "./globals.css";

export const metadata = {
  title: "PIP-TRADE 3000",
  description: "Crypto AI dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="pip-crt">
          <div className="pip-shell">{children}</div>
        </div>
      </body>
    </html>
  );
}
