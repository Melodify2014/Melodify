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
  const searchPhrase = type === "channels"
    ? `${query} music channel`
    : type === "shorts"
      ? `${query} music shorts`
      : `${query} music video`;
  const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchPhrase).replace(/%20/g, "+")}`;
  const text = await fetchText(readerUrl(targetUrl), { timeout: 8000 });
  if (!text) return { count: 0, html: "" };

  const links = videoLinksFromText(text, "youtube-reader");
  return {
    count: links.count,
    html: `\n<!-- Melodify reader source: ${targetUrl} -->\n${text}\n${links.html}`
  };
}

async function noKeyVideoSearch(query, type) {
  if (type === "channels") return { count: 0, html: "" };

  let html = "";
  let count = 0;
  const targetCount = type === "channel-videos" ? 80 : type === "shorts" ? 60 : 30;
  const searchPhrase = type === "shorts" ? `${query} music shorts` : type === "channel-videos" ? `${query} music videos` : `${query} music video`;
  const encodedQuery = encodeURIComponent(searchPhrase);
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
    html += `\n<!-- Melodify no-key source: ${remoteUrl} -->\n${text}\n${links.html}`;
    count += links.count;
    if (count >= targetCount) return { count, html };
  }

  const duration = type === "shorts" ? "&duration=short" : "";
  for (const base of invidiousApiBases()) {
    for (const page of pages) {
      const remoteUrl = `${base}/api/v1/search?q=${encodedQuery}&type=video${duration}&page=${page}`;
      const text = await fetchText(remoteUrl, { timeout: 3000, accept: "application/json" });
      if (!text) continue;
      const links = videoLinksFromText(text, "invidious");
      html += `\n<!-- Melodify no-key source: ${remoteUrl} -->\n${text}\n${links.html}`;
      count += links.count;
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
  if (type === "channels") {
    searchQueries.push(`(site:youtube.com/channel/UC OR site:youtube.com/@) ${query} YouTube channel`);
    searchQueries.push(`${query} music YouTube channel`);
    searchQueries.push(`${query} artist YouTube channel`);
  } else if (type === "shorts") {
    searchQueries.push(`site:youtube.com/shorts ${query} music`);
    searchQueries.push(`${query} YouTube shorts`);
  } else if (type === "channel-videos") {
    searchQueries.push(`site:youtube.com/watch ${query} music`);
    searchQueries.push(`${query} YouTube music videos`);
    searchQueries.push(`${query} official music videos`);
  } else {
    searchQueries.push(`site:youtube.com/watch ${query} music`);
    searchQueries.push(`site:youtu.be ${query} music`);
    searchQueries.push(`site:youtube.com/watch ${query} music video`);
    searchQueries.push(`${query} song YouTube`);
    searchQueries.push(`${query} music video YouTube`);
    searchQueries.push(`${query} official music video`);
    searchQueries.push(`${query} lyrics`);
    searchQueries.push(`${query} official audio`);
  }

  const resultCount = type === "channel-videos" || type === "shorts" ? 100 : 50;
  const noKey = await noKeyVideoSearch(query, type);
  const reader = await readerYoutubeSearch(query, type);
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
