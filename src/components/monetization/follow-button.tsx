"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { followCreator, unfollowCreator, isFollowing, createNotification } from "@/lib/supabase/queries";
import { UserPlus, UserCheck } from "lucide-react";

interface FollowButtonProps {
  creatorId: string;
  creatorName: string;
  onFollowChange?: (following: boolean) => void;
}

export function FollowButton({ creatorId, onFollowChange }: FollowButtonProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.id === creatorId) return;
    isFollowing(user.id, creatorId).then(setFollowing);
  }, [user, creatorId]);

  if (!isAuthenticated || !user || user.id === creatorId) return null;

  async function handleToggle() {
    if (!user) return;
    setLoading(true);
    try {
      if (following) {
        await unfollowCreator(user.id, creatorId);
        setFollowing(false);
        onFollowChange?.(false);
      } else {
        await followCreator(user.id, creatorId);
        setFollowing(true);
        onFollowChange?.(true);
        // Notify creator of new follower
        createNotification({
          user_id: creatorId,
          type: "new_follower",
          title: "New follower",
          body: `${user.display_name} started following you`,
          link: `/creator/${user.username}`,
        }).catch(() => {});
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }

  return (
    <Button
      variant={following ? "secondary" : "primary"}
      size="sm"
      onClick={handleToggle}
      loading={loading}
    >
      {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
