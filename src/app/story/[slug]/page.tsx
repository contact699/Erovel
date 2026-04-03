"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FollowButton } from "@/components/monetization/follow-button";
import { TipButton } from "@/components/monetization/tip-button";
import { SubscribeButton } from "@/components/monetization/subscribe-button";
import {
  formatNumber,
  formatRelativeDate,
  formatDate,
  formatCurrency,
  estimateReadingTime,
} from "@/lib/utils";
import { useSubscriptionStore } from "@/store/subscription-store";
import { useAuthStore } from "@/store/auth-store";
import {
  getStoryBySlug,
  getChapters,
  getComments,
  addComment,
  createNotification,
} from "@/lib/supabase/queries";
import { toast } from "@/components/ui/toast";
import type { Story, Chapter, Comment } from "@/lib/types";
import { ReportButton } from "@/components/ui/report-button";
import { ShareButton } from "@/components/ui/share-button";
import { RightsBadge } from "@/components/story/rights-badge";
import {
  Eye,
  MessageCircle,
  DollarSign,
  BookOpen,
  Clock,
  Hash,
  ChevronRight,
  Lock,
  Calendar,
  MessageSquare,
  BookMarked,
  ArrowLeft,
  Loader2,
} from "lucide-react";

// Social sharing icons (presentational only)
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.066 13.71c.147.047.277.12.39.21a1.476 1.476 0 01-.39 2.544c-.258 1.992-2.79 3.536-5.866 3.536-3.076 0-5.607-1.544-5.866-3.536a1.476 1.476 0 01-.39-2.544c.113-.09.243-.163.39-.21a1.476 1.476 0 012.124-1.116c1.082-.702 2.535-1.143 4.142-1.19l.78-3.666a.37.37 0 01.44-.282l2.594.552a1.048 1.048 0 11-.12.56l-2.318-.494-.694 3.262c1.562.065 2.973.503 4.028 1.188a1.476 1.476 0 012.124 1.116zM9.6 14.4a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4zm4.8 0a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4zm-4.452 1.86a.36.36 0 01.504-.048c.6.5 1.836.78 2.748.78s2.148-.28 2.748-.78a.36.36 0 01.456.552c-.78.66-2.208.972-3.204.972s-2.424-.312-3.204-.972a.36.36 0 01-.048-.504z" />
    </svg>
  );
}

