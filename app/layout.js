import "./globals.css";

export const metadata = {
  title: "PIP-TRADE 3000",
  description: "Crypto AI dashboard",
  manifest: "/manifest.json",
  themeColor: "#001b0d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PWA support */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#001b0d" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PIP-TRADE" />
      </head>

      <body
        style={{
          margin: 0,
          background: "#001b0d",
          color: "#77ff9a",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        }}
      >
        {children}
      </body>
    </html>
  );
    }
