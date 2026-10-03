/**
 * Embed sources — only servers verified to respond AND allow embedding.
 * `tier` ranks stream quality/FPS/reliability; the player auto-selects the top one.
 */
export type Media = { type: "movie" } | { type: "tv"; season: number; episode: number };

export type Source = {
  id: string;
  name: string;
  tier: number;
  maxQuality: string;
  fps: number;
  adFree: boolean;
  url: (id: string, m: Media) => string;
};

const pick = (m: Media, movie: string, tv: (s: number, e: number) => string) =>
  m.type === "movie" ? movie : tv(m.season, m.episode);

export const SOURCES: Source[] = [
  { id: "vidlink", name: "VidLink", tier: 99, maxQuality: "4K", fps: 60, adFree: true,
    url: (id, m) => pick(m, `https://vidlink.pro/movie/${id}?primaryColor=38bdf8&autoplay=false`, (s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=38bdf8&autoplay=false`) },
  { id: "videasy", name: "VidEasy", tier: 97, maxQuality: "4K", fps: 60, adFree: true,
    url: (id, m) => pick(m, `https://player.videasy.net/movie/${id}?color=38bdf8`, (s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}?color=38bdf8&nextEpisode=true&episodeSelector=true`) },
  { id: "vidfast", name: "VidFast", tier: 95, maxQuality: "4K", fps: 60, adFree: true,
    url: (id, m) => pick(m, `https://vidfast.pro/movie/${id}?theme=38bdf8`, (s, e) => `https://vidfast.pro/tv/${id}/${s}/${e}?theme=38bdf8`) },
  { id: "vixsrc", name: "VixSrc", tier: 93, maxQuality: "1080p", fps: 60, adFree: true,
    url: (id, m) => pick(m, `https://vixsrc.to/movie/${id}`, (s, e) => `https://vixsrc.to/tv/${id}/${s}/${e}`) },
  { id: "vidking", name: "VidKing", tier: 91, maxQuality: "1080p", fps: 60, adFree: true,
    url: (id, m) => pick(m, `https://www.vidking.net/embed/movie/${id}?color=38bdf8`, (s, e) => `https://www.vidking.net/embed/tv/${id}/${s}/${e}?color=38bdf8`) },
  { id: "111movies", name: "111Movies", tier: 89, maxQuality: "1080p", fps: 60, adFree: false,
    url: (id, m) => pick(m, `https://111movies.com/movie/${id}`, (s, e) => `https://111movies.com/tv/${id}/${s}/${e}`) },
  { id: "vidsrc-embed", name: "VidSrc Embed", tier: 87, maxQuality: "1080p", fps: 30, adFree: false,
    url: (id, m) => pick(m, `https://vidsrc-embed.ru/embed/movie?tmdb=${id}&ds_lang=en`, (s, e) => `https://vidsrc-embed.ru/embed/tv?tmdb=${id}&season=${s}&episode=${e}&ds_lang=en`) },
  { id: "vidsrc-cc", name: "VidSrc.cc", tier: 85, maxQuality: "1080p", fps: 30, adFree: false,
    url: (id, m) => pick(m, `https://vidsrc.cc/v2/embed/movie/${id}`, (s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`) },
  { id: "vidsrc-su", name: "VidSrc.su", tier: 83, maxQuality: "1080p", fps: 30, adFree: false,
    url: (id, m) => pick(m, `https://vidsrc.su/embed/movie/${id}`, (s, e) => `https://vidsrc.su/embed/tv/${id}/${s}/${e}`) },
  { id: "vidjoy", name: "VidJoy", tier: 81, maxQuality: "1080p", fps: 30, adFree: false,
    url: (id, m) => pick(m, `https://vidjoy.pro/embed/movie/${id}`, (s, e) => `https://vidjoy.pro/embed/tv/${id}/${s}/${e}`) },
  { id: "vidnest", name: "VidNest", tier: 79, maxQuality: "1080p", fps: 30, adFree: false,
    url: (id, m) => pick(m, `https://vidnest.fun/movie/${id}`, (s, e) => `https://vidnest.fun/tv/${id}/${s}/${e}`) },
  { id: "primesrc", name: "PrimeSrc", tier: 77, maxQuality: "1080p", fps: 30, adFree: false,
    url: (id, m) => pick(m, `https://primesrc.me/embed/movie?tmdb=${id}`, (s, e) => `https://primesrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`) },
  { id: "2embed", name: "2Embed", tier: 75, maxQuality: "1080p", fps: 30, adFree: false,
    url: (id, m) => pick(m, `https://www.2embed.cc/embed/${id}`, (s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`) },
  { id: "vidsrc-me", name: "VidSrc.me", tier: 73, maxQuality: "1080p", fps: 30, adFree: false,
    url: (id, m) => pick(m, `https://vidsrc.me/embed/movie?tmdb=${id}`, (s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`) },
  { id: "vidsrc-wtf", name: "VidSrc.wtf", tier: 71, maxQuality: "1080p", fps: 30, adFree: false,
    url: (id, m) => pick(m, `https://www.vidsrc.wtf/api/1/movie/?id=${id}`, (s, e) => `https://www.vidsrc.wtf/api/1/tv/?id=${id}&s=${s}&e=${e}`) },
  { id: "vaplayer", name: "VAPlayer", tier: 69, maxQuality: "1080p", fps: 30, adFree: false,
    url: (id, m) => pick(m, `https://vaplayer.xyz/embed/movie/${id}`, (s, e) => `https://vaplayer.xyz/embed/tv/${id}/${s}/${e}`) },
  { id: "autoembed", name: "AutoEmbed", tier: 67, maxQuality: "1080p", fps: 30, adFree: false,
    url: (id, m) => pick(m, `https://player.autoembed.cc/embed/movie/${id}`, (s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`) },
  { id: "moviesapi", name: "MoviesAPI", tier: 65, maxQuality: "1080p", fps: 30, adFree: false,
    url: (id, m) => pick(m, `https://moviesapi.club/movie/${id}`, (s, e) => `https://moviesapi.club/tv/${id}-${s}-${e}`) },
  { id: "multiembed", name: "MultiEmbed", tier: 63, maxQuality: "1080p", fps: 30, adFree: false,
    url: (id, m) => pick(m, `https://multiembed.mov/?video_id=${id}&tmdb=1`, (s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`) },
];

export const bestSource = () => [...SOURCES].sort((a, b) => b.tier - a.tier)[0]!;
