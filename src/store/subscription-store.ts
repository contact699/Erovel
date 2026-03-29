import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SubscriptionState {
  /** List of "creator:<id>" or "story:<id>" strings */
  subscriptions: string[];
  subscribe: (targetType: "creator" | "story", targetId: string) => void;
  unsubscribe: (targetType: "creator" | "story", targetId: string) => void;
  isSubscribed: (targetType: "creator" | "story", targetId: string) => boolean;
  /** Returns true if the user has a story subscription for storyId OR a creator subscription for creatorId */
  isContentUnlocked: (storyId: string, creatorId: string) => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptions: [],

      subscribe: (targetType, targetId) => {
        const key = `${targetType}:${targetId}`;
        set((state) => {
          if (state.subscriptions.includes(key)) return state;
          return { subscriptions: [...state.subscriptions, key] };
        });
      },

      unsubscribe: (targetType, targetId) => {
        const key = `${targetType}:${targetId}`;
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s !== key),
        }));
      },

      isSubscribed: (targetType, targetId) => {
        const key = `${targetType}:${targetId}`;
        return get().subscriptions.includes(key);
      },

      isContentUnlocked: (storyId, creatorId) => {
        const subs = get().subscriptions;
        return (
          subs.includes(`story:${storyId}`) ||
          subs.includes(`creator:${creatorId}`)
        );
      },
    }),
    { name: "erovel-subscriptions" }
  )
);
