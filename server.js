"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8788);
const VERSION_FILES = [
  "index.html",
  "styles.css",
  "app.js",
  "sw.js",
  "manifest.webmanifest",
  "server.js",
  "package.json",
  "render.yaml"
];
const BLOCKED_STATIC_PATTERNS = [
  /^\.git(?:\/|$)/,
  /^tools(?:\/|$)/,
  /(?:^|\/)\./,
  /\.(?:bat|ps1|vbs)$/i,
  /^(?:server\.js|package(?:-lock)?\.json|render\.yaml)$/i
];
const GENRE_ALIASES = {
  phonk: ["phonk", "drift phonk", "memphis rap"],
  lofi: ["lofi", "lo-fi", "lofi hip hop", "chillhop", "study beats", "study music"],
  hiphop: ["hip hop", "hip-hop", "hiphop", "rap", "trap", "drill", "boom bap"],
  rap: ["rap", "hip hop", "trap", "drill"],
  edm: ["edm", "electronic", "dance", "house", "dubstep", "future bass", "techno", "trance", "hardstyle", "breakcore"],
  electronic: ["electronic", "edm", "synthwave", "chiptune", "dubstep", "house", "ambient"],
  rock: ["rock", "alternative rock", "alt rock", "indie rock", "metal", "punk"],
  pop: ["pop", "dance pop", "indie pop", "kpop", "k-pop"],
  kpop: ["kpop", "k-pop", "korean pop"],
  rnb: ["rnb", "r&b", "rhythm and blues", "soul"],
  country: ["country", "country music"],
  jazz: ["jazz", "smooth jazz"],
  classical: ["classical", "orchestra", "orchestral", "piano", "violin"],
  indie: ["indie", "indie pop", "indie rock", "alternative", "bedroom pop"],
  reggae: ["reggae", "dancehall"],
  latin: ["latin", "reggaeton", "bachata", "salsa"],
  funk: ["funk", "future funk", "disco"],
  metal: ["metal", "heavy metal", "metalcore"],
  punk: ["punk", "pop punk"],
  synthwave: ["synthwave", "retrowave", "outrun"],
  drumandbass: ["drum and bass", "drum n bass", "dnb", "jungle"],
  anime: ["anime", "jpop", "j-pop", "vocaloid"],
  chill: ["chill", "chill music", "chillout", "ambient"],
  soundtrack: ["soundtrack", "ost", "score", "theme"],
  gospel: ["gospel", "worship", "christian music"]
};

function sendResponse(res, statusCode, statusText, contentType, body, headOnly = false) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body || ""), "utf8");
  res.writeHead(statusCode, statusText, {
    "Content-Type": contentType,
    "Content-Length": payload.length,
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Connection": "close"
  });
  if (!headOnly && payload.length) res.end(payload);
  else res.end();
}

function sendText(res, statusCode, statusText, text, headOnly) {
  sendResponse(res, statusCode, statusText, "text/plain; charset=utf-8", text, headOnly);
}

function sendJson(res, statusCode, statusText, data, headOnly) {
  sendResponse(res, statusCode, statusText, "application/json; charset=utf-8", JSON.stringify(data), headOnly);
}

function mimeType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".html": return "text/html; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    case ".js": return "application/javascript; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".webmanifest": return "application/manifest+json; charset=utf-8";
    case ".svg": return "image/svg+xml";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    default: return "application/octet-stream";
  }
}

function resolveStaticPath(urlPath) {
  let relativePath = decodeURIComponent((urlPath || "/").split("?")[0]).replace(/^\/+/, "");
  if (!relativePath) relativePath = "index.html";
  relativePath = relativePath.replace(/\\/g, "/");

  if (BLOCKED_STATIC_PATTERNS.some((pattern) => pattern.test(relativePath))) return null;

  const target = path.resolve(ROOT, relativePath);
  if (target !== ROOT && !target.startsWith(`${ROOT}${path.sep}`)) return null;
  return target;
}

