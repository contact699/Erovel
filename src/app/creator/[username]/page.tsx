"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";
import { FollowButton } from "@/components/monetization/follow-button";
import { TipButton } from "@/components/monetization/tip-button";
import { SubscribeButton } from "@/components/monetization/subscribe-button";
import { StoryCard } from "@/components/story/story-card";
import { getProfileByUsername, getStoriesByCreator } from "@/lib/supabase/queries";
import type { Profile, Story } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";
import { ReportButton } from "@/components/ui/report-button";
import { CheckCircle, BookOpen, Users, Calendar } from "lucide-react";

export default function CreatorProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [creator, setCreator] = useState<Profile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const profile = await getProfileByUsername(username);
      if (profile) {
        setCreator(profile);
        const creatorStories = await getStoriesByCreator(profile.id);
        setStories(creatorStories.filter((s: Story) => s.status === "published"));
      }
      setLoaded(true);
    }
    load();
  }, [username]);

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Loading...</div>;
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Creator not found</h1>
          <p className="text-muted">No creator with username &quot;{username}&quot; exists.</p>
          <Link href="/browse" className="text-accent hover:underline text-sm">Browse stories</Link>
        </div>
      </div>
    );
  }

  const storiesTab = (
    <div>
      {stories.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No stories yet</p>
          <p className="text-sm mt-1">This creator has not published any stories yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );

  const aboutTab = (
    <div className="max-w-2xl space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-3">About</h3>
        <p className="text-sm text-muted leading-relaxed">
          {creator.bio || "This creator has not added a bio yet."}
        </p>
      </div>
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-surface-hover">
            <BookOpen size={20} className="text-accent mx-auto mb-1.5" />
            <span className="text-xl font-bold block">{creator.story_count}</span>
            <span className="text-xs text-muted">Stories</span>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-hover">
            <Users size={20} className="text-accent mx-auto mb-1.5" />
            <span className="text-xl font-bold block">{formatNumber(creator.follower_count)}</span>
            <span className="text-xs text-muted">Followers</span>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-hover">
            <Calendar size={20} className="text-accent mx-auto mb-1.5" />
            <span className="text-xl font-bold block">{formatDate(creator.created_at).split(",")[0]}</span>
            <span className="text-xs text-muted">Joined</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="h-40 sm:h-52 bg-gradient-to-br from-accent/20 via-accent/10 to-transparent relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 mb-6">
          <Avatar src={creator.avatar_url} name={creator.display_name} size="xl" className="ring-4 ring-background" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{creator.display_name}</h1>
              {creator.is_verified && <CheckCircle size={20} className="text-accent" />}
            </div>
            <p className="text-muted text-sm">@{creator.username}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <FollowButton creatorId={creator.id} creatorName={creator.display_name} />
            <TipButton creatorName={creator.display_name} />
            <SubscribeButton targetType="creator" targetName={creator.display_name} creatorId={creator.id} price={creator.subscription_price || 9.99} />
            <ReportButton targetType="profile" targetId={creator.id} />
          </div>
        </div>
        {creator.bio && (
          <p className="text-sm text-muted max-w-2xl mb-4 leading-relaxed">{creator.bio}</p>
        )}
        <div className="flex items-center gap-5 text-sm text-muted mb-8">
          <span className="flex items-center gap-1.5"><BookOpen size={15} /><span className="font-medium text-foreground">{creator.story_count}</span> stories</span>
          <span className="flex items-center gap-1.5"><Users size={15} /><span className="font-medium text-foreground">{formatNumber(creator.follower_count)}</span> followers</span>
          <span className="flex items-center gap-1.5"><Calendar size={15} /> Joined {formatDate(creator.created_at)}</span>
        </div>
        <Tabs tabs={[{ id: "stories", label: "Stories", content: storiesTab }, { id: "about", label: "About", content: aboutTab }]} defaultTab="stories" />
        <div className="h-16" />
      </div>
    </div>
  );
}
