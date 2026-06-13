import { NextResponse } from "next/server";
import { YOUTUBE, type GalleryVideo } from "@/lib/gallery";

/** Live feed of the Promise City YouTube channel's latest uploads.
 *
 *  Fetches the channel's public Atom RSS feed (no API key required)
 *  server-side, parses the entries, and returns clean JSON for the
 *  /gallery "ভিডিও" tab.  ISR-cached for an hour so we don't hammer
 *  YouTube on every visit, while still picking up new uploads within
 *  the hour.
 *
 *  Note: YouTube's RSS feed returns at most the ~15 most-recent
 *  uploads.  That's plenty for the gallery's pagination today; if the
 *  channel grows past that and the team wants the full back-catalogue,
 *  swap this for the YouTube Data API (needs a key). */

export const revalidate = 3600; // seconds

/** Pull the first capture group of `re` out of `xml`, or "" if absent. */
function pick(xml: string, re: RegExp): string {
  const m = xml.match(re);
  return m ? m[1] : "";
}

/** Minimal XML entity decode for titles (&amp; &lt; &gt; &quot; &#39;). */
function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function GET() {
  try {
    const res = await fetch(YOUTUBE.rssUrl, {
      next: { revalidate },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PromisePPD/1.0)" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { videos: [], error: `feed responded ${res.status}` },
        { status: 200 },
      );
    }

    const xml = await res.text();

    // Each upload is one <entry>…</entry>.  Split on the closing tag so
    // the channel-level <title> at the top of the feed is never parsed
    // as a video.
    const entries = xml.split("<entry>").slice(1);

    const videos: GalleryVideo[] = entries
      .map((entry) => {
        const id = pick(entry, /<yt:videoId>([^<]+)<\/yt:videoId>/);
        const title = decode(pick(entry, /<title>([^<]*)<\/title>/));
        const published = pick(entry, /<published>([^<]+)<\/published>/);
        return {
          id,
          title,
          published,
          thumbnail: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "",
        };
      })
      .filter((v) => v.id);

    return NextResponse.json(
      { videos, channelUrl: YOUTUBE.channelUrl },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { videos: [], error: "failed to load feed" },
      { status: 200 },
    );
  }
}
