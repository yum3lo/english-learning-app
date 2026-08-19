import axios from 'axios';
import { YoutubeTranscript } from 'youtube-transcript';
import { decodeHtmlEntities } from '../utils/text';

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails?: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
}

interface YouTubeVideoDetailsItem {
  id: string;
  snippet?: { description?: string };
  contentDetails: { duration: string };
}

interface YouTubeVideosResponse {
  items: YouTubeVideoDetailsItem[];
}

export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export interface FetchedTranscript {
  text: string;
  segments: TranscriptSegment[];
}

interface RawCaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // 'asr' marks an auto-generated track; manually-created tracks omit this
}

const CAPTIONS_INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
const CAPTIONS_USER_AGENT = 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)';

// same public endpoint the youtube-transcript package uses internally to list a video's
// available caption tracks, called directly here so we can choose *which* track to use
async function fetchCaptionTracks(videoId: string): Promise<RawCaptionTrack[] | undefined> {
  try {
    const response = await axios.post(
      CAPTIONS_INNERTUBE_URL,
      { context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } }, videoId },
      { headers: { 'Content-Type': 'application/json', 'User-Agent': CAPTIONS_USER_AGENT } }
    );
    return response.data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  } catch {
    return undefined;
  }
}

// a video can have both a channel-provided caption track and YouTube's auto-generated
// (ASR) one under the same language code - always prefer the human-made track, since
// it's reliably better punctuated/capitalized than the auto-generated alternative
function selectCaptionTrack(tracks: RawCaptionTrack[], languageCandidates: string[]): RawCaptionTrack | undefined {
  for (const lang of languageCandidates) {
    const manual = tracks.find(track => track.languageCode === lang && track.kind !== 'asr');
    if (manual) return manual;
  }
  for (const lang of languageCandidates) {
    const anyTrack = tracks.find(track => track.languageCode === lang);
    if (anyTrack) return anyTrack;
  }
  return undefined;
}

async function fetchTrackSegments(track: RawCaptionTrack): Promise<TranscriptSegment[]> {
  const trackUrl = new URL(track.baseUrl);
  if (!trackUrl.hostname.endsWith('.youtube.com')) return [];

  // json3 is a documented YouTube timedtext format - far simpler and more robust to
  // parse than the XML formats, since it's just { events: [{ tStartMs, dDurationMs, segs }] }
  trackUrl.searchParams.set('fmt', 'json3');
  const response = await axios.get(trackUrl.toString(), { headers: { 'User-Agent': CAPTIONS_USER_AGENT } });
  const events = response.data?.events as any[] | undefined;
  if (!Array.isArray(events)) return [];

  const segments: TranscriptSegment[] = [];
  for (const event of events) {
    if (!Array.isArray(event.segs)) continue;
    const text = decodeHtmlEntities(event.segs.map((seg: any) => seg.utf8 || '').join(''))
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;
    segments.push({
      start: (event.tStartMs ?? 0) / 1000,
      duration: (event.dDurationMs ?? 0) / 1000,
      text
    });
  }
  return segments;
}

export interface ProcessedVideo {
  title: string;
  url: string;
  thumbnailUrl?: string;
  source: string;
  description: string;
  categories: string[];
  publishedDate: Date;
  duration?: number;
}

