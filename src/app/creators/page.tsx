import Link from "next/link";
import { BookOpen, DollarSign, Users, Shield, Download, PenTool, ArrowRight, MessageSquare, BarChart3, Crown } from "lucide-react";

export const metadata = {
  title: "Become a Creator",
  description: "Publish adult fiction on Erovel. Keep 85% of earnings from tips, subscriptions, and per-story sales.",
};

export default function CreatorsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <PenTool size={14} />
            For Creators
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Your stories deserve
            <br />
            <span className="text-accent">a better platform</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            Erovel is built for adult fiction creators. Write in prose or chat format,
            monetize your work, and connect with readers who love what you create.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
            >
              Start Creating <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Erovel */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-3xl font-bold text-center mb-12">Why creators choose Erovel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: DollarSign,
              title: "Keep 85% of earnings",
              description: "The lowest platform cut in adult fiction. Tips, subscriptions, and per-story sales — you set the prices.",
            },
            {
              icon: BookOpen,
              title: "Two story formats",
              description: "Rich prose editor with inline media, or interactive chat-bubble stories. Both with full image and video support.",
            },
            {
              icon: Download,
              title: "Bulk import",
              description: "Import existing galleries from imgchest in seconds. Paste URLs, reorder chapters, and publish.",
            },
            {
              icon: Crown,
              title: "Flexible monetization",
              description: "Monthly subscriptions, per-story pricing, and direct tips. Gate premium content or keep everything free.",
            },
            {
              icon: BarChart3,
              title: "Analytics dashboard",
              description: "Track views, engagement, and earnings across all your stories. Understand what readers love.",
            },
            {
              icon: MessageSquare,
              title: "Reader engagement",
              description: "Comments, bookmarks, and follow system. Build a community around your work.",
            },
            {
              icon: Users,
              title: "Growing community",
              description: "Join a platform designed specifically for adult fiction. No surprise policy changes or deplatforming.",
            },
            {
              icon: Shield,
              title: "Creator-first policies",
              description: "You own your content. Clear terms, DMCA protection, and creator verification for trust.",
            },
            {
              icon: PenTool,
              title: "Scheduled releases",
              description: "Upload chapters in advance and schedule them for release. Build anticipation with your audience.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-surface border border-border rounded-xl p-6">
              <item.icon size={24} className="text-accent mb-3" />
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <h2 className="text-3xl font-bold text-center mb-12">Get started in minutes</h2>
          <div className="space-y-8">
            {[
              { step: "1", title: "Create your account", description: "Sign up as a creator. Set your display name, bio, and subscription price." },
              { step: "2", title: "Publish your first story", description: "Write directly in our editor, or bulk import from imgchest. Choose prose or chat format." },
              { step: "3", title: "Grow your audience", description: "Share your profile, engage with readers, and earn from tips and subscriptions." },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-lg font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-muted mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
            >
              Create Your Account <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently asked questions</h2>
        <div className="space-y-6">
          {[
            { q: "How much does it cost to publish?", a: "Nothing. Creating an account and publishing stories is completely free. We only take a 15% cut when you earn money." },
            { q: "What content is allowed?", a: "Adult fiction including erotic content. We prohibit CSAM, non-consensual real-person content, and content depicting minors. See our Terms of Service for full details." },
            { q: "How do I get paid?", a: "Earnings are paid out weekly via Paxum or cryptocurrency (USDC). Minimum payout threshold is $50." },
            { q: "Can I import my existing content?", a: "Yes! Our bulk import tool lets you paste imgchest gallery URLs and convert them into chapters instantly." },
            { q: "Do I need to verify my identity?", a: "Yes, creator identity verification is required before publishing for 2257 compliance. We use Veriff for secure, private verification." },
          ].map((item) => (
            <div key={item.q} className="bg-surface border border-border rounded-xl p-5">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="text-sm text-muted mt-2 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
