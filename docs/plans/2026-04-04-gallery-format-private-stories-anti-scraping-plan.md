# Gallery Format, Private Stories & Anti-Scraping - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add gallery display format, unlisted/password-protected stories, and anti-scraping via signed CDN URLs.

**Architecture:** New 'gallery' story format with simple vertical image display. Story visibility column for unlisted support with optional password. BunnyCDN signed URLs with 4-hour expiry served through a server-side content API.

**Tech Stack:** Next.js, Supabase (migrations + RLS), BunnyCDN token auth, crypto for hashing

---

## Tasks

### Task 1: Database migration
### Task 2: Gallery reader component
### Task 3: Update types and format options across UI
### Task 4: Unlisted + password-protected stories
### Task 5: Signed CDN URLs + server-side content API
### Task 6: Build and deploy
