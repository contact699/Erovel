import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { title: "Creator | Erovel" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, story_count")
    .eq("username", username)
    .single();

  if (!profile) {
    return { title: "Creator Not Found | Erovel" };
  }

  return {
    title: `${profile.display_name} (@${username}) | Erovel`,
    description:
      profile.bio ||
      `${profile.display_name} has ${profile.story_count} stories on Erovel`,
    openGraph: {
      title: `${profile.display_name} on Erovel`,
      description: profile.bio || `Read stories by ${profile.display_name}`,
      type: "profile",
      siteName: "Erovel",
    },
  };
}

export default function CreatorLayout({ children }: Props) {
  return children;
}