class YouTubeAPI {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('YouTube API key not found in environment variables');
    }
  }

  private getCategorySearchTerms(category: string): string {
    const searchTerms: Record<string, string> = {
      'General': 'interesting facts explained',
      'Language': 'english learning lesson',
      'Economy': 'economics explained',
      'Environment': 'environment documentary',
      'Politics': 'politics explained',
      'Geography': 'geography documentary',
      'Fauna': 'wildlife documentary',
      'Flora': 'plants and nature documentary',
      'History': 'history documentary',
      'Cinema': 'film analysis video essay',
      'Literature': 'book review literature',
      'Sports': 'sports documentary',
      'Technology': 'technology explained',
      'Science': 'science documentary',
      'Art': 'art documentary',
      'Music': 'music documentary',
      'Food': 'food documentary',
      'Travel': 'travel documentary',
      'Health': 'health explained',
      'Culture': 'culture documentary'
    };

    return searchTerms[category] || 'english documentary';
  }

  private parseDuration(iso: string): number | undefined {
    const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!match) return undefined;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  async searchVideos(category?: string, maxResults: number = 10): Promise<ProcessedVideo[]> {
    try {
      const searchResponse = await axios.get<YouTubeSearchResponse>(`${this.baseUrl}/search`, {
        params: {
          key: this.apiKey,
          part: 'snippet',
          type: 'video',
          q: this.getCategorySearchTerms(category || 'General'),
          maxResults,
          order: 'relevance',
          relevanceLanguage: 'en',
          safeSearch: 'moderate',
          videoCaption: 'closedCaption'
        }
      });

      const items = (searchResponse.data.items || []).filter(item => item.id?.videoId);
      if (items.length === 0) return [];

      const videoIds = items.map(item => item.id.videoId);
      const durationByVideoId = new Map<string, number | undefined>();
      const descriptionByVideoId = new Map<string, string | undefined>();

      const detailsResponse = await axios.get<YouTubeVideosResponse>(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          part: 'snippet,contentDetails',
          id: videoIds.join(',')
        }
      });

      for (const item of detailsResponse.data.items || []) {
        durationByVideoId.set(item.id, this.parseDuration(item.contentDetails.duration));
        descriptionByVideoId.set(item.id, item.snippet?.description);
      }

      return items.map(item => ({
        title: decodeHtmlEntities(item.snippet.title),
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnailUrl: item.snippet.thumbnails?.high?.url
          || item.snippet.thumbnails?.medium?.url
          || item.snippet.thumbnails?.default?.url,
        source: item.snippet.channelTitle,
        description: decodeHtmlEntities(descriptionByVideoId.get(item.id.videoId) ?? item.snippet.description),
        categories: category ? [category] : ['General'],
        publishedDate: new Date(item.snippet.publishedAt),
        duration: durationByVideoId.get(item.id.videoId)
      }));
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      throw error;
    }
  }

  // fetching a diverse mix of videos across the given interest categories (falling back to 'General')
  async getRecommendedVideos(interests: string[], limit: number = 10): Promise<ProcessedVideo[]> {
    const categories = interests.length > 0 ? interests.slice(0, 5) : ['General'];
    const perCategory = Math.max(1, Math.ceil(limit / categories.length));

    const videoArrays = await Promise.all(
      categories.map(category => this.searchVideos(category, perCategory).catch(error => {
        console.error(`Error fetching YouTube videos for category ${category}:`, error);
        return [];
      }))
    );

    const seenUrls = new Set<string>();
    const videos: ProcessedVideo[] = [];
    for (const video of videoArrays.flat()) {
      if (!seenUrls.has(video.url)) {
        seenUrls.add(video.url);
        videos.push(video);
      }
    }

    return videos;
  }

  // not all videos have captions available, and the available English
  // track may be a regional variant (e.g. en-US) rather than plain 'en'.
  // Captions (auto-generated or channel-provided) are used as-is, with their
  // original punctuation/casing intact - no AI reformatting is applied.
  async fetchTranscript(videoId: string): Promise<FetchedTranscript | undefined> {
    const languageCandidates = ['en', 'en-US', 'en-GB'];

    try {
      const tracks = await fetchCaptionTracks(videoId);
      const track = tracks?.length ? selectCaptionTrack(tracks, languageCandidates) : undefined;
      if (track) {
        const segments = await fetchTrackSegments(track);
        if (segments.length > 0) {
          return { text: segments.map(segment => segment.text).join(' '), segments };
        }
      }
    } catch (err) {
      console.warn(`Direct caption fetch failed for video ${videoId}, falling back to youtube-transcript package:`, err);
    }

    // fallback: the youtube-transcript package, which also handles HTML-scraping edge
    // cases the direct call above doesn't - but can't distinguish a channel-provided
    // track from an auto-generated one, so it's only used when the above finds nothing
    for (const lang of languageCandidates) {
      try {
        const raw = await YoutubeTranscript.fetchTranscript(videoId, { lang });
        const segments: TranscriptSegment[] = raw
          .map(segment => ({
            start: segment.offset,
            duration: segment.duration,
            text: decodeHtmlEntities(segment.text).replace(/\s+/g, ' ').trim()
          }))
          .filter(segment => segment.text.length > 0);

        if (segments.length > 0) {
          const text = segments.map(segment => segment.text).join(' ');
          return { text, segments };
        }
      } catch {
        // try the next language candidate
      }
    }

    console.warn(`No English transcript available for video ${videoId}`);
    return undefined;
  }
}

export default new YouTubeAPI();
