import {
  type ScrapeStructuredResult,
  WebScraper,
} from "@danilidonbeltran/webscrapper";
import { parseRelativeDate } from "../../utils/date";
import type { Scraper } from "./Scraper";

type Post = {
  title: string | null;
  content: string;
  postedAt: Date | null;
};

type ScrapeResult = {
  posts: Post[];
};

export class ProtondbScraper implements Scraper {
  private scraper: WebScraper;

  constructor() {
    this.scraper = new WebScraper();
  }

  async scrape(gameId: number) {
    const url = `https://www.protondb.com/app/${gameId}?device=steamDeck`;
    const result = await this.scraper.scrapeTextStructured(url, {
      sectionSelector: ".for-anchor-tags",
    });

    return result;
  }

  close() {
    this.scraper.close();
  }

  static extractData(result: ScrapeStructuredResult): ScrapeResult {
    if (!result.sections) {
      return { posts: [] };
    }
    const post = result.sections.map((section) => {
        return {
          title: section.title,
          content: (section.paragraphs || []).join("\n\n"),
          postedAt: ProtondbScraper.findPostedDate(section.links || []),
        };
      });
    const cleanPosts = post.filter(p => p.content.trim() !== "");
    const sortedPosts = ProtondbScraper.sortByPostedAt(cleanPosts);
    return { posts: sortedPosts };
  }

  private static findPostedDate(links: { text: string }[]): Date | null {
    const dateLink = links.find((link) => link.text.includes("ago"));
    if (dateLink) {
      // Handle direct relative date format like "2 months ago"
      return parseRelativeDate(dateLink.text.trim());
    }
    return null;
  }

  private static sortByPostedAt(posts: Post[]): Post[] {
    return posts.sort((a, b) => {
      if (a.postedAt && b.postedAt) {
        return b.postedAt.getTime() - a.postedAt.getTime();
      } else if (a.postedAt) {
        return -1; // a comes first
      } else if (b.postedAt) {
        return 1; // b comes first
      } else {
        return 0; // maintain original order
      }
    });
  }
}
