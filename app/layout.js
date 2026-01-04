import "./globals.css";

export const metadata = {
  title: "PIP-TRADE 3000",
  description: "Crypto AI dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#001b0d",
          color: "#77ff9a",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        }}
      >
        <div className="pip-crt">
          <div className="pip-shell">{children}</div>
        </div>
      </body>
    </html>
  );
}
