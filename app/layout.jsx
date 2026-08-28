import "./globals.css";
import SupabaseBridge from "../components/SupabaseBridge";

export const metadata = {
  title: "Cat Club",
  description: "A shared Cat Club site with login, messages, levels, art, videos, and avatar controls.",
};

export default function RootLayout({ children }) {
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    allowedMembers: ["Izzy", "Lexi", "Olivia", "Eve", "Alison", "Hailey", "Elise", "Audrey"],
  };

  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.CATCLUB_CONFIG = ${JSON.stringify(config)};`,
          }}
        />
        <SupabaseBridge />
        {children}
      </body>
    </html>
  );
}
