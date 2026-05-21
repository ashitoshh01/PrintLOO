import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-muted-foreground">This page doesn't exist.</p>
      <Link href="/" className="text-primary hover:underline text-sm">Go home</Link>
    </div>
  );
}
