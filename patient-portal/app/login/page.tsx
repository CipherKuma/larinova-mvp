import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Sign in to Larinova
          </h1>
          <p className="text-base text-foreground/70">
            Enter your email. We&apos;ll send you a magic link — no password
            needed.
          </p>
        </div>
        <LoginForm next={next ?? "/"} />
      </div>
    </main>
  );
}
