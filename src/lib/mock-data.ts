import type {
  Profile,
  Story,
  Chapter,
  Comment,
  Category,
  Tag,
  Tip,
  EarningsSummary,
  StoryAnalytics,
  ChatContent,
  ChatCharacter,
  ChatMessage,
  Report,
  Payout,
  Bookmark,
} from "./types";
import { CATEGORIES } from "./constants";

// ── Profiles ──

export const mockCreator: Profile = {
  id: "creator-1",
  username: "velvetpen",
  display_name: "Velvet Pen",
  bio: "Writing stories that keep you up at night. Romance, fantasy, and everything in between.",
  avatar_url: null,
  role: "creator",
  is_verified: true,
  follower_count: 1243,
  story_count: 12,
  subscription_price: 9.99,
  notify_new_follower: true,
  notify_tips: true,
  notify_comments: true,
  notify_new_chapters: true,
  created_at: "2025-06-15T00:00:00Z",
};

export const mockCreator2: Profile = {
  id: "creator-2",
  username: "midnightink",
  display_name: "Midnight Ink",
  bio: "Chat-style storyteller. Every message is a thrill.",
  avatar_url: null,
  role: "creator",
  is_verified: true,
  follower_count: 856,
  story_count: 8,
  subscription_price: 14.99,
  notify_new_follower: true,
  notify_tips: true,
  notify_comments: true,
  notify_new_chapters: true,
  created_at: "2025-08-01T00:00:00Z",
};

export const mockCreator3: Profile = {
  id: "creator-3",
  username: "scarletquill",
  display_name: "Scarlet Quill",
  bio: "Fantasy erotica with world-building that goes deep. Series writer.",
  avatar_url: null,
  role: "creator",
  is_verified: true,
  follower_count: 2104,
  story_count: 5,
  subscription_price: 12.99,
  notify_new_follower: true,
  notify_tips: true,
  notify_comments: true,
  notify_new_chapters: true,
  created_at: "2025-05-20T00:00:00Z",
};

export const mockReader: Profile = {
  id: "reader-1",
  username: "bookworm42",
  display_name: "Bookworm",
  bio: "",
  avatar_url: null,
  role: "reader",
  is_verified: false,
  follower_count: 0,
  story_count: 0,
  subscription_price: 9.99,
  notify_new_follower: true,
  notify_tips: true,
  notify_comments: true,
  notify_new_chapters: true,
  created_at: "2025-09-01T00:00:00Z",
};

export const mockProfiles: Profile[] = [mockCreator, mockCreator2, mockCreator3];

// ── Categories with counts ──

export const mockCategories: Category[] = CATEGORIES.map((c, index) => ({
  ...c,
  story_count: (index + 1) * 27,
}));

// ── Tags ──

export const mockTags: Tag[] = [
  { id: "t1", name: "slow burn", slug: "slow-burn" },
  { id: "t2", name: "enemies to lovers", slug: "enemies-to-lovers" },
  { id: "t3", name: "friends with benefits", slug: "friends-with-benefits" },
  { id: "t4", name: "one night stand", slug: "one-night-stand" },
  { id: "t5", name: "forbidden", slug: "forbidden" },
  { id: "t6", name: "workplace", slug: "workplace" },
  { id: "t7", name: "vacation", slug: "vacation" },
  { id: "t8", name: "reunion", slug: "reunion" },
  { id: "t9", name: "strangers", slug: "strangers" },
  { id: "t10", name: "second chance", slug: "second-chance" },
];

// ── Stories ──

