import Link from "next/link";
import { PLATFORM_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-sm mb-3">{PLATFORM_NAME}</h3>
            <p className="text-xs text-muted leading-relaxed">
              A platform for adult fiction creators and readers. Stories that ignite.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-3">Browse</h3>
            <ul className="space-y-2 text-xs text-muted">
              <li><Link href="/browse" className="hover:text-foreground transition-colors">All Stories</Link></li>
              <li><Link href="/browse/romance" className="hover:text-foreground transition-colors">Romance</Link></li>
              <li><Link href="/browse/fantasy" className="hover:text-foreground transition-colors">Fantasy</Link></li>
              <li><Link href="/browse?format=chat" className="hover:text-foreground transition-colors">Chat Stories</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-3">Creators</h3>
            <ul className="space-y-2 text-xs text-muted">
              <li><Link href="/creators" className="hover:text-foreground transition-colors">Why Erovel?</Link></li>
              <li><Link href="/signup" className="hover:text-foreground transition-colors">Become a Creator</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Creator Dashboard</Link></li>
              <li><Link href="/dashboard/import" className="hover:text-foreground transition-colors">Import from imgchest</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-3">Legal</h3>
            <ul className="space-y-2 text-xs text-muted">
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/dmca" className="hover:text-foreground transition-colors">DMCA Policy</Link></li>
              <li><Link href="/2257" className="hover:text-foreground transition-colors">2257 Compliance</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-border text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} {PLATFORM_NAME}. All rights reserved. You must be 18+ to use this platform.
        </div>
      </div>
    </footer>
  );
}
