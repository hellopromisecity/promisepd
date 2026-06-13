/** Gallery data — drives the /gallery page (ছবি + ভিডিও tabs).
 *
 *  Images are curated here by the marketing team: drop the optimised
 *  WebP into /public, add a row below with a Bangla caption.  Newest
 *  first — the page paginates 12 per page.
 *
 *  Videos are NOT listed here — they're fetched live from the Promise
 *  City YouTube channel's public RSS feed by the route handler at
 *  /api/gallery/videos (no API key needed).  See YOUTUBE below. */

export type GalleryImage = {
  /** Path under /public — must already be an optimised WebP. */
  src: string;
  /** Bangla caption / title shown on the card + lightbox. */
  title: string;
};

/** Promise City's YouTube channel — single source of truth.
 *  channelId resolved from the @PromiseCity handle; the RSS feed
 *  (videos.xml?channel_id=…) returns the latest uploads without an
 *  API key. */
export const YOUTUBE = {
  handle: "@PromiseCity",
  channelId: "UCsYHlbSPh8yFSlZEUzFOe5w",
  channelUrl: "https://www.youtube.com/@PromiseCity",
  rssUrl:
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCsYHlbSPh8yFSlZEUzFOe5w",
};

/** How many items per page in each tab. */
export const GALLERY_PAGE_SIZE = 12;

/** Curated project photos — ordered project-by-project: আহবাব প্যালেস
 *  ০১ → ০২ → ফুজালা টাওয়ার → ফুজালা কমপ্লেক্স, then the wider brand /
 *  travels shots.  Add new rows in the right project's block. */
export const GALLERY_IMAGES: GalleryImage[] = [
  // আহবাব প্যালেস ০১
  { src: "/ahbab1pics/ahbab1pics.webp", title: "আহবাব প্যালেস ০১ — ফ্ল্যাগশিপ প্রকল্প" },
  // আহবাব প্যালেস ০২
  { src: "/ahbab2pics/ahbab2pics.webp", title: "আহবাব প্যালেস ০২ — আবাসিক ভবন" },
  // ফুজালা টাওয়ার
  { src: "/ftpics/ftt1.webp", title: "ফুজালা টাওয়ার — সম্মুখ দৃশ্য" },
  { src: "/ftpics/ft.webp", title: "ফুজালা টাওয়ার — নির্মাণ অগ্রগতি" },
  { src: "/ftpics/fuzala-2-0.webp", title: "ফুজালা টাওয়ার — স্থাপত্য নকশা" },
  // ফুজালা কমপ্লেক্স
  { src: "/fcpics/fc1.webp", title: "ফুজালা কমপ্লেক্স — প্রকল্প দৃশ্য" },
  { src: "/fcpics/fc2.webp", title: "ফুজালা কমপ্লেক্স — ভবন কাঠামো" },
  { src: "/fcpics/fc3.webp", title: "ফুজালা কমপ্লেক্স — আবাসিক ব্লক" },
  { src: "/fcpics/f4.webp", title: "ফুজালা কমপ্লেক্স — চারপাশের পরিবেশ" },
  // ব্র্যান্ড ও ট্রাভেলস
  { src: "/promisecity.webp", title: "প্রমিস সিটি — স্বপ্নের ঠিকানা" },
  { src: "/ahbab.webp", title: "আহবাব রিয়েল এস্টেট — নির্মাণ সমাধান" },
  { src: "/kaaba.webp", title: "আহবাব ট্রাভেলস — পবিত্র উমরাহ যাত্রা" },
  { src: "/madina.webp", title: "আহবাব ট্রাভেলস — মদিনা মুনাওয়ারা" },
  { src: "/tour.webp", title: "আহবাব ট্রাভেলস — বিদেশ ট্যুর" },
];

/** Video shape returned by /api/gallery/videos. */
export type GalleryVideo = {
  /** YouTube video id (the `v=` param). */
  id: string;
  title: string;
  /** ISO publish date. */
  published: string;
  /** hqdefault thumbnail URL. */
  thumbnail: string;
};
