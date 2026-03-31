import type { MetadataRoute } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://erovel.com";

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/dmca`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const supabase = await createServerSupabaseClient();
  if (supabase) {
    // Add published stories
    const { data: stories } = await supabase
      .from("stories")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(1000);

    if (stories) {
      for (const story of stories) {
        routes.push({
          url: `${baseUrl}/story/${story.slug}`,
          lastModified: new Date(story.updated_at),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }

    // Add creator profiles
    const { data: creators } = await supabase
      .from("profiles")
      .select("username, updated_at")
      .eq("role", "creator")
      .order("updated_at", { ascending: false })
      .limit(500);

    if (creators) {
      for (const creator of creators) {
        routes.push({
          url: `${baseUrl}/creator/${creator.username}`,
          lastModified: new Date(creator.updated_at),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }

    // Add category pages
    const { data: categories } = await supabase
      .from("categories")
      .select("slug");

    if (categories) {
      for (const cat of categories) {
        routes.push({
          url: `${baseUrl}/browse/${cat.slug}`,
          changeFrequency: "daily",
          priority: 0.6,
        });
      }
    }
  }

  return routes;
}