export const mockStories: Story[] = [
  {
    id: "story-1",
    creator_id: "creator-1",
    creator: mockCreator,
    title: "The Arrangement",
    slug: "the-arrangement",
    description:
      "What starts as a simple arrangement between two professionals quickly becomes something neither of them can control. A slow burn that builds chapter by chapter.",
    cover_image_url: null,
    format: "prose",
    category_id: "romance",
    category: mockCategories[0],
    tags: [mockTags[0], mockTags[5]],
    status: "published",
    is_gated: true,
    price: 4.99,
    chapter_count: 12,
    published_chapter_count: 8,
    view_count: 15420,
    tip_total: 342,
    comment_count: 89,
    word_count: 48000,
    created_at: "2025-11-01T00:00:00Z",
    updated_at: "2026-03-15T00:00:00Z",
  },
  {
    id: "story-2",
    creator_id: "creator-2",
    creator: mockCreator2,
    title: "Late Night Texts",
    slug: "late-night-texts",
    description:
      "A chat-style story told entirely through text messages between two people who matched online. Every message raises the temperature.",
    cover_image_url: null,
    format: "chat",
    category_id: "romance",
    category: mockCategories[0],
    tags: [mockTags[8], mockTags[3]],
    status: "published",
    is_gated: false,
    price: 0,
    chapter_count: 6,
    published_chapter_count: 6,
    view_count: 23100,
    tip_total: 567,
    comment_count: 134,
    word_count: 12000,
    created_at: "2025-12-10T00:00:00Z",
    updated_at: "2026-02-20T00:00:00Z",
  },
  {
    id: "story-3",
    creator_id: "creator-3",
    creator: mockCreator3,
    title: "The Enchantress of Thornwood",
    slug: "the-enchantress-of-thornwood",
    description:
      "In a kingdom where magic is forbidden, a rogue enchantress takes on an unlikely apprentice. Fantasy erotica with rich world-building and a slow-burning romance.",
    cover_image_url: null,
    format: "prose",
    category_id: "fantasy",
    category: mockCategories[1],
    tags: [mockTags[0], mockTags[4]],
    status: "published",
    is_gated: true,
    price: 6.99,
    chapter_count: 20,
    published_chapter_count: 14,
    view_count: 31200,
    tip_total: 890,
    comment_count: 256,
    word_count: 95000,
    created_at: "2025-09-01T00:00:00Z",
    updated_at: "2026-03-25T00:00:00Z",
  },
  {
    id: "story-4",
    creator_id: "creator-1",
    creator: mockCreator,
    title: "Room 804",
    slug: "room-804",
    description:
      "A hotel room. Two strangers. One unforgettable night told from both perspectives.",
    cover_image_url: null,
    format: "prose",
    category_id: "romance",
    category: mockCategories[0],
    tags: [mockTags[8], mockTags[3]],
    status: "published",
    is_gated: false,
    price: 0,
    chapter_count: 3,
    published_chapter_count: 3,
    view_count: 8900,
    tip_total: 156,
    comment_count: 42,
    word_count: 9500,
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
  },
  {
    id: "story-5",
    creator_id: "creator-2",
    creator: mockCreator2,
    title: "The Confession Thread",
    slug: "the-confession-thread",
    description:
      "A group chat where friends dare each other to share their most intimate secrets. Chat-style with images that escalate with every chapter.",
    cover_image_url: null,
    format: "chat",
    category_id: "group",
    category: mockCategories[5],
    tags: [mockTags[2], mockTags[6]],
    status: "published",
    is_gated: true,
    price: 3.99,
    chapter_count: 8,
    published_chapter_count: 5,
    view_count: 19800,
    tip_total: 423,
    comment_count: 178,
    word_count: 16000,
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-03-20T00:00:00Z",
  },
  {
    id: "story-6",
    creator_id: "creator-3",
    creator: mockCreator3,
    title: "After Hours",
    slug: "after-hours",
    description:
      "When the office empties out, the real work begins. A workplace romance that breaks every rule in the employee handbook.",
    cover_image_url: null,
    format: "prose",
    category_id: "romance",
    category: mockCategories[0],
    tags: [mockTags[5], mockTags[4]],
    status: "published",
    is_gated: false,
    price: 0,
    chapter_count: 5,
    published_chapter_count: 5,
    view_count: 12300,
    tip_total: 234,
    comment_count: 67,
    word_count: 22000,
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
];

// ── Chapters ──

export const mockChapters: Chapter[] = [
  { id: "ch-1", story_id: "story-1", chapter_number: 1, title: "The Proposal", status: "published", publish_at: null, created_at: "2025-11-01T00:00:00Z" },
  { id: "ch-2", story_id: "story-1", chapter_number: 2, title: "Ground Rules", status: "published", publish_at: null, created_at: "2025-11-04T00:00:00Z" },
  { id: "ch-3", story_id: "story-1", chapter_number: 3, title: "First Meeting", status: "published", publish_at: null, created_at: "2025-11-07T00:00:00Z" },
  { id: "ch-4", story_id: "story-1", chapter_number: 4, title: "Crossing Lines", status: "published", publish_at: null, created_at: "2025-11-10T00:00:00Z" },
  { id: "ch-5", story_id: "story-1", chapter_number: 5, title: "The Gala", status: "published", publish_at: null, created_at: "2025-11-13T00:00:00Z" },
  { id: "ch-6", story_id: "story-1", chapter_number: 6, title: "Unraveling", status: "published", publish_at: null, created_at: "2025-11-16T00:00:00Z" },
  { id: "ch-7", story_id: "story-1", chapter_number: 7, title: "The Truth", status: "published", publish_at: null, created_at: "2025-11-19T00:00:00Z" },
  { id: "ch-8", story_id: "story-1", chapter_number: 8, title: "Breaking Point", status: "published", publish_at: null, created_at: "2025-11-22T00:00:00Z" },
  { id: "ch-9", story_id: "story-1", chapter_number: 9, title: "Aftermath", status: "scheduled", publish_at: "2026-04-01T00:00:00Z", created_at: "2025-11-25T00:00:00Z" },
  { id: "ch-10", story_id: "story-1", chapter_number: 10, title: "Reunion", status: "scheduled", publish_at: "2026-04-04T00:00:00Z", created_at: "2025-11-28T00:00:00Z" },
  { id: "ch-11", story_id: "story-1", chapter_number: 11, title: "Surrender", status: "draft", publish_at: null, created_at: "2025-12-01T00:00:00Z" },
  { id: "ch-12", story_id: "story-1", chapter_number: 12, title: "Ever After", status: "draft", publish_at: null, created_at: "2025-12-04T00:00:00Z" },
];

// ── Chat content example ──

const chatCharacters: ChatCharacter[] = [
  { id: "char-1", name: "Alex", avatar_url: null, color: "#3B82F6", alignment: "right" },
  { id: "char-2", name: "Jordan", avatar_url: null, color: "#EC4899", alignment: "left" },
];

const chatMessages: ChatMessage[] = [
  { id: "msg-1", character_id: "char-2", text: "Hey, are you still up?", media_url: null, media_type: null, order: 1 },
  { id: "msg-2", character_id: "char-1", text: "Yeah, can't sleep. What's up?", media_url: null, media_type: null, order: 2 },
  { id: "msg-3", character_id: "char-2", text: "Same. I keep thinking about earlier today...", media_url: null, media_type: null, order: 3 },
  { id: "msg-4", character_id: "char-1", text: "At the coffee shop?", media_url: null, media_type: null, order: 4 },
  { id: "msg-5", character_id: "char-2", text: "You know exactly what I'm talking about", media_url: null, media_type: null, order: 5 },
  { id: "msg-6", character_id: "char-1", text: "Maybe I do. Maybe I want to hear you say it.", media_url: null, media_type: null, order: 6 },
  { id: "msg-7", character_id: "char-2", text: "When you leaned in close to grab the sugar... I could smell your cologne. I forgot what I was saying mid-sentence.", media_url: null, media_type: null, order: 7 },
  { id: "msg-8", character_id: "char-1", text: "I noticed. You turned red.", media_url: null, media_type: null, order: 8 },
  { id: "msg-9", character_id: "char-2", text: "Shut up 😏", media_url: null, media_type: null, order: 9 },
  { id: "msg-10", character_id: "char-1", text: "Make me.", media_url: null, media_type: null, order: 10 },
];

export const mockChatContent: ChatContent = {
  type: "chat",
  characters: chatCharacters,
  messages: chatMessages,
};

// ── Comments ──

export const mockComments: Comment[] = [
  {
    id: "comment-1",
    story_id: "story-1",
    chapter_id: "ch-1",
    user_id: "reader-1",
    user: mockReader,
    body: "This is incredible writing. The tension between them is palpable from the very first paragraph.",
    created_at: "2026-03-16T14:30:00Z",
  },
  {
    id: "comment-2",
    story_id: "story-1",
    chapter_id: "ch-1",
    user_id: "creator-2",
    user: mockCreator2,
    body: "Absolutely hooked. When's the next chapter dropping?",
    created_at: "2026-03-17T09:15:00Z",
  },
  {
    id: "comment-3",
    story_id: "story-1",
    chapter_id: "ch-4",
    user_id: "reader-1",
    user: mockReader,
    body: "Chapter 4 was EVERYTHING. The way you write dialogue is unreal.",
    created_at: "2026-03-20T22:00:00Z",
  },
];

// ── Tips ──

export const mockTips: Tip[] = [
  { id: "tip-1", reader_id: "reader-1", reader: mockReader, creator_id: "creator-1", story_id: "story-1", story: mockStories[0], amount: 5, currency: "USD", created_at: "2026-03-20T10:00:00Z" },
  { id: "tip-2", reader_id: "reader-1", reader: mockReader, creator_id: "creator-1", story_id: "story-4", story: mockStories[3], amount: 10, currency: "USD", created_at: "2026-03-22T15:00:00Z" },
  { id: "tip-3", reader_id: "reader-1", reader: mockReader, creator_id: "creator-2", story_id: "story-2", story: mockStories[1], amount: 2, currency: "USD", created_at: "2026-03-25T08:00:00Z" },
];

// ── Earnings ──

export const mockEarnings: EarningsSummary = {
  total_earnings: 2340,
  pending_payout: 456,
  tips_this_month: 342,
  subscriptions_this_month: 890,
  subscriber_count: 67,
};

// ── Story Analytics ──

export const mockStoryAnalytics: StoryAnalytics[] = [
  { story_id: "story-1", views: 15420, unique_readers: 8900, tips: 45, tip_amount: 342, comments: 89, bookmarks: 234 },
  { story_id: "story-4", views: 8900, unique_readers: 5200, tips: 22, tip_amount: 156, comments: 42, bookmarks: 89 },
];

// ── Bookmarks ──

export const mockBookmarks: Bookmark[] = [
  { user_id: "reader-1", story_id: "story-1", story: mockStories[0], last_read_chapter_id: "ch-4", created_at: "2026-03-10T00:00:00Z" },
  { user_id: "reader-1", story_id: "story-3", story: mockStories[2], last_read_chapter_id: null, created_at: "2026-03-20T00:00:00Z" },
];

// ── Payouts ──

export const mockPayouts: Payout[] = [
  { id: "payout-1", creator_id: "creator-1", amount: 500, method: "paxum", status: "completed", processed_at: "2026-02-15T00:00:00Z", created_at: "2026-02-14T00:00:00Z" },
  { id: "payout-2", creator_id: "creator-1", amount: 350, method: "paxum", status: "completed", processed_at: "2026-03-15T00:00:00Z", created_at: "2026-03-14T00:00:00Z" },
  { id: "payout-3", creator_id: "creator-1", amount: 456, method: "paxum", status: "pending", processed_at: null, created_at: "2026-03-28T00:00:00Z" },
];

// ── Reports ──

export const mockReports: Report[] = [
  { id: "report-1", reporter_id: "reader-1", reporter: mockReader, target_type: "story", target_id: "story-5", reason: "Potential copyright infringement on embedded images", status: "pending", created_at: "2026-03-27T00:00:00Z" },
  { id: "report-2", reporter_id: "creator-2", reporter: mockCreator2, target_type: "comment", target_id: "comment-3", reason: "Spam/advertising", status: "pending", created_at: "2026-03-28T00:00:00Z" },
];
