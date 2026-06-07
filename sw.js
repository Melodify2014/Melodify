"use strict";

const CACHE_NAME = "melodify-static-v38";
const THUMBNAIL_CACHE_NAME = "melodify-thumbnails-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("melodify-static-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (isCacheableThumbnail(url)) {
    event.respondWith(cacheFirst(request, THUMBNAIL_CACHE_NAME, offlineThumbnailResponse));
    return;
  }

  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/__melodify/")) return;
  if (url.pathname === "/yt/feed" || url.pathname === "/yt/oembed" || url.pathname === "/yt/discover") return;

  event.respondWith(networkFirst(request, CACHE_NAME));
});

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return await caches.match(request) || await caches.match("./index.html");
  }
}

async function cacheFirst(request, cacheName, fallback) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok || response.type === "opaque") await cache.put(request, response.clone());
    return response;
  } catch {
    return fallback();
  }
}

function isCacheableThumbnail(url) {
  const host = url.hostname.toLowerCase();
  return host === "i.ytimg.com" ||
    host === "yt3.ggpht.com" ||
    host.endsWith(".googleusercontent.com");
}

function offlineThumbnailResponse() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270">
      <rect width="480" height="270" fill="#142019"/>
      <circle cx="240" cy="135" r="46" fill="#1ed760"/>
      <path d="M226 109v52l43-26-43-26Z" fill="#07100b"/>
    </svg>`,
    { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" } }
  );
}