async function listIconFiles() {
  const iconsRoot = path.join(ROOT, "icons");
  try {
    const entries = await fs.readdir(iconsRoot, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => `icons/${entry.name}`);
  } catch {
    return [];
  }
}

async function signatureFor(relativePaths) {
  const parts = [];
  for (const relativePath of [...new Set(relativePaths)].sort()) {
    const filePath = path.join(ROOT, relativePath);
    try {
      const stat = await fs.stat(filePath);
      parts.push(`${relativePath}|${stat.size}|${stat.mtimeMs}`);
    } catch {
      parts.push(`${relativePath}|missing`);
    }
  }
  return crypto.createHash("sha256").update(parts.join("\n")).digest("hex");
}

async function sendVersion(res, headOnly) {
  const appFiles = [...VERSION_FILES, ...await listIconFiles()];
  sendJson(res, 200, "OK", {
    signature: await signatureFor(appFiles),
    serverSignature: await signatureFor(["server.js", "package.json", "render.yaml"]),
    files: appFiles.length,
    generatedAt: new Date().toISOString()
  }, headOnly);
}

function queryValue(url, name) {
  return url.searchParams.get(name) || "";
}

function isYoutubeUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return ["http:", "https:"].includes(url.protocol) &&
      (host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com"));
  } catch {
    return false;
  }
}

async function fetchText(remoteUrl, options = {}) {
  const { timeout = 3500, accept = "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7" } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(remoteUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "Accept": accept,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Melodify Launcher"
      }
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function videoLinksFromText(text, source) {
  const ids = new Set();
  const patterns = [
    /"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"/gi,
    /"url"\s*:\s*"(?:\/watch\?v=|https?:\/\/(?:www\.)?youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/gi,
    /"url"\s*:\s*"(?:\/shorts\/|https?:\/\/(?:www\.)?youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/gi,
    /(?:watch\?v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/gi
  ];

  for (const pattern of patterns) {
    for (const match of String(text || "").matchAll(pattern)) ids.add(match[1]);
  }

  return {
    count: ids.size,
    html: [...ids].map((id) => `<a data-source="${source}" href="https://www.youtube.com/watch?v=${id}">YouTube video ${id}</a>`).join("\n")
  };
}

function channelLinksFromText(text, source) {
  const ids = new Set();
  const patterns = [
    /"authorId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"/gi,
    /"authorUrl"\s*:\s*"\/channel\/(UC[A-Za-z0-9_-]{22})"/gi,
    /(?:https?:\/\/(?:www\.)?youtube\.com)?\/channel\/(UC[A-Za-z0-9_-]{22})/gi,
    /(?:^|[^A-Za-z0-9_-])(UC[A-Za-z0-9_-]{22})(?:$|[^A-Za-z0-9_-])/g
  ];

  for (const pattern of patterns) {
    for (const match of String(text || "").matchAll(pattern)) ids.add(match[1]);
  }

  return {
    count: ids.size,
    html: [...ids].map((id) => `<a data-source="${source}" href="https://www.youtube.com/channel/${id}">YouTube channel ${id}</a>`).join("\n")
  };
}

function invidiousApiBases() {
  return [
    "https://inv.thepixora.com",
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://yt.chocolatemoo53.com",
    "https://yewtu.be",
    "https://vid.puffyan.us"
  ];
}

function readerUrl(targetUrl) {
  return `https://r.jina.ai/http://r.jina.ai/http://${targetUrl}`;
}

async function readerYoutubeSearch(query, type) {
  let count = 0;
  let html = "";
  for (const searchPhrase of searchPhrasesForQuery(query, type).slice(0, 2)) {
    const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchPhrase).replace(/%20/g, "+")}`;
    const text = await fetchText(readerUrl(targetUrl), { timeout: 8000 });
    if (!text) continue;

    const links = videoLinksFromText(text, "youtube-reader");
    const channels = channelLinksFromText(text, "youtube-reader");
    count += links.count + channels.count;
    html += `\n<!-- Melodify reader source: ${targetUrl} -->\n${text}\n${links.html}\n${channels.html}`;
    if (count >= 50) break;
  }
  return {
    count,
    html
  };
}

async function noKeyVideoSearch(query, type) {
  if (type === "channels") return { count: 0, html: "" };

  let html = "";
  let count = 0;
  const targetCount = type === "channel-videos" ? 80 : type === "shorts" ? 60 : 30;
  const encodedQuery = encodeURIComponent(searchPhrasesForQuery(query, type)[0]);
  const pages = type === "channel-videos" || type === "shorts" ? [1, 2, 3] : [1, 2];
  const pipedUrls = pages.flatMap((page) => [
    `https://pipedapi.kavin.rocks/search?q=${encodedQuery}&filter=videos&page=${page}`,
    `https://pipedapi.adminforge.de/search?q=${encodedQuery}&filter=videos&page=${page}`
  ]);
  pipedUrls.push(
    `https://pipedapi.kavin.rocks/search?q=${encodedQuery}&filter=videos`,
    `https://pipedapi.adminforge.de/search?q=${encodedQuery}&filter=videos`
  );

  for (const remoteUrl of pipedUrls) {
    const text = await fetchText(remoteUrl, { timeout: 3000, accept: "application/json" });
    if (!text) continue;
      const links = videoLinksFromText(text, "piped");
      const channels = channelLinksFromText(text, "piped");
      html += `\n<!-- Melodify no-key source: ${remoteUrl} -->\n${text}\n${links.html}\n${channels.html}`;
      count += links.count + channels.count;
    if (count >= targetCount) return { count, html };
  }

  const duration = type === "shorts" ? "&duration=short" : "";
  for (const base of invidiousApiBases()) {
    for (const page of pages) {
      const remoteUrl = `${base}/api/v1/search?q=${encodedQuery}&type=video${duration}&page=${page}`;
      const text = await fetchText(remoteUrl, { timeout: 3000, accept: "application/json" });
      if (!text) continue;
      const links = videoLinksFromText(text, "invidious");
      const channels = channelLinksFromText(text, "invidious");
      html += `\n<!-- Melodify no-key source: ${remoteUrl} -->\n${text}\n${links.html}\n${channels.html}`;
      count += links.count + channels.count;
      if (count >= targetCount) return { count, html };
    }
  }

  return { count, html };
}

