const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://erovel.com";

function layout(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#0c0a09;color:#f5f0eb;font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
        <div style="text-align:center;margin-bottom:32px;">
          <span style="font-size:24px;font-weight:bold;color:#d4a574;">Erovel</span>
        </div>
        ${content}
        <div style="margin-top:40px;padding-top:20px;border-top:1px solid #3d3530;text-align:center;">
          <p style="font-size:12px;color:#a8a29e;margin:0;">
            Erovel &middot; <a href="${BASE_URL}/settings" style="color:#d4a574;text-decoration:none;">Manage notifications</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function newFollowerEmail(followerName: string, profileUrl: string): { subject: string; html: string } {
  return {
    subject: `${followerName} started following you on Erovel`,
    html: layout(`
      <h2 style="font-size:20px;margin:0 0 16px;">New Follower</h2>
      <p style="color:#a8a29e;line-height:1.6;">
        <strong style="color:#f5f0eb;">${followerName}</strong> started following you.
        They'll be notified when you publish new chapters.
      </p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${profileUrl}" style="display:inline-block;padding:12px 24px;background:#d4a574;color:#0c0a09;text-decoration:none;border-radius:8px;font-weight:600;">
          View Profile
        </a>
      </div>
    `),
  };
}

export function newCommentEmail(commenterName: string, storyTitle: string, storyUrl: string, commentBody: string): { subject: string; html: string } {
  return {
    subject: `New comment on "${storyTitle}"`,
    html: layout(`
      <h2 style="font-size:20px;margin:0 0 16px;">New Comment</h2>
      <p style="color:#a8a29e;line-height:1.6;">
        <strong style="color:#f5f0eb;">${commenterName}</strong> commented on
        <strong style="color:#f5f0eb;">${storyTitle}</strong>:
      </p>
      <div style="background:#1c1917;border-radius:8px;padding:16px;margin:16px 0;color:#f5f0eb;font-size:14px;line-height:1.6;">
        ${commentBody.slice(0, 300)}${commentBody.length > 300 ? "..." : ""}
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${storyUrl}" style="display:inline-block;padding:12px 24px;background:#d4a574;color:#0c0a09;text-decoration:none;border-radius:8px;font-weight:600;">
          View Comment
        </a>
      </div>
    `),
  };
}

export function tipReceivedEmail(tipperName: string, amount: string, storyTitle: string | null): { subject: string; html: string } {
  return {
    subject: `You received a ${amount} tip on Erovel`,
    html: layout(`
      <h2 style="font-size:20px;margin:0 0 16px;">Tip Received!</h2>
      <p style="color:#a8a29e;line-height:1.6;">
        <strong style="color:#f5f0eb;">${tipperName}</strong> sent you a
        <strong style="color:#d4a574;">${amount}</strong> tip${storyTitle ? ` on "${storyTitle}"` : ""}.
      </p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${BASE_URL}/dashboard/earnings" style="display:inline-block;padding:12px 24px;background:#d4a574;color:#0c0a09;text-decoration:none;border-radius:8px;font-weight:600;">
          View Earnings
        </a>
      </div>
    `),
  };
}

export function newChapterEmail(creatorName: string, storyTitle: string, chapterTitle: string, storyUrl: string): { subject: string; html: string } {
  return {
    subject: `${creatorName} published a new chapter: ${chapterTitle}`,
    html: layout(`
      <h2 style="font-size:20px;margin:0 0 16px;">New Chapter</h2>
      <p style="color:#a8a29e;line-height:1.6;">
        <strong style="color:#f5f0eb;">${creatorName}</strong> published a new chapter in
        <strong style="color:#f5f0eb;">${storyTitle}</strong>:
      </p>
      <p style="font-size:18px;color:#f5f0eb;margin:16px 0;">
        ${chapterTitle}
      </p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${storyUrl}" style="display:inline-block;padding:12px 24px;background:#d4a574;color:#0c0a09;text-decoration:none;border-radius:8px;font-weight:600;">
          Read Now
        </a>
      </div>
    `),
  };
}

export function welcomeEmail(displayName: string): { subject: string; html: string } {
  return {
    subject: `Welcome to Erovel, ${displayName}!`,
    html: layout(`
      <h2 style="font-size:20px;margin:0 0 16px;">Welcome to Erovel!</h2>
      <p style="color:#a8a29e;line-height:1.6;">
        Hi <strong style="color:#f5f0eb;">${displayName}</strong>, thanks for joining Erovel.
        You're now part of a growing community of adult fiction creators and readers.
      </p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${BASE_URL}/browse" style="display:inline-block;padding:12px 24px;background:#d4a574;color:#0c0a09;text-decoration:none;border-radius:8px;font-weight:600;">
          Start Exploring
        </a>
      </div>
    `),
  };
}
