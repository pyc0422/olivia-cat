import AuthClient from "./AuthClient";

export default async function AuthPage({ searchParams }) {
  const params = await searchParams;
  const initialMode = params?.mode === "signup" || params?.mode === "reset" ? params.mode : "login";
  return <AuthClient initialMode={initialMode} />;
}