async function sendYoutubeFeed(res, url, headOnly) {
  const channelId = queryValue(url, "channelId");
  if (!/^UC[A-Za-z0-9_-]{22}$/.test(channelId)) {
    sendText(res, 400, "Bad Request", "Invalid channel ID.", headOnly);
    return;
  }

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  const text = await fetchText(feedUrl, { timeout: 6000, accept: "application/xml" });
  if (!text) sendText(res, 502, "Bad Gateway", "Feed unavailable.", headOnly);
  else sendResponse(res, 200, "OK", "application/xml; charset=utf-8", text, headOnly);
}

async function sendYoutubeOembed(res, url, headOnly) {
  const videoUrl = queryValue(url, "url");
  if (!isYoutubeUrl(videoUrl)) {
    sendText(res, 400, "Bad Request", "{\"error\":\"Invalid YouTube URL.\"}", headOnly);
    return;
  }

  const metadataUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
  const text = await fetchText(metadataUrl, { timeout: 6000, accept: "application/json" });
  if (!text) sendText(res, 502, "Bad Gateway", "{\"error\":\"Metadata unavailable.\"}", headOnly);
  else sendResponse(res, 200, "OK", "application/json; charset=utf-8", text, headOnly);
}

async function sendYoutubeDiscovery(res, url, headOnly) {
  const query = queryValue(url, "q").trim();
  const type = queryValue(url, "type").trim().toLowerCase();
  if (!query || query.length > 120) {
    sendText(res, 400, "Bad Request", "Invalid search query.", headOnly);
    return;
  }

  const searchQueries = [];
  const genreTerms = queryGenreTerms(query);
  if (type === "channels") {
    searchQueries.push(`(site:youtube.com/channel/UC OR site:youtube.com/@) ${query} YouTube channel`);
    searchQueries.push(`${query} music YouTube channel`);
    searchQueries.push(`${query} artist YouTube channel`);
    for (const genre of genreTerms.slice(0, 2)) searchQueries.push(`${genre} artist YouTube channel`);
  } else if (type === "shorts") {
    searchQueries.push(`site:youtube.com/shorts ${query} music`);
    searchQueries.push(`${query} YouTube shorts`);
    for (const genre of genreTerms.slice(0, 2)) searchQueries.push(`${genre} music shorts`);
  } else if (type === "channel-videos") {
    searchQueries.push(`site:youtube.com/watch ${query} music`);
    searchQueries.push(`${query} YouTube music videos`);
    searchQueries.push(`${query} official music videos`);
    for (const genre of genreTerms.slice(0, 2)) searchQueries.push(`${genre} music videos`);
  } else {
    searchQueries.push(`site:youtube.com/watch ${query} music`);
    searchQueries.push(`site:youtu.be ${query} music`);
    searchQueries.push(`site:youtube.com/watch ${query} music video`);
    searchQueries.push(`${query} song YouTube`);
    searchQueries.push(`${query} music video YouTube`);
    searchQueries.push(`${query} official music video`);
    searchQueries.push(`${query} lyrics`);
    searchQueries.push(`${query} official audio`);
    for (const genre of genreTerms.slice(0, 2)) {
      searchQueries.push(`${genre} music mix YouTube`);
      searchQueries.push(`${genre} playlist YouTube`);
    }
  }

  const resultCount = type === "channel-videos" || type === "shorts" ? 100 : 50;
  const [readerResult, noKeyResult] = await Promise.allSettled([
    readerYoutubeSearch(query, type),
    noKeyVideoSearch(query, type)
  ]);
  const reader = readerResult.status === "fulfilled" ? readerResult.value : { count: 0, html: "" };
  const noKey = noKeyResult.status === "fulfilled" ? noKeyResult.value : { count: 0, html: "" };
  let combined = `${noKey.html}\n${reader.html}`;
  let successCount = 0;
  let videoLinkCount = 0;

  for (const searchQuery of searchQueries.slice(0, 3)) {
    if (noKey.count + reader.count >= 24 && type !== "channels") break;
    const encodedQuery = encodeURIComponent(searchQuery);
    const searchUrls = [
      `https://www.bing.com/search?count=${resultCount}&q=${encodedQuery}`,
      `https://duckduckgo.com/html/?q=${encodedQuery}`,
      `https://www.google.com/search?num=${resultCount}&hl=en&q=${encodedQuery}`
    ];

    for (const searchUrl of searchUrls) {
      const text = await fetchText(searchUrl, { timeout: 3000 });
      if (!text) continue;
      const links = videoLinksFromText(text, "web");
      combined += `\n<!-- Melodify source: ${searchUrl} -->\n${text}\n${links.html}`;
      successCount += 1;
      videoLinkCount += links.count;
      if (videoLinkCount + noKey.count + reader.count >= 60) break;
    }

    if (videoLinkCount + noKey.count + reader.count >= 60) break;
  }

  if (successCount > 0 || noKey.count > 0 || reader.count > 0) sendResponse(res, 200, "OK", "text/html; charset=utf-8", combined, headOnly);
  else sendText(res, 502, "Bad Gateway", "Discovery unavailable.", headOnly);
}

