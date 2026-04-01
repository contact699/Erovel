import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { title: "Story | Erovel" };
  }

  const { data: story } = await supabase
    .from("stories")
    .select("title, description, creator:profiles!creator_id(display_name)")
    .eq("slug", slug)
    .single();

  if (!story) {
    return { title: "Story Not Found | Erovel" };
  }

  const creatorName = (story.creator as { display_name?: string } | null)?.display_name || "Unknown";

  return {
    title: `${story.title} by ${creatorName} | Erovel`,
    description: story.description || `Read ${story.title} on Erovel`,
    openGraph: {
      title: story.title,
      description: story.description || `Read ${story.title} on Erovel`,
      type: "article",
      siteName: "Erovel",
    },
    twitter: {
      card: "summary",
      title: story.title,
      description: story.description || `Read ${story.title} on Erovel`,
    },
  };
}

export default function StoryLayout({ children }: Props) {
  return children;
}
