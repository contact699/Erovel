import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="text-6xl font-bold text-accent">404</div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            <BookOpen size={16} />
            Go Home
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors"
          >
            Browse Stories
          </Link>
        </div>
      </div>
    </div>
  );
}