async function sendStatic(res, url, headOnly) {
  const filePath = resolveStaticPath(url.pathname);
  if (!filePath) {
    sendText(res, 403, "Forbidden", "Forbidden", headOnly);
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    const target = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const body = await fs.readFile(target);
    sendResponse(res, 200, "OK", mimeType(target), body, headOnly);
  } catch (error) {
    sendText(res, error.code === "ENOENT" ? 404 : 500, error.code === "ENOENT" ? "Not Found" : "Internal Server Error", error.code === "ENOENT" ? "Not found" : "Melodify could not serve this file.", headOnly);
  }
}

const server = http.createServer((req, res) => {
  const headOnly = req.method === "HEAD";
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendText(res, 405, "Method Not Allowed", "Method not allowed.", false);
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  Promise.resolve().then(async () => {
    if (url.pathname === "/__melodify/health") sendText(res, 200, "OK", "Melodify OK", headOnly);
    else if (url.pathname === "/__melodify/version") await sendVersion(res, headOnly);
    else if (url.pathname === "/__melodify/restart") sendText(res, 200, "OK", "Melodify restart is managed by Render.", headOnly);
    else if (url.pathname === "/yt/feed") await sendYoutubeFeed(res, url, headOnly);
    else if (url.pathname === "/yt/oembed") await sendYoutubeOembed(res, url, headOnly);
    else if (url.pathname === "/yt/discover") await sendYoutubeDiscovery(res, url, headOnly);
    else await sendStatic(res, url, headOnly);
  }).catch(() => {
    if (!res.headersSent) sendText(res, 500, "Internal Server Error", "Melodify could not handle this request.", headOnly);
    else res.end();
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Melodify is listening on port ${PORT}`);
});

function searchPhrasesForQuery(query, type) {
  const cleanQuery = String(query || "").trim();
  const genreTerms = queryGenreTerms(query);
  const phraseGenres = preferredSearchGenreTerms(cleanQuery, genreTerms);
  const phrases = [];
  if (type === "channels") {
    phrases.push(`${cleanQuery} music channel`);
    phrases.push(`${cleanQuery} artist channel`);
    phraseGenres.forEach((genre) => phrases.push(`${genre} music channel`));
  } else if (type === "shorts") {
    phrases.push(`${cleanQuery} music shorts`);
    phraseGenres.forEach((genre) => phrases.push(`${genre} music shorts`));
  } else if (type === "channel-videos") {
    phrases.push(`${cleanQuery} music videos`);
    phraseGenres.forEach((genre) => phrases.push(`${genre} music videos`));
  } else {
    phrases.push(`${cleanQuery} music video`);
    phrases.push(`${cleanQuery} song`);
    phrases.push(`${cleanQuery} mix`);
    phrases.push(`${cleanQuery} official audio`);
    phraseGenres.forEach((genre) => {
      phrases.push(`${genre} music video`);
      phrases.push(`${genre} songs`);
      phrases.push(`${genre} mix`);
      phrases.push(`${genre} playlist`);
    });
  }
  return [...new Set(phrases.filter(Boolean))];
}

function preferredSearchGenreTerms(query, genreTerms) {
  return [...new Set([query, ...genreTerms])]
    .map((term) => String(term || "").trim())
    .filter((term) => term.length > 2)
    .slice(0, 4);
}

function queryGenreTerms(query) {
  const normalizedQuery = normalizeKey(query);
  const queryTokens = new Set(tokenize(query));
  const terms = new Set();
  for (const [canonical, aliases] of Object.entries(GENRE_ALIASES)) {
    const matched = aliases.some((alias) => genreAliasMatchesQuery(alias, normalizedQuery, queryTokens));
    if (!matched) continue;
    terms.add(canonical);
    aliases.forEach((alias) => terms.add(alias));
  }
  return [...terms];
}

function genreAliasMatchesQuery(alias, normalizedQuery, queryTokens) {
  const normalizedAlias = normalizeKey(alias);
  const aliasTokens = tokenize(alias);
  if (!normalizedAlias) return false;
  if (aliasTokens.length > 1) {
    return normalizedQuery.includes(normalizedAlias) || aliasTokens.every((token) => queryTokens.has(token));
  }
  if (aliasTokens.length === 1) {
    return queryTokens.has(aliasTokens[0]) || normalizedQuery === normalizedAlias;
  }
  return normalizedQuery === normalizedAlias;
}

function tokenize(value) {
  return String(value || "").toLowerCase().split(/[^a-z0-9]+/g).filter((token) => token.length > 2);
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
