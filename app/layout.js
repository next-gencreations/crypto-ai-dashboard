import "./globals.css";

export const metadata = {
  title: "Crypto AI Dashboard",
  description: "Dashboard for Crypto AI API + Bot stats",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Makes mobile sizing correct */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#070A12" }}>{children}</body>
    </html>
  );
}
