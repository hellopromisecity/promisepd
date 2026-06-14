/** Turn standalone YouTube / Facebook video links in admin-authored
 *  article HTML into responsive embedded players.
 *
 *  The TipTap editor stores a pasted video URL as a plain
 *  `<p><a href="…">…</a></p>`.  On the public article we swap any such
 *  *standalone* video paragraph for an `<iframe>` so the video plays
 *  inline.  Inline links inside a sentence are left untouched. */

/** YouTube watch / share / embed / shorts / live → 11-char video id. */
function youtubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function isFacebookVideo(url: string): boolean {
  return /(?:facebook\.com\/(?:reel\/|watch\/?\?|[^/]+\/videos\/)|fb\.watch\/)/i.test(url);
}

function youtubeEmbed(id: string): string {
  // youtube-nocookie: no tracking cookie until the visitor hits play.
  return (
    `<div class="video-embed video-embed--landscape">` +
    `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video player" loading="lazy" frameborder="0" ` +
    `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>` +
    `</div>`
  );
}

function facebookEmbed(url: string): string {
  const portrait = /\/reel\//i.test(url);
  const orientation = portrait ? "video-embed--portrait" : "video-embed--landscape";
  const href = encodeURIComponent(url);
  return (
    `<div class="video-embed ${orientation}">` +
    `<iframe src="https://www.facebook.com/plugins/video.php?href=${href}&show_text=false" title="Facebook video player" loading="lazy" frameborder="0" scrolling="no" ` +
    `allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>` +
    `</div>`
  );
}

/** Replace standalone YouTube/Facebook video paragraphs with embeds. */
export function embedVideoLinks(html: string): string {
  if (!html) return html;
  // A paragraph that contains ONLY a single anchor (the link text is the
  // URL) — that's a pasted, standalone video link.
  const standaloneLink = /<p\b[^>]*>\s*<a\b[^>]*\bhref="([^"]+)"[^>]*>[^<]*<\/a>\s*<\/p>/gi;
  return html.replace(standaloneLink, (whole, rawHref: string) => {
    const url = rawHref.replace(/&amp;/g, "&");
    const yt = youtubeId(url);
    if (yt) return youtubeEmbed(yt);
    if (isFacebookVideo(url)) return facebookEmbed(url);
    return whole; // not a recognised video link — leave it alone
  });
}