export default function StoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isContentUnlocked = useSubscriptionStore((s) => s.isContentUnlocked);
  const unlocked = story
    ? isContentUnlocked(story.id, story.creator_id)
    : false;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storyData = await getStoryBySlug(slug);
      if (storyData) {
        setStory(storyData as Story);
        const [chaptersData, commentsData] = await Promise.all([
          getChapters(storyData.id),
          getComments(storyData.id),
        ]);
        setChapters(chaptersData as Chapter[]);
        setComments(commentsData as Comment[]);
      }
    } catch {
      setError("Failed to load story");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-danger mb-4">{error}</p>
        <button onClick={() => { setError(null); fetchData(); }} className="text-accent hover:underline text-sm cursor-pointer">
          Try again
        </button>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Story not found</h1>
          <p className="text-muted">
            The story you are looking for does not exist.
          </p>
          <Link href="/">
            <Button variant="secondary">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const firstPublishedChapter = chapters.find(
    (ch) => ch.status === "published"
  );
  const isChat = story.format === "chat";

  return (
    <div className="min-h-screen bg-background">
      {/* Header / Back nav */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <span className="text-sm text-muted truncate">{story.title}</span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* ---- Hero section ---- */}
        <section className="space-y-6">
          {/* Cover image banner */}
          {story.cover_image_url && (
            <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden">
              <img
                src={story.cover_image_url}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          {/* Format + gated badges */}
          <div className="flex items-center gap-2">
            <Badge variant={isChat ? "accent" : "default"}>
              {isChat ? (
                <>
                  <MessageSquare size={12} className="mr-1 inline" />
                  Sext Story
                </>
              ) : (
                <>
                  <BookOpen size={12} className="mr-1 inline" />
                  Illustrated Story
                </>
              )}
            </Badge>
            {story.is_gated && (
              <Badge variant="accent">
                <Lock size={10} className="mr-1 inline" />
                Premium
              </Badge>
            )}
            {story.is_gated && story.price > 0 && (
              <Badge variant="accent">
                <DollarSign size={10} className="mr-1 inline" />
                {formatCurrency(story.price)}
              </Badge>
            )}
            {story.category && (
              <Badge variant="outline">{story.category.name}</Badge>
            )}
            {story.badge_level && story.badge_level !== "none" && (
              <RightsBadge badgeLevel={story.badge_level} size="md" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
            {story.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-muted leading-relaxed">
            {story.description}
          </p>

          {/* Creator info */}
          <div className="flex items-center gap-3">
            <Link href={`/creator/${story.creator?.username}`}>
              <Avatar
                src={story.creator?.avatar_url}
                name={story.creator?.display_name || ""}
                size="lg"
              />
            </Link>
            <div>
              <Link
                href={`/creator/${story.creator?.username}`}
                className="font-semibold hover:text-accent transition-colors"
              >
                {story.creator?.display_name}
              </Link>
              <p className="text-sm text-muted">
                @{story.creator?.username}
                {story.creator?.is_verified && (
                  <span className="ml-1 text-accent" title="Verified">
                    &#10003;
                  </span>
                )}
              </p>
            </div>
            {story.creator && (
              <FollowButton creatorId={story.creator.id} creatorName={story.creator.display_name} />
            )}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Eye size={16} />
              {formatNumber(story.view_count)} views
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle size={16} />
              {formatNumber(story.comment_count)} comments
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign size={16} />
              {formatNumber(story.tip_total)} in tips
            </span>
            <span className="flex items-center gap-1.5">
              <Hash size={16} />
              {formatNumber(story.word_count)} words
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={16} />
              {estimateReadingTime(story.word_count)}
            </span>
          </div>

          {/* Tags */}
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {story.tags.map((tag) => (
                <Badge key={tag.id} variant="default">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {firstPublishedChapter && (
              <Link href={`/story/${story.slug}/${firstPublishedChapter.chapter_number}`}>
                <Button size="lg">
                  <BookOpen size={18} />
                  Start Reading
                </Button>
              </Link>
            )}

            {story.is_gated && story.price > 0 && (
              <SubscribeButton
                targetType="story"
                targetName={story.title}
                price={story.price}
                storyId={story.id}
                creatorId={story.creator_id}
              />
            )}

            {story.is_gated && story.creator && (
              <SubscribeButton
                targetType="creator"
                targetName={story.creator.display_name}
                price={story.creator.subscription_price || 9.99}
                creatorId={story.creator_id}
              />
            )}

            <TipButton
              creatorName={story.creator?.display_name || ""}
              storyTitle={story.title}
            />

            {/* Social share buttons */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-surface-hover"
                title="Share on X"
              >
                <TwitterIcon className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-surface-hover"
                title="Share on Reddit"
              >
                <RedditIcon className="w-4 h-4" />
              </button>
              <ShareButton title={story.title} />
              <button
                className="p-2 text-muted hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-surface-hover"
                title="Bookmark"
              >
                <BookMarked size={16} />
              </button>
              <ReportButton targetType="story" targetId={story.id} />
            </div>
          </div>
        </section>

        {/* ---- Chapter list ---- */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen size={20} className="text-accent" />
            Chapters
            <span className="text-sm text-muted font-normal">
              ({story.published_chapter_count} of {story.chapter_count})
            </span>
          </h2>

          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
            {chapters.map((ch) => {
              const isPublished = ch.status === "published";
              const isScheduled = ch.status === "scheduled";
              const isDraft = ch.status === "draft";
              const FREE_PREVIEW_CHAPTERS = 1;
              const isLocked = story.is_gated && ch.chapter_number > FREE_PREVIEW_CHAPTERS && !unlocked;

              return (
                <div key={ch.id}>
                  {isPublished ? (
                    <Link
                      href={`/story/${story.slug}/${ch.chapter_number}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors group"
                    >
                      <span className="text-sm font-medium text-muted w-8 shrink-0">
                        {ch.chapter_number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium group-hover:text-accent transition-colors">
                          {ch.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isLocked && (
                          <Lock size={14} className="text-accent" />
                        )}
                        <Badge variant="success" className="text-[10px]">
                          Published
                        </Badge>
                        <ChevronRight
                          size={16}
                          className="text-muted group-hover:text-accent transition-colors"
                        />
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3 opacity-60">
                      <span className="text-sm font-medium text-muted w-8 shrink-0">
                        {ch.chapter_number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{ch.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isScheduled && ch.publish_at && (
                          <span className="text-xs text-muted flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(ch.publish_at)}
                          </span>
                        )}
                        {isScheduled && (
                          <Badge variant="accent" className="text-[10px]">
                            Scheduled
                          </Badge>
                        )}
                        {isDraft && (
                          <Badge variant="outline" className="text-[10px]">
                            Draft
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ---- Comments section ---- */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle size={20} className="text-accent" />
            Comments
            <span className="text-sm text-muted font-normal">
              ({comments.length})
            </span>
          </h2>

          {/* Comment form */}
          {isAuthenticated && user ? (
            <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Avatar
                  src={user.avatar_url}
                  name={user.display_name || ""}
                  size="sm"
                />
                <span className="text-sm font-medium">{user.display_name}</span>
              </div>
              <Textarea
                placeholder="Share your thoughts on this story..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={!commentBody.trim() || submittingComment}
                  onClick={async () => {
                    if (!commentBody.trim() || !story || !user) return;
                    setSubmittingComment(true);
                    try {
                      const newComment = await addComment({
                        story_id: story.id,
                        user_id: user.id,
                        body: commentBody.trim(),
                      });
                      if (newComment) {
                        setComments((prev) => [newComment as Comment, ...prev]);
                        setCommentBody("");
                        toast("success", "Comment posted");
                        // Notify story creator of new comment
                        if (story.creator_id !== user.id) {
                          createNotification({
                            user_id: story.creator_id,
                            type: "new_comment",
                            title: "New comment",
                            body: `${user.display_name} commented on "${story.title}"`,
                            link: `/story/${story.slug}`,
                          }).catch(() => {});
                        }
                      }
                    } catch {
                      // Silently handle errors
                    } finally {
                      setSubmittingComment(false);
                    }
                  }}
                >
                  {submittingComment ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-1" />
                      Posting...
                    </>
                  ) : (
                    "Post Comment"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-6 text-center space-y-2">
              <p className="text-muted text-sm">
                Log in to comment on this story.
              </p>
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Log in to comment
                </Button>
              </Link>
            </div>
          )}

          {/* Comment list */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-surface border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={comment.user?.avatar_url}
                    name={comment.user?.display_name || ""}
                    size="sm"
                  />
                  <div>
                    <span className="text-sm font-medium">
                      {comment.user?.display_name}
                    </span>
                    <span className="text-xs text-muted ml-2">
                      {formatRelativeDate(comment.created_at)}
                    </span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {comment.body}
                </p>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-center text-muted py-8">
                No comments yet. Be the first to share your thoughts.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
