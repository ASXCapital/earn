const FEED_URL = 'https://api.paragraph.com/blogs/rss/%40asx';
export const UPDATES_FEED_URL = FEED_URL;

export interface Article {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
  content?: string;
  guid?: string;
  image?: string;
}

function decodeEntities(str: string) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function clean(raw?: string) {
  if (!raw) return undefined;
  return decodeEntities(raw.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim());
}

export function parseRss(xml: string): Article[] {
  const items: Article[] = [];
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  for (const itemXml of itemMatches) {
    const grab = (tag: string) => {
      const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const m = itemXml.match(r);
      return clean(m?.[1]);
    };
    const enclosure = (() => {
      const m = itemXml.match(/<enclosure[^>]*url="([^"]+)"/i);
      return m ? m[1] : undefined;
    })();
    items.push({
      title: grab('title') || 'Untitled',
      link: grab('link') || '#',
      pubDate: grab('pubDate'),
      description: grab('description'),
      content: grab('content:encoded'),
      guid: grab('guid'),
      image: enclosure
    });
  }
  return items;
}

export function stripHtml(html?: string) {
  if (!html) return '';
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

export function formatRssDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
