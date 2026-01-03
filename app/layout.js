import "./globals.css";

export const metadata = {
  title: "Crypto AI Dashboard",
  description: "Dashboard for Crypto AI API + Bot stats"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
