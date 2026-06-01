"use strict";

const STATE_STORAGE = "melodify-state-v1";
const FEED_PROXY_PATH = "/yt/feed";
const OEMBED_PROXY_PATH = "/yt/oembed";
const DISCOVERY_PROXY_PATH = "/yt/discover";
const APP_VERSION_PATH = "/__melodify/version";
const APP_RESTART_PATH = "/__melodify/restart";
const MUSIC_CATEGORY_ID = "10";
const PLAYER_UNAVAILABLE_ERRORS = new Set([2, 5, 100, 101, 150]);
const SEARCH_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CHANNEL_CACHE_TTL_MS = 60 * 60 * 1000;
const FOLLOWED_CHANNEL_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const CHANNEL_PAGE_AUTO_REFRESH_RETRY_MS = 2 * 60 * 1000;
const APP_UPDATE_CHECK_INTERVAL_MS = 15000;
const APP_UPDATE_RELOAD_DELAY_MS = 1200;
const APP_UPDATE_SERVER_RELOAD_DELAY_MS = 3200;
const LOCAL_APP_HELP = "Open Melodify from the Desktop or Start Menu shortcut to discover new videos.";
const LOCAL_PLAYER_HELP = "Open Melodify from the Desktop or Start Menu shortcut to play YouTube videos inside the app.";
const SEARCH_DISCOVERY_TIMEOUT_MS = 12000;
const VIDEO_IMPORT_CONCURRENCY = 6;
const VIDEO_SEARCH_IMPORT_LIMIT = 24;
const CHANNEL_DISCOVERY_IMPORT_LIMIT = 220;
const AVAILABILITY_MODEL_VERSION = 2;
const METADATA_MATRIX_MAX_TERMS = 420;
const METADATA_MATRIX_VIDEO_TERMS = 28;
const METADATA_MATRIX_CHANNEL_TERMS = 22;
const MUSIC_SIGNAL_TERMS = [
  "music", "music video", "official music video", "official video", "official audio", "audio", "song", "single",
  "lyrics", "lyric video", "visualizer", "remix", "cover", "instrumental", "beat", "beats", "album",
  "ep", "soundtrack", "ost", "theme", "acoustic", "live performance", "performance", "karaoke",
  "slowed", "reverb", "sped up", "nightcore", "phonk", "lofi", "bass", "mashup", "mix", "dj",
  "prod", "producer", "records", "recordings", "vevo", "topic", "nocopyrightsounds", "ncs",
  "monstercat", "trap nation", "copyright free"
];
const NON_MUSIC_SIGNAL_TERMS = [
  "gameplay", "walkthrough", "playthrough", "speedrun", "tutorial", "guide", "tips", "tricks",
  "stream", "streams", "streamed", "streaming", "full stream", "vod", "livestream archive",
  "playing", "plays", "played", "gaming", "game", "games", "let's play", "lets play",
  "hollow knight", "silksong", "boss fight", "bosses", "full game", "blind run",
  "roblox", "minecraft", "fortnite", "valorant", "gta", "doors", "forsaken", "jujutsu",
  "secret button", "build", "building", "builder", "mod", "mods", "update", "patch",
  "trailer", "teaser", "movie actors", "reaction", "vlog", "livestream", "live stream",
  "episode", "chapter", "challenge", "test", "take 2", "ranked", "pvp"
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

const icons = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
  users: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 9.4 8.4 4 11l5.4 2.6L12 19l2.6-5.4L20 11l-5.4-2.6L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/></svg>',
  key: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m11 12 9-9"/><path d="m17 6 3 3"/><path d="m14 9 3 3"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="8 5 19 12 8 19 8 5"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14"/><path d="M16 5v14"/></svg>',
  previous: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 20 9 12l10-8v16Z"/><path d="M5 19V5"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 4 10 8-10 8V4Z"/><path d="M19 5v14"/></svg>',
  loop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
  "user-plus": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></svg>',
  external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6"/><path d="m10 14 11-11"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  music: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg>',
  alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'
};

const demoChannels = [
  {
    id: "demo-ncs",
    title: "NoCopyrightSounds",
    description: "Electronic music releases",
    thumbnail: "https://i.ytimg.com/vi/K4DyBUG242c/hqdefault.jpg",
    subscriberCount: "Demo"
  },
  {
    id: "demo-electronic",
    title: "Melodify Electronic",
    description: "Demo electronic picks",
    thumbnail: "https://i.ytimg.com/vi/bM7SZ5SBzyY/hqdefault.jpg",
    subscriberCount: "Demo"
  },
  {
    id: "demo-phonk",
    title: "Melodify Phonk",
    description: "Demo high-energy picks",
    thumbnail: "https://i.ytimg.com/vi/yJg-Y5byMMw/hqdefault.jpg",
    subscriberCount: "Demo"
  }
];

const demoVideos = [
  {
    id: "K4DyBUG242c",
    title: "Cartoon, Jeja - On & On",
    channelId: "demo-ncs",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/K4DyBUG242c/hqdefault.jpg",
    publishedAt: "2015-07-09T00:00:00Z",
    duration: "3:28",
    tags: ["electronic", "dance", "music video"],
    embeddable: true
  },
  {
    id: "bM7SZ5SBzyY",
    title: "Alan Walker - Fade",
    channelId: "demo-ncs",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/bM7SZ5SBzyY/hqdefault.jpg",
    publishedAt: "2014-11-19T00:00:00Z",
    duration: "4:21",
    tags: ["electronic", "melodic", "music video"],
    embeddable: true
  },
  {
    id: "yJg-Y5byMMw",
    title: "Different Heaven & EH!DE - My Heart",
    channelId: "demo-ncs",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/yJg-Y5byMMw/hqdefault.jpg",
    publishedAt: "2013-11-13T00:00:00Z",
    duration: "4:27",
    tags: ["electronic", "dubstep", "music video"],
    embeddable: true
  },
  {
    id: "J2X5mJ3HDYE",
    title: "DEAF KEV - Invincible",
    channelId: "demo-ncs",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/J2X5mJ3HDYE/hqdefault.jpg",
    publishedAt: "2015-05-14T00:00:00Z",
    duration: "4:34",
    tags: ["electronic", "dance", "music video"],
    embeddable: true
  },
  {
    id: "TW9d8vYrVFQ",
    title: "Elektronomia - Sky High",
    channelId: "demo-ncs",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/TW9d8vYrVFQ/hqdefault.jpg",
    publishedAt: "2016-12-04T00:00:00Z",
    duration: "3:58",
    tags: ["electronic", "future bass", "music video"],
    embeddable: true
  },
  {
    id: "lTRiuFIWV54",
    title: "Tobu - Hope",
    channelId: "demo-ncs",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/lTRiuFIWV54/hqdefault.jpg",
    publishedAt: "2014-04-27T00:00:00Z",
    duration: "4:43",
    tags: ["electronic", "house", "music video"],
    embeddable: true
  }
];

const state = {
  filter: "all",
  query: "",
  route: "home",
  activeChannelId: "",
  likedVideos: {},
  followedChannels: {},
  currentVideo: null,
  queue: [],
  queueIndex: -1,
  loop: false,
  searchResults: { videos: [], channels: [] },
  channelCache: {},
  channelFilter: "all",
  videoCache: {},
  cachedChannels: {},
  channelVideoIds: {},
  channelFetchedAt: {},
  channelFeedErrors: {},
  channelDiscoveryFetchedAt: {},
  creatorIndex: {},
  searchCache: {},
  dailyPlaylists: { date: "", playlists: [] },
  unavailableVideos: {},
  sessionBlockedVideos: {},
  recommendations: [],
  loading: false,
  error: ""
};

let ytPlayer = null;
let ytReady = false;
let playerReady = false;
let playerBlocked = false;
let fileModeToastShown = false;
let lastVisibleVideos = [];
let metadataMatrix = null;
let toastTimer = 0;
let appVersionSignature = "";
let appServerVersionSignature = "";
let appUpdateInProgress = false;
let followedChannelRefreshInFlight = false;
const channelAutoLoadRequests = new Map();

const els = {};

window.onYouTubeIframeAPIReady = () => {
  ytReady = true;
  ensurePlayer();
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  redirectFileModeToLocalApp();
  hydrateState();
  primeCache();
  pruneNonMusicCache();
  installIcons(document);
  bindEvents();
  routeFromHash();
  render();
  registerServiceWorker();
  startAppUpdateWatcher();
  startFollowedChannelRefreshWatcher();

  if (window.YT && window.YT.Player) {
    ytReady = true;
    ensurePlayer();
  }
}

function redirectFileModeToLocalApp() {
  if (!isFileMode()) return;

  const targetUrl = `http://127.0.0.1:8788/${window.location.hash || ""}`;
  fetch("http://127.0.0.1:8788/__melodify/health", { cache: "no-store" })
    .then((response) => {
      if (response.ok) window.location.replace(targetUrl);
    })
    .catch(() => {});
}

function cacheElements() {
  els.view = document.getElementById("view");
  els.searchForm = document.getElementById("searchForm");
  els.searchInput = document.getElementById("searchInput");
  els.likedCount = document.getElementById("likedCount");
  els.followCount = document.getElementById("followCount");
  els.modalRoot = document.getElementById("modalRoot");
  els.toast = document.getElementById("toast");
  els.trackArt = document.getElementById("trackArt");
  els.playerSource = document.getElementById("playerSource");
  els.playerTitle = document.getElementById("playerTitle");
  els.playerChannel = document.getElementById("playerChannel");
  els.playButtonIcon = document.getElementById("playButtonIcon");
  els.loopButton = document.getElementById("loopButton");
  els.playerLike = document.getElementById("playerLike");
  els.playerSubscribe = document.getElementById("playerSubscribe");
  els.youtubeLink = document.getElementById("youtubeLink");
  els.emptyPlayer = document.getElementById("emptyPlayer");
}

function hydrateState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_STORAGE) || "{}");
    state.likedVideos = saved.likedVideos || {};
    state.followedChannels = saved.followedChannels || {};
    state.currentVideo = saved.currentVideo || null;
    state.loop = Boolean(saved.loop);
    state.recommendations = saved.recommendations || [];
    state.videoCache = saved.videoCache || {};
    state.cachedChannels = saved.cachedChannels || {};
    state.channelVideoIds = saved.channelVideoIds || {};
    state.channelFetchedAt = saved.channelFetchedAt || {};
    state.channelFeedErrors = saved.channelFeedErrors || {};
    state.channelDiscoveryFetchedAt = saved.channelDiscoveryFetchedAt || {};
    state.creatorIndex = saved.creatorIndex || {};
    state.searchCache = saved.searchCache || {};
    state.dailyPlaylists = saved.dailyPlaylists || { date: "", playlists: [] };
    state.unavailableVideos = saved.availabilityModelVersion === AVAILABILITY_MODEL_VERSION ? saved.unavailableVideos || {} : {};
    if (saved.availabilityModelVersion !== AVAILABILITY_MODEL_VERSION) {
      reEnableCachedVideos();
      persist();
    }
  } catch {
    localStorage.removeItem(STATE_STORAGE);
  }
}

function persist() {
  try {
    localStorage.setItem(
      STATE_STORAGE,
      JSON.stringify({
        likedVideos: state.likedVideos,
        followedChannels: state.followedChannels,
        currentVideo: state.currentVideo,
        loop: state.loop,
        recommendations: state.recommendations.slice(0, 30),
        videoCache: state.videoCache,
        cachedChannels: state.cachedChannels,
        channelVideoIds: state.channelVideoIds,
        channelFetchedAt: state.channelFetchedAt,
        channelFeedErrors: state.channelFeedErrors,
        channelDiscoveryFetchedAt: state.channelDiscoveryFetchedAt,
        creatorIndex: state.creatorIndex,
        searchCache: state.searchCache,
        dailyPlaylists: state.dailyPlaylists,
        unavailableVideos: state.unavailableVideos,
        availabilityModelVersion: AVAILABILITY_MODEL_VERSION
      })
    );
  } catch {
    showToast("Melodify cache is full in this browser. Older browser storage may need clearing.");
  }
}

function bindEvents() {
  window.addEventListener("hashchange", () => {
    routeFromHash();
    render();
  });

  els.searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = els.searchInput.value.trim();
    if (!query) {
      showToast("Type a music video or creator first.");
      return;
    }
    state.query = query;
    location.hash = "search";
    await runSearch(query, state.filter);
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.filter = button.dataset.filter || "all";
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
      if (state.query) {
        await runSearch(state.query, state.filter);
      }
    });
  });

  document.addEventListener("click", async (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    await handleAction(action, actionTarget, event);
  });

  els.modalRoot.addEventListener("click", (event) => {
    if (event.target === els.modalRoot) {
      closeModal();
    }
  });

  els.modalRoot.addEventListener("submit", async (event) => {
    const actionTarget = event.submitter?.closest("[data-action]");
    if (!actionTarget) return;
    event.preventDefault();
    await handleAction(actionTarget.dataset.action, actionTarget, event);
  });
}

async function handleAction(action, target, event) {
  if (action === "close-modal") {
    closeModal();
    return;
  }

  if (action === "play") {
    const video = findVideo(target.dataset.videoId);
    if (video) {
      await playVideo(video, lastVisibleVideos);
    }
    return;
  }

  if (action === "like") {
    const video = findVideo(target.dataset.videoId);
    if (video) toggleLike(video);
    return;
  }

  if (action === "subscribe") {
    const channel = findChannel(target.dataset.channelId);
    if (channel) {
      toggleFollow(channel);
      if (isFollowing(channel.id)) await refreshChannelLibrary(channel.id, { force: true, quiet: true });
    }
    return;
  }

  if (action === "open-channel") {
    const channelId = target.dataset.channelId;
    if (channelId) {
      location.hash = `channel/${encodeURIComponent(channelId)}`;
    }
    return;
  }

  if (action === "set-channel-filter") {
    state.channelFilter = target.dataset.filter || "all";
    render();
    return;
  }

  if (action === "refresh-recommendations") {
    await loadRecommendations(true);
    return;
  }

  if (action === "refresh-following") {
    await refreshFollowedChannelsCache(true);
    return;
  }

  if (action === "force-search") {
    if (state.query) await runSearch(state.query, state.filter, { force: true });
    return;
  }

  if (action === "toggle-play") {
    togglePlayback();
    return;
  }

  if (action === "previous") {
    playAdjacent(-1);
    return;
  }

  if (action === "next") {
    playAdjacent(1);
    return;
  }

  if (action === "toggle-loop") {
    state.loop = !state.loop;
    persist();
    renderPlayer();
    return;
  }

  if (action === "current-like" && state.currentVideo) {
    toggleLike(state.currentVideo);
    return;
  }

  if (action === "current-subscribe" && state.currentVideo) {
    const channel = channelFromVideo(state.currentVideo);
    toggleFollow(channel);
    if (isFollowing(channel.id)) await refreshChannelLibrary(channel.id, { force: true, quiet: true });
    return;
  }

  if (action === "current-channel" && state.currentVideo) {
    location.hash = `channel/${encodeURIComponent(state.currentVideo.channelId)}`;
  }
}

function routeFromHash() {
  const hash = location.hash.replace(/^#/, "") || "home";
  const [route, channelId] = hash.split("/");
  state.route = route;
  state.activeChannelId = channelId ? decodeURIComponent(channelId) : "";
}

function render() {
  installIcons(document);
  renderNav();
  renderPlayer();
  renderView();
}

function renderNav() {
  document.querySelectorAll("[data-nav]").forEach((item) => {
    item.classList.toggle("active", item.dataset.nav === state.route);
  });
  els.likedCount.textContent = String(Object.keys(state.likedVideos).length);
  els.followCount.textContent = String(Object.keys(state.followedChannels).length);
}

function renderView() {
  let html = "";

  if (state.route === "search") {
    html = renderSearchView();
  } else if (state.route === "liked") {
    html = renderLikedView();
  } else if (state.route === "following") {
    html = renderFollowingView();
  } else if (state.route === "recommended") {
    html = renderRecommendedView();
  } else if (state.route === "channel") {
    html = renderChannelView();
  } else {
    html = renderHomeView();
  }

  els.view.innerHTML = html;
  installIcons(els.view);
  maybeLoadRouteData();
}

function renderHomeView() {
  const likedCount = Object.keys(state.likedVideos).length;
  const followedCount = Object.keys(state.followedChannels).length;
  const picks = getLocalRecommendations().slice(0, 8);
  const channelHtml = followedCount
    ? `<section><h2 class="section-title">Following</h2>${renderChannelList(Object.values(state.followedChannels))}</section>`
    : `<section><h2 class="section-title">Creators</h2>${renderChannelList(demoChannels)}</section>`;
  lastVisibleVideos = picks;

  return `
    <header class="view-header">
      <div>
        <p class="eyebrow">No-key YouTube RSS cache</p>
        <h1 class="view-title">Melodify</h1>
      </div>
      <div class="badge-row">
        <span class="badge green">${likedCount} liked</span>
        <span class="badge amber">${followedCount} following</span>
        <span class="badge">${Object.keys(state.videoCache).length} cached</span>
      </div>
    </header>
    <section>
      <h2 class="section-title">Recommended</h2>
      ${renderVideoGrid(picks)}
    </section>
    ${channelHtml}
  `;
}

function renderSearchView() {
  if (state.loading) return renderLoading("Discovering music videos");
  if (state.error) return renderStatus("Search paused", state.error, "alert");

  const { videos, channels } = state.searchResults;
  const title = state.query ? `Search: ${escapeHtml(state.query)}` : "Search";

  if (!videos.length && !channels.length) {
    return `
      <header class="view-header">
        <div>
          <p class="eyebrow">Web + cache</p>
          <h1 class="view-title">${title}</h1>
        </div>
      </header>
      ${renderEmpty("No results found", "Melodify could not discover matching music videos yet.", "search")}
    `;
  }

  const channelSection = channels.length && (state.filter !== "videos" || !videos.length)
    ? `<section><h2 class="section-title">Creators</h2>${renderChannelList(channels)}</section>`
    : "";
  const videoSection = videos.length && state.filter !== "channels"
    ? `<section><h2 class="section-title">Music videos</h2>${renderVideoGrid(videos)}</section>`
    : "";
  lastVisibleVideos = videos;

  return `
    <header class="view-header">
      <div>
        <p class="eyebrow">Web + cache</p>
        <h1 class="view-title">${title}</h1>
      </div>
    </header>
    ${channelSection}
    ${videoSection}
  `;
}

function renderLikedView() {
  const videos = Object.values(state.likedVideos).filter(isLikelyMusicVideo);
  lastVisibleVideos = videos;
  if (!videos.length) return renderEmpty("Liked videos", "Liked music videos will show here.", "heart");
  return `
    <header class="view-header">
      <div>
        <p class="eyebrow">${videos.length} saved</p>
        <h1 class="view-title">Liked videos</h1>
      </div>
    </header>
    ${renderVideoGrid(videos)}
  `;
}

function renderFollowingView() {
  const channels = Object.values(state.followedChannels);
  if (!channels.length) {
    return renderEmpty("Following", "Use the top search bar to find creators, then subscribe to keep them here.", "users");
  }
  return `
    <header class="view-header">
      <div>
        <p class="eyebrow">${channels.length} creators</p>
        <h1 class="view-title">Following</h1>
      </div>
      <div class="view-actions">
        <button class="secondary-button" type="button" data-action="refresh-following">
          <span data-icon="sparkles" aria-hidden="true"></span>
          <span>Refresh feeds</span>
        </button>
      </div>
    </header>
    ${renderChannelList(channels, true)}
  `;
}

function renderRecommendedView() {
  const playlists = getRenderedDailyPlaylists();
  const videos = playlists.flatMap((playlist) => playlist.videos);
  lastVisibleVideos = videos;
  return `
    <header class="view-header">
      <div>
        <p class="eyebrow">${state.dailyPlaylists.date === todayKey() ? "Daily playlists" : "Local profile ranking"}</p>
        <h1 class="view-title">Recommended</h1>
      </div>
      <button class="secondary-button" type="button" data-action="refresh-recommendations">
        <span data-icon="sparkles" aria-hidden="true"></span>
        <span>Refresh</span>
      </button>
    </header>
    ${state.loading ? renderSkeletonGrid() : playlists.map(renderDailyPlaylist).join("")}
  `;
}

function renderChannelView() {
  const channel = findChannel(state.activeChannelId) || { id: state.activeChannelId, title: "Creator", description: "", thumbnail: "" };
  const storedIds = state.channelVideoIds[state.activeChannelId] || [];
  const storedVideos = storedIds.map((id) => state.videoCache[id]).filter(Boolean).filter(isLikelyMusicVideo);
  const cache = state.channelCache[state.activeChannelId] || (storedVideos.length ? { channel, videos: storedVideos, nextPageToken: "", loading: false } : null);
  const allVideos = uniqueVideos([...(cache?.videos || []), ...storedVideos]).filter(isLikelyMusicVideo);
  const videos = applyChannelFilter(allVideos);
  lastVisibleVideos = videos;
  const showSkeleton = cache?.loading && !allVideos.length;
  const feedStatus = channelFeedStatus(channel.id);
  const feedBadgeClass = feedStatus === "Updated this hour" ? "green" : feedStatus === "Feed unavailable" ? "amber" : "";

  const action = isFollowing(channel.id)
    ? `<button class="pill-action active" type="button" data-action="subscribe" data-channel-id="${escapeAttr(channel.id)}"><span data-icon="check" aria-hidden="true"></span><span>Subscribed</span></button>`
    : `<button class="pill-action" type="button" data-action="subscribe" data-channel-id="${escapeAttr(channel.id)}"><span data-icon="user-plus" aria-hidden="true"></span><span>Subscribe</span></button>`;

  return `
    <header class="view-header">
      <div>
        <p class="eyebrow">Creator</p>
        <h1 class="view-title">${escapeHtml(channel.title)}</h1>
        <p class="meta">${escapeHtml(channel.description || "Music videos")}</p>
        <div class="badge-row"><span class="badge ${feedBadgeClass}">${escapeHtml(feedStatus)}</span></div>
      </div>
      <div class="view-actions">
        <div class="segmented compact" role="group" aria-label="Channel video filter">
          <button type="button" class="segment ${state.channelFilter === "all" ? "active" : ""}" data-action="set-channel-filter" data-filter="all">All</button>
          <button type="button" class="segment ${state.channelFilter === "videos" ? "active" : ""}" data-action="set-channel-filter" data-filter="videos">Videos</button>
          <button type="button" class="segment ${state.channelFilter === "shorts" ? "active" : ""}" data-action="set-channel-filter" data-filter="shorts">Shorts</button>
        </div>
        ${action}
      </div>
    </header>
    ${showSkeleton ? renderSkeletonGrid() : videos.length ? renderVideoGrid(videos) : renderEmpty("No music videos loaded", allVideos.length ? "Try a different channel filter." : "Melodify is searching this channel for music videos and Shorts.", "music")}
  `;
}

function renderDailyPlaylist(playlist) {
  return `
    <section>
      <div class="section-heading">
        <h2 class="section-title">${escapeHtml(playlist.title)}</h2>
        <p class="meta">${escapeHtml(playlist.query || "Cached recommendations")}</p>
      </div>
      ${renderVideoGrid(playlist.videos)}
    </section>
  `;
}

function renderVideoGrid(videos) {
  if (!videos.length) return renderEmpty("Nothing here yet", "Search or like a music video.", "music");
  return `<div class="grid">${videos.map(renderVideoCard).join("")}</div>`;
}

function renderVideoCard(video) {
  const liked = isLiked(video.id);
  const channel = channelFromVideo(video);
  const unavailable = !isPlayableVideo(video);
  const status = unavailable ? "Unavailable" : video.duration || "Music video";
  return `
    <article class="video-card ${unavailable ? "unavailable" : ""}">
      <button class="thumb-button" type="button" data-action="${unavailable ? "noop" : "play"}" data-video-id="${escapeAttr(video.id)}" aria-label="Play ${escapeAttr(video.title)}" ${unavailable ? "disabled" : ""}>
        <img src="${escapeAttr(video.thumbnail)}" alt="" loading="lazy">
        <span class="thumb-overlay">${icon(unavailable ? "alert" : "play")}</span>
      </button>
      <div>
        <h2 class="video-title">${escapeHtml(video.title)}</h2>
        <button class="link-button" type="button" data-action="open-channel" data-channel-id="${escapeAttr(video.channelId)}">${escapeHtml(video.channelTitle)}</button>
        <p class="meta">${escapeHtml(status)} ${video.publishedAt ? " / " + escapeHtml(formatDate(video.publishedAt)) : ""}</p>
      </div>
      <div class="card-actions">
        <button class="mini-action ${liked ? "active" : ""}" type="button" data-action="like" data-video-id="${escapeAttr(video.id)}" aria-label="${liked ? "Unlike" : "Like"} ${escapeAttr(video.title)}" title="${liked ? "Unlike" : "Like"}">
          ${icon("heart")}
        </button>
        <button class="mini-action ${isFollowing(channel.id) ? "active" : ""}" type="button" data-action="subscribe" data-channel-id="${escapeAttr(channel.id)}" aria-label="Subscribe to ${escapeAttr(channel.title)}" title="Subscribe">
          ${icon(isFollowing(channel.id) ? "check" : "user-plus")}
        </button>
      </div>
    </article>
  `;
}

function renderChannelList(channels, rows = false) {
  const className = rows ? "channel-list" : "channel-strip";
  return `<div class="${className}">${channels.map((channel) => renderChannelCard(channel, rows)).join("")}</div>`;
}

function renderChannelCard(channel, row = false) {
  const followed = isFollowing(channel.id);
  const avatar = channel.thumbnail
    ? `<img class="channel-avatar" src="${escapeAttr(channel.thumbnail)}" alt="" loading="lazy">`
    : `<span class="channel-avatar placeholder">${escapeHtml(initials(channel.title))}</span>`;
  return `
    <article class="${row ? "channel-row" : "channel-card"}">
      ${avatar}
      <div>
        <button class="link-button channel-title" type="button" data-action="open-channel" data-channel-id="${escapeAttr(channel.id)}">${escapeHtml(channel.title)}</button>
        <p class="meta">${escapeHtml(channel.subscriberCount || channel.description || "Creator")}</p>
      </div>
      <button class="mini-action ${followed ? "active" : ""}" type="button" data-action="subscribe" data-channel-id="${escapeAttr(channel.id)}" aria-label="${followed ? "Unsubscribe from" : "Subscribe to"} ${escapeAttr(channel.title)}" title="${followed ? "Subscribed" : "Subscribe"}">
        ${icon(followed ? "check" : "user-plus")}
      </button>
    </article>
  `;
}

function renderLoading(label) {
  return `
    <header class="view-header">
      <div>
        <p class="eyebrow">${escapeHtml(label)}</p>
        <h1 class="view-title">Loading</h1>
      </div>
    </header>
    ${renderSkeletonGrid()}
  `;
}

function renderSkeletonGrid() {
  return `<div class="skeleton-grid">${Array.from({ length: 8 }, () => '<div class="skeleton"></div>').join("")}</div>`;
}

function renderEmpty(title, message, iconName) {
  return `
    <section class="empty-state">
      <span data-icon="${escapeAttr(iconName)}" aria-hidden="true"></span>
      <h2>${escapeHtml(title)}</h2>
      <p class="empty-copy">${escapeHtml(message)}</p>
    </section>
  `;
}

function renderStatus(title, message, iconName) {
  return `
    <section class="status-panel">
      <span data-icon="${escapeAttr(iconName)}" aria-hidden="true"></span>
      <h2>${escapeHtml(title)}</h2>
      <p class="status-copy">${escapeHtml(message)}</p>
    </section>
  `;
}

function renderPlayer() {
  const video = state.currentVideo;
  const hasVideo = Boolean(video);

  document.body.classList.toggle("has-current", hasVideo);
  els.playerSource.textContent = hasVideo ? "YouTube music video" : "Ready";
  els.playerTitle.textContent = hasVideo ? video.title : "Choose a music video";
  els.playerChannel.textContent = hasVideo ? video.channelTitle : "Melodify";
  els.playerChannel.disabled = !hasVideo;
  els.trackArt.style.backgroundImage = hasVideo ? `url("${video.thumbnail}")` : "";
  els.playButtonIcon.innerHTML = icon(state.isPlaying ? "pause" : "play");
  els.loopButton.classList.toggle("active", state.loop);
  els.playerLike.disabled = !hasVideo;
  els.playerSubscribe.disabled = !hasVideo;
  els.youtubeLink.href = hasVideo ? `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}` : "https://www.youtube.com";

  if (hasVideo) {
    els.playerLike.classList.toggle("active", isLiked(video.id));
    els.playerLike.querySelector("span:last-child").textContent = isLiked(video.id) ? "Liked" : "Like";
    els.playerSubscribe.classList.toggle("active", isFollowing(video.channelId));
    els.playerSubscribe.querySelector("span:last-child").textContent = isFollowing(video.channelId) ? "Subscribed" : "Subscribe";
  } else {
    els.playerLike.classList.remove("active");
    els.playerSubscribe.classList.remove("active");
  }

  if (!hasVideo) {
    setPlayerPlaceholder();
  } else if (!playerBlocked) {
    els.emptyPlayer.classList.toggle("hidden", Boolean(ytPlayer));
  }
}

async function maybeLoadRouteData() {
  const activeCache = state.activeChannelId ? state.channelCache[state.activeChannelId] : null;
  if (
    state.route === "channel" &&
    state.activeChannelId &&
    shouldAutoLoadChannelPage(state.activeChannelId, activeCache)
  ) {
    channelAutoLoadRequests.set(state.activeChannelId, Date.now());
    loadChannelVideos(state.activeChannelId, true).catch(() => {});
  }

  if (state.route === "recommended" && !state.loading && !state.dailyPlaylists.playlists.length) {
    await loadRecommendations(false);
  }

  if (state.route === "following" || state.route === "recommended") {
    refreshFollowedChannelsCache(false);
  }
}

function shouldAutoLoadChannelPage(channelId, activeCache) {
  if (!channelId || activeCache?.loading) return false;
  const lastAttemptAt = Number(channelAutoLoadRequests.get(channelId) || 0);
  if (Date.now() - lastAttemptAt < CHANNEL_PAGE_AUTO_REFRESH_RETRY_MS) return false;
  const cachedVideos = uniqueVideos([...(activeCache?.videos || []), ...channelVideos(channelId)]).filter(isLikelyMusicVideo);
  return !cachedVideos.length || shouldRefreshChannel(channelId) || shouldDiscoverChannel(channelId);
}

async function runSearch(query, filter, options = {}) {
  const { force = false } = options;
  const importedFromInput = await importDirectSearchInput(query);
  if (importedFromInput) {
    const channel = channelFromVideo(importedFromInput);
    state.searchResults = {
      videos: filter === "channels" ? [] : [importedFromInput],
      channels: filter === "videos" ? [] : [channel]
    };
    state.error = "";
    state.loading = false;
    writeSearchCache(query, filter, state.searchResults);
    location.hash = "search";
    render();
    return;
  }

  const channelFromInput = parseChannelId(query);
  if (channelFromInput && !isFileMode()) {
    state.loading = true;
    state.error = "";
    render();
    try {
      const result = await refreshChannelLibrary(channelFromInput, { force: true, quiet: true, throwOnError: true });
      const videos = channelVideos(channelFromInput);
      state.searchResults = {
        videos: filter === "channels" ? [] : videos,
        channels: filter === "videos" && videos.length ? [] : [result.channel].filter(Boolean)
      };
      writeSearchCache(query, filter, state.searchResults);
    } catch (error) {
      state.error = friendlyFeedError(error);
    } finally {
      state.loading = false;
      location.hash = "search";
      render();
    }
    return;
  }

  const cached = getCachedSearchEntry(query, filter) || { videos: [], channels: [] };
  const local = mergeSearchResults(cached, cachedSearch(query, filter));
  const hasLocalResults = Boolean(local.videos.length || local.channels.length);
  if (!force && hasLocalResults) {
    state.searchResults = local;
    state.error = "";
    state.loading = false;
    render();
    if (isFileMode()) {
      writeSearchCache(query, filter, local);
      showToast("Searched saved cache.");
      return;
    }
    showToast("Showing cache while Melodify searches for more.");
  }

  if (isFileMode()) {
    state.searchResults = local;
    state.error = local.videos.length || local.channels.length ? "" : LOCAL_APP_HELP;
    state.loading = false;
    render();
    if (state.error) showToast(state.error);
    return;
  }

  state.loading = !hasLocalResults || force;
  state.error = "";
  render();

  try {
    const discovered = await discoverSearch(query, filter);
    const merged = mergeSearchResults(local, discovered);
    state.searchResults = merged;
    writeSearchCache(query, filter, merged);
    showToast(merged.videos.length || merged.channels.length ? "Discovered and cached new music videos." : "No matching music videos found yet.");
  } catch (error) {
    state.searchResults = local;
    state.error = local.videos.length || local.channels.length ? "" : friendlyDiscoveryError(error);
    if (local.videos.length || local.channels.length) writeSearchCache(query, filter, local);
    showToast(state.error || "Showing saved cache results.");
  } finally {
    state.loading = false;
    render();
  }
}

function mergeSearchResults(a, b) {
  const videos = rankSearchVideos([...(a?.videos || []), ...(b?.videos || [])], state.query);
  const channels = filterChannelsForQuery([...(a?.channels || []), ...(b?.channels || []), ...deriveChannelsFromVideos(videos, state.query)], state.query, videos);
  return { videos, channels };
}

async function discoverSearch(query, filter) {
  const imported = filter !== "channels" ? await discoverVideos(query) : [];
  let discoveredChannels = [];
  if (filter !== "videos" || !imported.length || shouldSearchCreatorsForQuery(query)) {
    try {
      discoveredChannels = await discoverChannels(query, { limit: filter === "channels" ? 4 : 2, followFirst: false, candidateVideos: imported, skipVideoFallback: false });
    } catch (error) {
      if (filter === "channels" || !imported.length) throw error;
    }
  }
  const creatorMatchedChannels = discoveredChannels.filter((channel) => creatorMatchesQuery(channel, query));
  const expanded = filter !== "channels" && (!imported.length || creatorMatchedChannels.length)
    ? await expandDiscoveredChannels(creatorMatchedChannels.length ? creatorMatchedChannels : discoveredChannels)
    : [];
  const indexedChannelVideos = filter !== "channels" ? videosFromCreatorIndex(query) : [];
  const followedChannelVideos = filter !== "channels" ? videosFromFollowedChannels(query) : [];
  const discoveredChannelVideos = uniqueVideos([
    ...followedChannelVideos,
    ...discoveredChannels.flatMap((channel) => channelVideos(channel.id)),
    ...expanded,
    ...indexedChannelVideos
  ]);
  const videos = filter !== "channels" ? rankSearchVideos([...imported, ...discoveredChannelVideos], query) : [];
  const channels = filter !== "videos" || !videos.length
    ? filterChannelsForQuery([...discoveredChannels, ...deriveChannelsFromVideos(videos, query)], query, videos)
    : [];
  return { videos, channels };
}

async function expandDiscoveredChannels(channels) {
  const videos = [];
  for (const channel of channels.slice(0, 2)) {
    videos.push(...await expandChannelDiscovery(channel.id, false));
  }
  return uniqueVideos(videos);
}

async function discoverVideos(query) {
  const responses = await Promise.allSettled([
    fetchDiscoveryText(query, "videos"),
    fetchDiscoveryText(query, "shorts")
  ]);
  const texts = responses.filter((result) => result.status === "fulfilled").map((result) => result.value);
  if (!texts.length) throw responses.find((result) => result.status === "rejected")?.reason || new Error("Discovery unavailable");
  const urls = uniqueStrings(texts.flatMap(extractYoutubeVideoUrls));
  const imported = await importVideosFromUrls(urls, { query, limit: VIDEO_SEARCH_IMPORT_LIMIT });
  return rankSearchVideos(imported, query);
}

async function discoverVideoUrls(query, type = "videos", limit = 18) {
  const text = await fetchDiscoveryText(query, type);
  return extractYoutubeVideoUrls(text).slice(0, limit);
}

async function importVideosFromUrls(urls, options = {}) {
  const { query = "", limit = VIDEO_SEARCH_IMPORT_LIMIT, enforceIntent = true } = options;
  const imported = [];
  const candidates = uniqueStrings(urls).slice(0, Math.max(limit * 3, limit));
  for (let index = 0; index < candidates.length && imported.length < limit; index += VIDEO_IMPORT_CONCURRENCY) {
    const batch = candidates.slice(index, index + VIDEO_IMPORT_CONCURRENCY);
    const results = await Promise.all(batch.map((url) => importVideoFromUrl(url, { quiet: true, updateView: false, requireMusic: true, query })));
    for (const video of results) {
      if (video && (!enforceIntent || matchesSearchIntent(video, query))) imported.push(video);
      if (imported.length >= limit) break;
    }
  }
  return uniqueVideos(imported);
}

async function discoverChannels(query, options = {}) {
  const { limit = 4, followFirst = false, candidateVideos = [], skipVideoFallback = false } = options;
  const text = await fetchDiscoveryText(query, "channels");
  const channelIds = extractYoutubeChannelIds(text);
  const channels = [];
  for (const channelId of channelIds.slice(0, limit)) {
    const result = await refreshChannelFeed(channelId, { force: true, quiet: true });
    if (!result?.channel) continue;
    channels.push(result.channel);
    rememberCreatorQuery(query, result.channel);
    if (followFirst && channels.length === 1) {
      state.followedChannels[channelId] = result.channel;
      persist();
    }
  }

  if (channels.length < limit && !skipVideoFallback) {
    const videos = candidateVideos.length ? candidateVideos : await discoverVideos(query);
    for (const channel of deriveChannelsFromVideos(videos, query)) {
      if (channels.some((item) => item.id === channel.id)) continue;
      const channelVideos = videos.filter((video) => video.channelId === channel.id);
      if (!channelVideos.length) continue;
      cacheChannel(channel, "discovery", false);
      cacheChannelVideos(channel.id, channelVideos, false, { markFetched: false });
      state.channelCache[channel.id] = { channel, videos: channelVideos, nextPageToken: "", loading: false };
      rememberCreatorQuery(query, channel);
      channels.push(channel);
      if (followFirst && channels.length === 1) {
        state.followedChannels[channel.id] = channel;
      }
      if (channels.length >= limit) break;
    }
    if (channels.length) persist();
  }

  if (channels.length) persist();
  return channels;
}

async function fetchDiscoveryText(query, type) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), SEARCH_DISCOVERY_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${DISCOVERY_PROXY_PATH}?type=${encodeURIComponent(type)}&q=${encodeURIComponent(query)}`, { cache: "no-store", signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Discovery failed (${response.status})`);
  return text;
}

function extractYoutubeVideoUrls(text) {
  const urls = new Set();
  const decoded = decodeHtmlEntities(text || "");
  collectYoutubeContentUrls(decoded).forEach((url) => urls.add(url));
  collectYoutubeContentUrls(decodeEscapedSearchText(decoded)).forEach((url) => urls.add(url));

  for (const target of extractSearchRedirectTargets(decoded)) {
    const normalized = normalizeYoutubeContentUrl(target);
    if (normalized) urls.add(normalized);
  }

  return [...urls];
}

function collectYoutubeContentUrls(text) {
  const urls = new Set();
  const directPattern = /https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?[^"'<> \n\r]+|shorts\/[A-Za-z0-9_-]{11})|youtu\.be\/[A-Za-z0-9_-]{11})/gi;
  for (const match of String(text || "").matchAll(directPattern)) {
    const normalized = normalizeYoutubeContentUrl(match[0]);
    if (normalized) urls.add(normalized);
  }

  const relativePattern = /(?:^|[^A-Za-z0-9_/-])(\/(?:watch\?[^"'<> \n\r]+|shorts\/[A-Za-z0-9_-]{11}))/gi;
  for (const match of String(text || "").matchAll(relativePattern)) {
    const normalized = normalizeYoutubeContentUrl(`https://www.youtube.com${match[1]}`);
    if (normalized) urls.add(normalized);
  }

  return [...urls];
}

function extractYoutubeChannelIds(text) {
  const ids = new Set();
  const decoded = decodeHtmlEntities(text || "");
  const directPattern = /(?:https?:\/\/(?:www\.|m\.)?youtube\.com)?\/channel\/(UC[A-Za-z0-9_-]{22})/gi;
  for (const match of decoded.matchAll(directPattern)) {
    ids.add(match[1]);
  }

  const rawChannelPattern = /(?:^|[^A-Za-z0-9_-])(UC[A-Za-z0-9_-]{22})(?:$|[^A-Za-z0-9_-])/g;
  for (const match of decoded.matchAll(rawChannelPattern)) {
    ids.add(match[1]);
  }

  for (const target of extractSearchRedirectTargets(decoded)) {
    const channelId = parseChannelId(target);
    if (channelId) ids.add(channelId);
  }

  return [...ids];
}

function extractSearchRedirectTargets(decoded) {
  const targets = [];
  const googleRedirectPattern = /(?:https?:\/\/www\.google\.com)?\/url\?[^"'<> \n\r]+/gi;
  for (const match of decoded.matchAll(googleRedirectPattern)) {
    const expanded = decodeSearchRedirect(match[0], "https://www.google.com");
    if (expanded) targets.push(expanded);
  }

  const bingRedirectPattern = /https?:\/\/www\.bing\.com\/ck\/a\?[^"'<> \n\r]+/gi;
  for (const match of decoded.matchAll(bingRedirectPattern)) {
    const expanded = decodeBingRedirect(match[0]);
    if (expanded) targets.push(expanded);
  }

  const duckRedirectPattern = /(?:(?:https?:)?\/\/duckduckgo\.com)?\/l\/\?[^"'<> \n\r]+/gi;
  for (const match of decoded.matchAll(duckRedirectPattern)) {
    const expanded = decodeSearchRedirect(match[0], "https://duckduckgo.com");
    if (expanded) targets.push(expanded);
  }

  return targets;
}

function decodeSearchRedirect(value, baseUrl) {
  try {
    const url = new URL(value, baseUrl);
    return url.searchParams.get("url") || url.searchParams.get("q") || url.searchParams.get("uddg") || url.searchParams.get("u") || "";
  } catch {
    return "";
  }
}

function decodeEscapedSearchText(value) {
  const cleaned = String(value || "")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/");
  try {
    return decodeURIComponent(cleaned.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
  } catch {
    return cleaned;
  }
}

function decodeBingRedirect(url) {
  try {
    const value = new URL(url).searchParams.get("u") || "";
    if (!value.startsWith("a1")) return "";
    const base64 = value.slice(2).replace(/-/g, "+").replace(/_/g, "/");
    return atob(base64);
  } catch {
    return "";
  }
}

function normalizeYoutubeWatchUrl(value) {
  const videoId = parseYoutubeVideoId(value);
  return videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : "";
}

function normalizeYoutubeContentUrl(value) {
  const videoId = parseYoutubeVideoId(value);
  if (!videoId) return "";
  return isYoutubeShortUrl(value)
    ? `https://www.youtube.com/shorts/${encodeURIComponent(videoId)}`
    : `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function isYoutubeShortUrl(value) {
  return /(?:youtube\.com\/shorts\/|^\/shorts\/)/i.test(String(value || ""));
}

function decodeHtmlEntities(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

async function importVideoFromUrl(value, options = {}) {
  const { quiet = false, updateView = true, requireMusic = false, query = "" } = options;
  const videoId = parseYoutubeVideoId(value);
  if (!videoId) {
    if (!quiet) showToast("Paste a YouTube video URL or video ID.");
    return null;
  }

  if (isFileMode()) {
    if (!quiet) showToast(LOCAL_APP_HELP);
    return null;
  }

  const metadataUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  const contentUrl = normalizeYoutubeContentUrl(value) || metadataUrl;
  try {
    const metadata = await fetchVideoMetadata(metadataUrl);
    const { video, channel } = videoFromOEmbed(videoId, contentUrl, metadata, { isShort: isYoutubeShortUrl(contentUrl) });
    const musicAccepted = isLikelyMusicVideo(video, query);
    if (requireMusic && !musicAccepted) {
      return null;
    }
    const searchGenreTags = queryGenreTerms(query);
    if (musicAccepted || searchGenreTags.length) {
      video.tags = [...new Set([...(video.tags || []), "music", ...searchGenreTags])];
    }
    cacheChannel(channel, "oembed", false);
    cacheVideo(video, "oembed", false);
    cacheChannelVideos(channel.id, [video], false, { markFetched: false });
    state.recommendations = [];
    state.dailyPlaylists = { date: "", playlists: [] };
    persist();

    if (updateView) {
      state.query = video.title;
      state.searchResults = { videos: [video], channels: [channel] };
      location.hash = "search";
      render();
    }
    if (!quiet) showToast(`Cached ${video.title}.`);
    return video;
  } catch (error) {
    if (!quiet) showToast(friendlyDiscoveryError(error));
    return null;
  }
}

async function importDirectSearchInput(query) {
  const videoId = parseYoutubeVideoId(query);
  if (!videoId || isFileMode()) return null;
  return importVideoFromUrl(query, { quiet: true, updateView: false });
}

async function fetchVideoMetadata(watchUrl) {
  const response = await fetch(`${OEMBED_PROXY_PATH}?url=${encodeURIComponent(watchUrl)}`, { cache: "no-store" });
  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {}
  if (!response.ok) throw new Error(data.error || text || `Metadata failed (${response.status})`);
  return data;
}

function videoFromOEmbed(videoId, watchUrl, metadata, options = {}) {
  const { isShort = false } = options;
  const authorName = metadata.author_name || "YouTube creator";
  const authorUrl = metadata.author_url || "";
  const channelId = parseChannelId(authorUrl) || pseudoChannelId(authorUrl || authorName);
  const title = metadata.title || "Untitled music video";
  const thumbnail = metadata.thumbnail_url || `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
  const channel = {
    id: channelId,
    title: authorName,
    description: authorUrl || "YouTube creator",
    thumbnail,
    url: authorUrl,
    subscriberCount: isRssChannelId(channelId) ? "RSS feed" : "Cached creator"
  };
  const video = {
    id: videoId,
    title,
    channelId,
    channelTitle: authorName,
    thumbnail,
    publishedAt: "",
    duration: "",
    durationSeconds: 0,
    embeddable: true,
    isShort,
    categoryId: MUSIC_CATEGORY_ID,
    tags: [...new Set(["youtube", "oembed", isShort ? "shorts" : "video", ...tokenize(title).slice(0, 8)])],
    watchUrl
  };
  return { video, channel };
}

function pseudoChannelId(value) {
  const slug = String(value || "youtube-creator")
    .toLowerCase()
    .replace(/^https?:\/\/(?:www\.)?youtube\.com\//, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `yt-${slug || "creator"}`;
}

function parseYoutubeVideoId(value) {
  const text = String(value || "").trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text;
  try {
    const url = new URL(text);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") return validYoutubeVideoId(url.pathname.split("/").filter(Boolean)[0]);
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") return validYoutubeVideoId(url.searchParams.get("v"));
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) return validYoutubeVideoId(parts[1]);
    }
  } catch {}
  const match = text.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);
  return validYoutubeVideoId(match?.[1]);
}

function validYoutubeVideoId(value) {
  return /^[A-Za-z0-9_-]{11}$/.test(value || "") ? value : "";
}

function friendlyDiscoveryError(error) {
  const message = error?.message || "";
  if (/Open Melodify with Open Melodify\.bat/i.test(message)) return LOCAL_APP_HELP;
  if (/Failed to fetch|NetworkError|Load failed|Not found|404|proxy/i.test(message)) return LOCAL_APP_HELP;
  return "Melodify could not discover new videos right now.";
}

async function loadChannelVideos(channelId, append) {
  const channel = findChannel(channelId) || { id: channelId, title: "Creator", description: "", thumbnail: "" };
  const storedIds = state.channelVideoIds[channelId] || [];
  const storedVideos = storedIds.map((id) => state.videoCache[id]).filter(Boolean);
  const existing = state.channelCache[channelId] || { channel, videos: storedVideos, nextPageToken: "", loading: false };

  if (channelId.startsWith("demo-")) {
    const videos = demoVideos.filter((video) => video.channelId === channelId);
    state.channelCache[channelId] = { channel, videos, nextPageToken: "", loading: false };
    cacheChannelVideos(channelId, videos, false, { markFetched: false });
    render();
    return;
  }

  if (!isRssChannelId(channelId)) {
    state.channelCache[channelId] = { channel, videos: storedVideos, nextPageToken: "", loading: false };
    render();
    expandChannelDiscovery(channelId, append).catch(() => {});
    return;
  }

  state.channelCache[channelId] = { ...existing, channel, videos: uniqueVideos([...(existing.videos || []), ...storedVideos]), loading: true };
  render();

  // Show cached videos immediately, then refresh in the background and append discoveries.
  refreshChannelLibrary(channelId, { force: true, quiet: append !== true })
    .catch(() => {})
    .finally(() => render());
}

async function expandChannelDiscovery(channelId, force) {
  const channel = findChannel(channelId);
  if (!channel || channel.id.startsWith("demo-")) return [];
  if (isFileMode()) {
    if (force) showToast("Open Melodify from the Desktop or Start Menu shortcut to find more channel videos.");
    return [];
  }
  if (!force && !shouldDiscoverChannel(channelId)) return [];

  const storedIds = state.channelVideoIds[channelId] || [];
  const storedVideos = storedIds.map((id) => state.videoCache[id]).filter(Boolean);
  const existing = state.channelCache[channelId] || { channel, videos: storedVideos, nextPageToken: "", loading: false };
  state.channelCache[channelId] = { ...existing, channel, videos: uniqueVideos([...(existing.videos || []), ...storedVideos]), loading: true };
  render();

  try {
    const query = channelDiscoveryQuery(channel);
    const [videoUrls, shortUrls] = await Promise.all([
      discoverVideoUrls(query, "channel-videos", CHANNEL_DISCOVERY_IMPORT_LIMIT),
      discoverVideoUrls(query, "shorts", CHANNEL_DISCOVERY_IMPORT_LIMIT)
    ]);
    const discovered = await importVideosFromUrls([...videoUrls, ...shortUrls], {
      query,
      limit: CHANNEL_DISCOVERY_IMPORT_LIMIT,
      enforceIntent: false
    });
    const imported = discovered
      .filter((video) => videoBelongsToChannel(video, channel))
      .map((video) => ({ ...video, channelId: channel.id, channelTitle: channel.title || video.channelTitle }));
    for (const video of imported) cacheVideo(video, "channel-discovery", false);

    const videos = uniqueVideos([...(existing.videos || []), ...storedVideos, ...imported]);
    cacheChannelVideos(channelId, videos, false, { markFetched: false });
    state.channelCache[channelId] = { channel, videos, nextPageToken: "", loading: false };
    state.channelDiscoveryFetchedAt[channelId] = Date.now();
    if (imported.length) {
      state.recommendations = [];
      state.dailyPlaylists = { date: "", playlists: [] };
    }
    persist();
    render();
    return imported;
  } catch (error) {
    state.channelCache[channelId] = { ...existing, channel, videos: uniqueVideos([...(existing.videos || []), ...storedVideos]), loading: false };
    state.channelDiscoveryFetchedAt[channelId] = Date.now();
    persist();
    render();
    if (force) showToast(friendlyDiscoveryError(error));
    return [];
  }
}

async function loadRecommendations(force) {
  const today = todayKey();
  if (!force && state.dailyPlaylists.date === today && state.dailyPlaylists.playlists.length) return;
  state.loading = true;
  render();

  const matrix = getMetadataMatrix();
  const allCached = rankVideos([...Object.values(state.videoCache), ...Object.values(state.likedVideos), ...demoVideos]);
  const likedRanked = rankVideos([...Object.values(state.likedVideos), ...allCached]);
  const followingRanked = rankVideos(allCached.filter((video) => isFollowing(video.channelId)));
  const profileRanked = rankVideos(allCached.filter((video) => !isLiked(video.id)));
  const terms = topMatrixTerms(matrix, 3);
  const theme = terms.length ? terms.join(", ") : "cached likes and follows";

  const playlists = [
    { id: "daily-cache", title: "Daily Cache Mix", query: `Related to ${theme}`, videoIds: profileRanked.slice(0, 14).map((video) => video.id) },
    { id: "liked-radio", title: "Liked Radio", query: "Built from your liked videos", videoIds: likedRanked.slice(0, 14).map((video) => video.id) },
    { id: "following-finds", title: "Following Finds", query: "Built from followed channel cache", videoIds: (followingRanked.length ? followingRanked : profileRanked).slice(0, 14).map((video) => video.id) }
  ];

  state.dailyPlaylists = { date: today, playlists };
  state.recommendations = getRenderedDailyPlaylists().flatMap((playlist) => playlist.videos).slice(0, 36);
  cacheVideos(state.recommendations, "recommendations", false);
  persist();
  state.loading = false;
  render();
}

function getRenderedDailyPlaylists() {
  const playlists = state.dailyPlaylists.playlists || [];
  if (playlists.length) {
    return playlists
      .map((playlist) => ({
        ...playlist,
        videos: (playlist.videoIds || []).map((id) => state.videoCache[id]).filter(isPlayableVideo)
      }))
      .filter((playlist) => playlist.videos.length);
  }
  const videos = getLocalRecommendations();
  return [{ id: "local-mix", title: "Cached Mix", query: "Saved from your likes and follows", videos }];
}

function buildDailyPlaylistQueries() {
  const liked = Object.values(state.likedVideos);
  const topTerms = topProfileTerms(liked.length ? liked : Object.values(state.videoCache), 6);
  const [a = "music", b = "electronic", c = "official", d = "remix", e = "visualizer", f = "song"] = topTerms;
  return [
    { id: "daily-mix", title: "Daily Mix", query: `${a} ${b} music video` },
    { id: "liked-radio", title: "Liked Radio", query: `${a} ${c} ${d} music video` },
    { id: "deep-cuts", title: "Deep Cuts", query: `${b} ${e} ${f} music video` }
  ];
}

function topProfileTerms(videos, count) {
  const weights = new Map();
  for (const video of videos || []) {
    addTokens(weights, `${video.title} ${video.channelTitle} ${(video.tags || []).join(" ")}`, 1);
  }
  return [...weights.entries()].sort((a, b) => b[1] - a[1]).slice(0, count).map(([token]) => token);
}

async function refreshFollowedChannelsCache(force) {
  if (isFileMode()) {
    if (force) showToast("Open Melodify from the Desktop or Start Menu shortcut to refresh channel feeds.");
    return;
  }
  if (followedChannelRefreshInFlight) return;
  followedChannelRefreshInFlight = true;
  try {
    for (const channel of Object.values(state.followedChannels)) {
      try {
        if (state.channelCache[channel.id]?.loading) continue;
        if (!force && !shouldRefreshChannel(channel.id) && !shouldDiscoverChannel(channel.id)) continue;
        await refreshChannelLibrary(channel.id, { force, quiet: !force });
      } catch {
        // One flaky creator should not stop the rest of the followed refresh.
      }
    }
  } finally {
    followedChannelRefreshInFlight = false;
  }
  if (force) showToast("Followed channel feeds refreshed.");
}

async function refreshChannelLibrary(channelId, options = {}) {
  const { force = false, quiet = false, throwOnError = false } = options;
  let feedResult = null;
  if (isRssChannelId(channelId)) {
    feedResult = await refreshChannelFeed(channelId, { force, quiet, throwOnError });
  }
  if (force || shouldDiscoverChannel(channelId)) {
    await expandChannelDiscovery(channelId, force);
  }
  return {
    channel: findChannel(channelId) || feedResult?.channel || null,
    videos: channelVideos(channelId)
  };
}

async function refreshChannelFeed(channelId, options = {}) {
  const { force = false, quiet = false, throwOnError = false } = options;
  if (!isRssChannelId(channelId)) return null;

  const baseChannel = findChannel(channelId) || {
    id: channelId,
    title: "YouTube creator",
    description: "YouTube RSS feed",
    thumbnail: "",
    feedUrl: feedUrlForChannel(channelId)
  };
  const storedIds = state.channelVideoIds[channelId] || [];
  const storedVideos = storedIds.map((id) => state.videoCache[id]).filter(Boolean);
  const existing = state.channelCache[channelId] || { channel: baseChannel, videos: storedVideos, nextPageToken: "", loading: false };

  if (!force && storedVideos.length && !shouldRefreshChannel(channelId)) {
    state.channelCache[channelId] = { channel: baseChannel, videos: storedVideos, nextPageToken: "", loading: false };
    return { channel: baseChannel, videos: storedVideos };
  }

  if (isFileMode()) {
    const message = "Open Melodify from the Desktop or Start Menu shortcut to refresh channel feeds.";
    state.channelFeedErrors[channelId] = message;
    if (!quiet) showToast(message);
    if (throwOnError) throw new Error(message);
    return null;
  }

  state.channelCache[channelId] = {
    ...existing,
    channel: baseChannel,
    videos: uniqueVideos([...(existing.videos || []), ...storedVideos]),
    loading: true
  };
  render();

  try {
    const xml = await fetchChannelFeedXml(channelId);
    const parsed = parseChannelFeed(xml, channelId);
    const videos = uniqueVideos([...parsed.videos, ...storedVideos]);
    const channel = {
      ...baseChannel,
      ...parsed.channel,
      thumbnail: parsed.channel.thumbnail || baseChannel.thumbnail || videos[0]?.thumbnail || "",
      feedUrl: feedUrlForChannel(channelId)
    };
    cacheChannel(channel, "rss", false);
    cacheChannelVideos(channelId, videos, false, { markFetched: true });
    state.channelCache[channelId] = { channel, videos, nextPageToken: "", loading: false };
    state.channelFeedErrors[channelId] = "";
    state.recommendations = [];
    state.dailyPlaylists = { date: "", playlists: [] };
    persist();
    return { channel, videos };
  } catch (error) {
    const message = friendlyFeedError(error);
    state.channelFeedErrors[channelId] = message;
    state.channelCache[channelId] = {
      ...existing,
      channel: baseChannel,
      videos: uniqueVideos([...(existing.videos || []), ...storedVideos]),
      nextPageToken: "",
      loading: false,
      error: message
    };
    persist();
    if (!quiet) showToast(message);
    if (throwOnError) throw error;
    return null;
  }
}

async function fetchChannelFeedXml(channelId) {
  const url = `${FEED_PROXY_PATH}?channelId=${encodeURIComponent(channelId)}`;
  const response = await fetch(url, { cache: "no-store" });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Feed request failed (${response.status})`);
  }
  return text;
}

function parseChannelFeed(xmlText, fallbackChannelId) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) {
    throw new Error("Feed unavailable");
  }

  const feed = doc.documentElement;
  const entries = elementsByLocal(feed, "entry");
  const firstEntry = entries[0] || feed;
  const channelId = textByLocal(firstEntry, "channelId") || fallbackChannelId;
  const channelTitle = textByLocal(firstEntry, "channelTitle") || textByLocal(feed, "title") || "YouTube creator";
  const videos = entries
    .map((entry) => {
      const id = textByLocal(entry, "videoId");
      if (!id) return null;
      const title = textByLocal(entry, "title") || textByLocal(entry, "description") || "Untitled music video";
      const thumbnail = firstElementByLocal(entry, "thumbnail")?.getAttribute("url") || `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
      const link = elementsByLocal(entry, "link").find((item) => item.getAttribute("href"))?.getAttribute("href") || `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
      return {
        id,
        title,
        channelId,
        channelTitle,
        thumbnail,
        publishedAt: textByLocal(entry, "published") || textByLocal(entry, "updated") || "",
        duration: "",
        durationSeconds: 0,
        embeddable: true,
        categoryId: MUSIC_CATEGORY_ID,
        tags: ["rss", "youtube"],
        watchUrl: link
      };
    })
    .filter(Boolean);

  return {
    channel: {
      id: channelId,
      title: channelTitle,
      description: "YouTube RSS feed",
      thumbnail: videos[0]?.thumbnail || "",
      feedUrl: feedUrlForChannel(channelId),
      subscriberCount: "RSS feed"
    },
    videos
  };
}

function elementsByLocal(node, localName) {
  return Array.from(node.getElementsByTagName("*")).filter((element) => element.localName === localName || element.nodeName.split(":").pop() === localName);
}

function firstElementByLocal(node, localName) {
  return elementsByLocal(node, localName)[0] || null;
}

function textByLocal(node, localName) {
  return firstElementByLocal(node, localName)?.textContent?.trim() || "";
}

function parseChannelId(value) {
  const match = String(value || "").trim().match(/(?:^|[/=])((?:UC)[A-Za-z0-9_-]{22})(?:$|[/?#&])/i) || String(value || "").trim().match(/^(UC[A-Za-z0-9_-]{22})$/i);
  return match ? match[1] : "";
}

function isRssChannelId(channelId = "") {
  return /^UC[A-Za-z0-9_-]{22}$/.test(channelId);
}

function feedUrlForChannel(channelId) {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
}

function isFileMode() {
  return window.location.protocol === "file:";
}

function channelFeedStatus(channelId) {
  if (!isRssChannelId(channelId)) return "Cached";
  if (state.channelFeedErrors[channelId]) return "Feed unavailable";
  const fetchedAt = Number(state.channelFetchedAt[channelId] || 0);
  if (!fetchedAt) return "Cached";
  return Date.now() - fetchedAt <= CHANNEL_CACHE_TTL_MS ? "Updated this hour" : "Cached";
}

function shouldDiscoverChannel(channelId) {
  if (!channelId || channelId.startsWith("demo-")) return false;
  const fetchedAt = Number(state.channelDiscoveryFetchedAt[channelId] || 0);
  return !fetchedAt || Date.now() - fetchedAt > CHANNEL_CACHE_TTL_MS;
}

function channelDiscoveryQuery(channel) {
  const handle = channelHandle(channel);
  return uniqueStrings([channel.title, handle].filter((item) => item && item !== "YouTube creator"))
    .filter(Boolean)
    .join(" ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || channel.id;
}

function channelHandle(channel) {
  const source = `${channel?.url || ""} ${channel?.description || ""}`;
  const handleMatch = source.match(/youtube\.com\/@([^/?#\s]+)/i) || source.match(/(^|\s)@([A-Za-z0-9._-]+)/);
  return (handleMatch?.[2] || handleMatch?.[1] || "").replace(/^@/, "");
}

function videoBelongsToChannel(video, channel) {
  if (!video || !channel) return false;
  if (video.channelId === channel.id) return true;
  const videoTitle = normalizeCreatorKey(video.channelTitle);
  const channelTitle = normalizeCreatorKey(channel.title);
  if (videoTitle && channelTitle && (videoTitle === channelTitle || videoTitle.includes(channelTitle) || channelTitle.includes(videoTitle))) return true;
  const channelUrl = normalizeCreatorKey(channel.url || channel.description);
  return Boolean(channelUrl && videoTitle && channelUrl.includes(videoTitle));
}

function demoSearch(query, filter) {
  const text = query.toLowerCase();
  const videos = filter !== "channels"
    ? demoVideos.filter((video) => searchable(video).includes(text))
    : [];
  const channels = filter !== "videos"
    ? demoChannels.filter((channel) => searchable(channel).includes(text))
    : [];
  return {
    videos: videos.length ? videos : demoVideos,
    channels: channels.length ? channels : demoChannels
  };
}

function cachedSearch(query, filter) {
  const matrix = getMetadataMatrix();
  const followedVideos = filter !== "channels" ? videosFromFollowedChannels(query) : [];
  const indexedVideos = filter !== "channels" ? videosFromCreatorIndex(query) : [];
  const matchedVideos = filter !== "channels" ? rankSearchVideos([...followedVideos, ...indexedVideos, ...searchMetadataRows(matrix.videoRows, query).map((row) => row.item)], query) : [];
  const shouldIncludeChannels = filter !== "videos" || !matchedVideos.length;
  const indexedChannels = shouldIncludeChannels ? channelsFromCreatorIndex(query) : [];
  const matchedChannels = shouldIncludeChannels ? uniqueChannels([...indexedChannels, ...searchMetadataRows(matrix.channelRows, query).map((row) => row.item)]).filter((channel) => matchesSearchIntent(channel, query)) : [];
  const derivedChannels = deriveChannelsFromVideos(matchedVideos, query);
  return {
    videos: filter !== "channels"
      ? matchedVideos
      : [],
    channels: shouldIncludeChannels
      ? filterChannelsForQuery([...matchedChannels, ...derivedChannels], query, matchedVideos).slice(0, 12)
      : []
  };
}

function getCachedSearchEntry(query, filter) {
  const entry = state.searchCache[searchCacheKey(query, filter)];
  if (!entry) return null;
  if (Date.now() - Number(entry.fetchedAt || 0) > SEARCH_CACHE_TTL_MS) return null;
  const videos = rankSearchVideos((entry.videoIds || []).map((id) => state.videoCache[id]).filter(Boolean), query);
  const channels = filterChannelsForQuery((entry.channelIds || []).map((id) => state.cachedChannels[id]).filter(Boolean), query, videos);
  if (!videos.length && !channels.length) return null;
  return { videos, channels };
}

function writeSearchCache(query, filter, results) {
  state.searchCache[searchCacheKey(query, filter)] = {
    query,
    filter,
    videoIds: (results.videos || []).map((video) => video.id).filter(Boolean),
    channelIds: (results.channels || []).map((channel) => channel.id).filter(Boolean),
    fetchedAt: Date.now()
  };
  persist();
}

function searchCacheKey(query, filter) {
  return `${filter}:${query.trim().toLowerCase()}`;
}

function deriveChannelsFromVideos(videos, query) {
  const byId = new Map();
  for (const video of videos) {
    const channel = channelFromVideo(video);
    if (!channel.id) continue;
    if (!matchesSearchIntent(video, query) && !matchesSearchIntent(channel, query)) continue;
    byId.set(channel.id, { ...state.cachedChannels[channel.id], ...channel });
  }
  return [...byId.values()].slice(0, 8);
}

function rememberCreatorQuery(query, channel) {
  if (!channel?.id) return;
  const keys = new Set([
    normalizeCreatorKey(query),
    normalizeCreatorKey(channel.title),
    ...tokenize(channel.title).map(normalizeCreatorKey)
  ].filter(Boolean));
  for (const key of keys) {
    const existing = state.creatorIndex[key] || [];
    state.creatorIndex[key] = [...new Set([...existing, channel.id])].slice(0, 12);
  }
}

function channelsFromCreatorIndex(query) {
  const keys = new Set([normalizeCreatorKey(query), ...tokenize(query).map(normalizeCreatorKey)].filter(Boolean));
  const ids = new Set();
  for (const key of keys) {
    for (const id of state.creatorIndex[key] || []) ids.add(id);
  }
  return [...ids].map((id) => state.cachedChannels[id]).filter(Boolean);
}

function videosFromCreatorIndex(query) {
  return uniqueVideos(channelsFromCreatorIndex(query).flatMap((channel) => channelVideos(channel.id)));
}

function videosFromFollowedChannels(query) {
  return uniqueVideos(Object.keys(state.followedChannels).flatMap((channelId) => channelVideos(channelId)))
    .filter((video) => matchesSearchIntent(video, query));
}

function shouldSearchCreatorsForQuery(query) {
  if (queryGenreTerms(query).length) return false;
  const tokens = queryIntentTokens(query);
  if (!tokens.length || tokens.length > 3) return false;
  const text = String(query || "").toLowerCase();
  if (hasTermSignal(text, MUSIC_SIGNAL_TERMS)) return false;
  return true;
}

function creatorMatchesQuery(channel, query) {
  if (!channel) return false;
  const key = normalizeCreatorKey(query);
  if (!key) return false;
  const title = normalizeCreatorKey(channel.title);
  const url = normalizeCreatorKey(channel.url || channel.description);
  return Boolean(
    (title && (title === key || title.includes(key) || key.includes(title))) ||
    (url && url.includes(key))
  );
}

function channelVideos(channelId) {
  return (state.channelVideoIds[channelId] || []).map((id) => state.videoCache[id]).filter(Boolean);
}

function normalizeCreatorKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function primeCache() {
  cacheChannels(demoChannels, "demo", false);
  cacheVideos(demoVideos, "demo", false);
  cacheChannels(Object.values(state.followedChannels), "saved", false);
  cacheVideos(Object.values(state.likedVideos), "saved", false);
  cacheVideos(state.recommendations, "saved", false);
  for (const channel of Object.values(state.cachedChannels)) rememberCreatorQuery(channel.title, channel);
  for (const [channelId, ids] of Object.entries(state.channelVideoIds)) {
    const channel = state.cachedChannels[channelId];
    if (channel) rememberCreatorQuery(channel.title, channel);
    cacheVideos((ids || []).map((id) => state.videoCache[id]).filter(Boolean), "saved", false);
  }
  if (state.currentVideo) cacheVideo(state.currentVideo, "current", false);
  for (const cache of Object.values(state.channelCache)) {
    if (cache?.channel) cacheChannel(cache.channel, "channel", false);
    if (cache?.videos?.length) cacheChannelVideos(cache.channel?.id, cache.videos, false, { markFetched: false });
  }
}

function pruneNonMusicCache() {
  let changed = false;
  for (const [id, video] of Object.entries(state.videoCache)) {
    if (!isLikelyMusicVideo(video)) {
      delete state.videoCache[id];
      delete state.likedVideos[id];
      changed = true;
    }
  }

  for (const [id, video] of Object.entries(state.likedVideos)) {
    if (!isLikelyMusicVideo(video)) {
      delete state.likedVideos[id];
      changed = true;
    }
  }

  for (const [channelId, ids] of Object.entries(state.channelVideoIds)) {
    const filtered = (ids || []).filter((id) => state.videoCache[id]);
    if (filtered.length !== (ids || []).length) {
      state.channelVideoIds[channelId] = filtered;
      changed = true;
    }
  }

  for (const cache of Object.values(state.channelCache)) {
    if (!cache?.videos) continue;
    const filtered = cache.videos.filter((video) => state.videoCache[video.id] || isLikelyMusicVideo(video));
    if (filtered.length !== cache.videos.length) {
      cache.videos = filtered;
      changed = true;
    }
  }

  for (const [key, entry] of Object.entries(state.searchCache)) {
    const videoIds = (entry.videoIds || []).filter((id) => state.videoCache[id]);
    if (videoIds.length !== (entry.videoIds || []).length) {
      if (!videoIds.length && !(entry.channelIds || []).length) {
        delete state.searchCache[key];
      } else {
        entry.videoIds = videoIds;
      }
      changed = true;
    }
  }

  if (state.currentVideo && !state.videoCache[state.currentVideo.id] && !isLikelyMusicVideo(state.currentVideo)) {
    state.currentVideo = null;
    state.queue = [];
    state.queueIndex = -1;
    changed = true;
  }

  if (changed) {
    metadataMatrix = null;
    persist();
  }
}

function cacheVideos(videos, source = "seen", shouldPersist = true) {
  for (const video of videos || []) cacheVideo(video, source, false);
  if (shouldPersist) persist();
}

function cacheVideo(video, source = "seen", shouldPersist = true) {
  if (!video?.id) return;
  if (source !== "demo" && !isLikelyMusicVideo(video)) return;
  if (video.channelId) cacheChannel(channelFromVideo(video), source, false);
  const existing = state.videoCache[video.id] || {};
  const sources = new Set([...(existing.sources || []), source]);
  state.videoCache[video.id] = {
    ...existing,
    ...compactVideo(video),
    embeddable: video.embeddable !== false,
    sources: [...sources],
    firstSeenAt: existing.firstSeenAt || new Date().toISOString(),
    lastSeenAt: new Date().toISOString()
  };
  if (shouldPersist) persist();
}

function compactVideo(video) {
  return {
    id: video.id,
    title: video.title || "Untitled music video",
    channelId: video.channelId || "",
    channelTitle: video.channelTitle || "YouTube creator",
    thumbnail: video.thumbnail || "",
    publishedAt: video.publishedAt || "",
    duration: video.duration || "",
    durationSeconds: Number(video.durationSeconds || 0),
    embeddable: video.embeddable !== false,
    isShort: Boolean(video.isShort),
    categoryId: video.categoryId || "",
    tags: Array.isArray(video.tags) ? video.tags.slice(0, 20) : [],
    viewCount: video.viewCount || "",
    watchUrl: video.watchUrl || (video.id ? `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}` : "")
  };
}

function cacheChannels(channels, source = "seen", shouldPersist = true) {
  for (const channel of channels || []) cacheChannel(channel, source, false);
  if (shouldPersist) persist();
}

function cacheChannel(channel, source = "seen", shouldPersist = true) {
  if (!channel?.id) return;
  const existing = state.cachedChannels[channel.id] || {};
  const sources = new Set([...(existing.sources || []), source]);
  state.cachedChannels[channel.id] = {
    ...existing,
    id: channel.id,
    title: channel.title || "YouTube creator",
    description: channel.description || "",
    thumbnail: channel.thumbnail || "",
    uploadsPlaylistId: channel.uploadsPlaylistId || uploadsPlaylistIdFromChannelId(channel.id),
    feedUrl: channel.feedUrl || (isRssChannelId(channel.id) ? feedUrlForChannel(channel.id) : ""),
    url: channel.url || channel.authorUrl || existing.url || "",
    subscriberCount: channel.subscriberCount || "",
    sources: [...sources],
    firstSeenAt: existing.firstSeenAt || new Date().toISOString(),
    lastSeenAt: new Date().toISOString()
  };
  rememberCreatorQuery(channel.title, state.cachedChannels[channel.id]);
  if (shouldPersist) persist();
}

function cacheChannelVideos(channelId, videos, shouldPersist = true, options = {}) {
  if (!channelId) return;
  const markFetched = options.markFetched !== false;
  cacheVideos(videos, "channel", false);
  const existing = state.channelVideoIds[channelId] || [];
  const seen = new Set(existing);
  for (const video of videos || []) {
    if (video?.id && state.videoCache[video.id]) seen.add(video.id);
  }
  state.channelVideoIds[channelId] = [...seen];
  if (markFetched) state.channelFetchedAt[channelId] = Date.now();
  if (shouldPersist) persist();
}

function reEnableCachedVideos() {
  for (const video of Object.values(state.videoCache)) {
    if (video) video.embeddable = true;
  }
  for (const video of Object.values(state.likedVideos)) {
    if (video) video.embeddable = true;
  }
  for (const cache of Object.values(state.channelCache)) {
    for (const video of cache?.videos || []) {
      if (video) video.embeddable = true;
    }
  }
}

function shouldRefreshChannel(channelId) {
  if (!isRssChannelId(channelId)) return false;
  const fetchedAt = Number(state.channelFetchedAt[channelId] || 0);
  return !fetchedAt || Date.now() - fetchedAt > CHANNEL_CACHE_TTL_MS;
}

async function getUploadsPlaylistId(channel) {
  if (channel.uploadsPlaylistId) return channel.uploadsPlaylistId;
  const derived = uploadsPlaylistIdFromChannelId(channel.id);
  if (derived) {
    cacheChannel({ ...channel, uploadsPlaylistId: derived }, "uploads", false);
    return derived;
  }
  return "";
}

function uploadsPlaylistIdFromChannelId(channelId = "") {
  return channelId.startsWith("UC") ? `UU${channelId.slice(2)}` : "";
}

function rememberUnavailableVideo(video, code, shouldPersist = true) {
  if (!video?.id) return;
  rememberUnavailableId(video.id, code, false);
  cacheVideo({ ...video, embeddable: true }, "playback-error", false);
  if (shouldPersist) persist();
}

function rememberUnavailableId(id, code, shouldPersist = true) {
  if (!id) return;
  const existing = state.unavailableVideos[id] || {};
  state.unavailableVideos[id] = {
    ...existing,
    id,
    code,
    markedAt: new Date().toISOString()
  };
  state.sessionBlockedVideos[id] = true;
  if (shouldPersist) persist();
}

async function playVideo(video, queue) {
  cacheVideo(video, "play", false);
  const nextQueue = uniqueVideos(Array.isArray(queue) && queue.length ? queue : [video]);
  state.queue = nextQueue;
  state.queueIndex = Math.max(0, state.queue.findIndex((item) => item.id === video.id));

  if (!isPlayableVideo(video)) {
    const nextIndex = findNextPlayableIndex(1);
    if (nextIndex >= 0 && state.queue[nextIndex]?.id !== video.id) {
      showToast("Skipping an unavailable video.");
      state.queueIndex = nextIndex;
      await playVideo(state.queue[nextIndex], state.queue);
    } else {
      showToast("YouTube says this video cannot play inside Melodify.");
    }
    return;
  }

  playerBlocked = false;
  state.currentVideo = video;
  persist();
  renderPlayer();
  ensurePlayer();

  if (ytPlayer && playerReady) {
    ytPlayer.loadVideoById(video.id);
  }
}

function ensurePlayer() {
  if (!ytReady || ytPlayer || !state.currentVideo) return;
  if (window.location.protocol === "file:") {
    handleFileModePlayer();
    return;
  }

  const playerVars = {
    enablejsapi: 1,
    rel: 0,
    playsinline: 1,
    widget_referrer: getPlayerIdentity()
  };
  playerVars.origin = getPlayerIdentity();

  createPlayerIframe(state.currentVideo.id, playerVars);
  ytPlayer = new window.YT.Player("youtube-player", {
    events: {
      onReady: () => {
        playerReady = true;
        els.emptyPlayer.classList.add("hidden");
      },
      onStateChange: (event) => {
        const YTState = window.YT.PlayerState;
        state.isPlaying = event.data === YTState.PLAYING;
        if (event.data === YTState.PAUSED || event.data === YTState.CUED) state.isPlaying = false;
        if (event.data === YTState.ENDED) {
          state.isPlaying = false;
          if (state.loop) {
            ytPlayer.seekTo(0);
            ytPlayer.playVideo();
          } else {
            playAdjacent(1);
          }
        }
        renderPlayer();
      },
      onError: (event) => {
        state.isPlaying = false;
        renderPlayer();
        handlePlayerError(event.data);
      }
    }
  });
  renderPlayer();
}

function handleFileModePlayer() {
  playerBlocked = true;
  resetPlayerElement();
  setPlayerFallback(
    "Open Melodify from the launcher",
    "YouTube blocks embedded playback when this page is opened as a file. Use the Melodify Desktop or Start Menu shortcut, or deploy Melodify to HTTPS.",
    153
  );
  if (!fileModeToastShown) {
    showToast(LOCAL_PLAYER_HELP);
    fileModeToastShown = true;
  }
}

function createPlayerIframe(videoId, playerVars) {
  resetPlayerElement();
  const iframe = document.createElement("iframe");
  iframe.id = "youtube-player";
  iframe.title = "YouTube video player";
  iframe.width = "400";
  iframe.height = "225";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${new URLSearchParams(playerVars).toString()}`;
  els.emptyPlayer.before(iframe);
}

function resetPlayerElement() {
  const existing = document.getElementById("youtube-player");
  if (existing) existing.remove();
  playerReady = false;
}

function getPlayerIdentity() {
  if (window.location.origin && window.location.origin !== "null") {
    return window.location.origin;
  }
  return "https://melodify.local";
}

function handlePlayerError(code) {
  if (PLAYER_UNAVAILABLE_ERRORS.has(Number(code)) && state.currentVideo) {
    rememberUnavailableVideo(state.currentVideo, code, false);
    const skipped = playAdjacent(1, true);
    if (skipped) {
      showToast("Skipped an unavailable video.");
      persist();
      return;
    }
  }

  playerBlocked = true;
  if (ytPlayer && typeof ytPlayer.destroy === "function") {
    try {
      ytPlayer.destroy();
    } catch {}
  }
  ytPlayer = null;
  resetPlayerElement();

  const fileMessage = window.location.protocol === "file:"
    ? "Chrome opened Melodify as a file. YouTube needs an app address with a referrer before it will play embedded videos."
    : "YouTube blocked the embedded player for this video or this browser session.";

  setPlayerFallback(
    code === 153 ? "Player needs an app address" : "YouTube cannot play this here",
    code === 153 ? fileMessage : "Open the video on YouTube or choose another music video.",
    code
  );
  showToast(code === 153 ? "YouTube blocked the file-based player. Use the launcher or deploy Melodify to HTTPS." : "YouTube could not play that video inside Melodify.");
}

function setPlayerPlaceholder() {
  playerBlocked = false;
  els.emptyPlayer.className = "empty-player";
  els.emptyPlayer.innerHTML = icon("music");
}

function setPlayerFallback(title, message, code) {
  const youtubeUrl = state.currentVideo ? `https://www.youtube.com/watch?v=${encodeURIComponent(state.currentVideo.id)}` : "https://www.youtube.com";
  els.emptyPlayer.className = "empty-player player-fallback";
  els.emptyPlayer.hidden = false;
  els.emptyPlayer.innerHTML = `
    <div class="player-fallback-copy">
      <span data-icon="alert" aria-hidden="true"></span>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      ${code ? `<p class="meta">YouTube error ${escapeHtml(code)}</p>` : ""}
      <a class="secondary-button" href="${escapeAttr(youtubeUrl)}" target="_blank" rel="noreferrer">
        <span data-icon="external" aria-hidden="true"></span>
        <span>Open on YouTube</span>
      </a>
    </div>
  `;
  installIcons(els.emptyPlayer);
}

function togglePlayback() {
  if (!state.currentVideo) {
    const first = lastVisibleVideos[0] || demoVideos[0];
    playVideo(first, lastVisibleVideos.length ? lastVisibleVideos : demoVideos);
    return;
  }

  ensurePlayer();
  if (!ytPlayer || !playerReady) return;
  if (state.isPlaying) {
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
}

function playAdjacent(direction) {
  if (!state.queue.length) return false;
  const nextIndex = findNextPlayableIndex(direction);
  if (nextIndex < 0) {
    showToast("No playable videos left in this queue.");
    return false;
  }
  const next = state.queue[nextIndex];
  state.queueIndex = nextIndex;
  if (next) {
    playVideo(next, state.queue);
    return true;
  }
  return false;
}

function findNextPlayableIndex(direction) {
  if (!state.queue.length) return -1;
  const start = Math.max(0, state.queueIndex);
  for (let step = 1; step <= state.queue.length; step += 1) {
    const index = (start + direction * step + state.queue.length) % state.queue.length;
    if (isPlayableVideo(state.queue[index])) return index;
  }
  return -1;
}

function toggleLike(video) {
  cacheVideo(video, "liked", false);
  if (isLiked(video.id)) {
    delete state.likedVideos[video.id];
  } else {
    state.likedVideos[video.id] = video;
  }
  state.recommendations = [];
  state.dailyPlaylists = { date: "", playlists: [] };
  persist();
  render();
}

function toggleFollow(channel) {
  if (!channel?.id) return;
  cacheChannel(channel, "following", false);
  if (isFollowing(channel.id)) {
    delete state.followedChannels[channel.id];
  } else {
    state.followedChannels[channel.id] = channel;
  }
  state.recommendations = [];
  state.dailyPlaylists = { date: "", playlists: [] };
  persist();
  render();
}

function channelFromVideo(video) {
  return {
    id: video.channelId,
    title: video.channelTitle,
    description: "YouTube creator",
    thumbnail: video.thumbnail,
    uploadsPlaylistId: uploadsPlaylistIdFromChannelId(video.channelId)
  };
}

function findVideo(id) {
  if (!id) return null;
  return (
    state.searchResults.videos.find((video) => video.id === id) ||
    state.videoCache[id] ||
    Object.values(state.likedVideos).find((video) => video.id === id) ||
    state.recommendations.find((video) => video.id === id) ||
    Object.values(state.channelCache).flatMap((cache) => cache.videos || []).find((video) => video.id === id) ||
    demoVideos.find((video) => video.id === id) ||
    null
  );
}

function findChannel(id) {
  if (!id) return null;
  return (
    state.searchResults.channels.find((channel) => channel.id === id) ||
    state.cachedChannels[id] ||
    Object.values(state.followedChannels).find((channel) => channel.id === id) ||
    Object.values(state.channelCache).map((cache) => cache.channel).find((channel) => channel?.id === id) ||
    demoChannels.find((channel) => channel.id === id) ||
    demoVideos.map(channelFromVideo).find((channel) => channel.id === id) ||
    null
  );
}

function isLiked(videoId) {
  return Boolean(state.likedVideos[videoId]);
}

function isFollowing(channelId) {
  return Boolean(state.followedChannels[channelId]);
}

function isUnavailable(videoId) {
  return Boolean(state.sessionBlockedVideos[videoId]);
}

function isPlayableVideo(video) {
  return Boolean(video?.id) && !isUnavailable(video.id);
}

function getLocalRecommendations() {
  const pool = uniqueVideos([...demoVideos, ...Object.values(state.videoCache), ...Object.values(state.likedVideos), ...state.searchResults.videos]);
  const ranked = rankVideos(pool).filter((video) => !isLiked(video.id));
  return ranked.length ? ranked : demoVideos;
}

function rankVideos(videos) {
  const matrix = getMetadataMatrix();
  return [...uniqueVideos(videos)]
    .filter((video) => isPlayableVideo(video) && isLikelyMusicVideo(video))
    .map((video) => ({ video, score: scoreVideo(video, matrix) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.video);
}

function scoreVideo(video, matrix = getMetadataMatrix()) {
  const row = matrix.videoById.get(video.id);
  const matrixScore = row ? dotVectors(row.vector, matrix.profileVector) * 100 : 0;
  const followBoost = isFollowing(video.channelId) ? 12 : 0;
  const likedPenalty = isLiked(video.id) ? -4 : 0;
  const publishedAt = video.publishedAt ? Date.parse(video.publishedAt) : 0;
  const recencyBoost = publishedAt ? Math.max(0, 4 - (Date.now() - publishedAt) / (365 * 24 * 60 * 60 * 1000)) : 0;
  return matrixScore + followBoost + likedPenalty + recencyBoost + Math.min(4, Number(video.viewCount || 0) / 100000000);
}

function getMetadataMatrix() {
  const videos = uniqueVideos([...demoVideos, ...Object.values(state.videoCache), ...Object.values(state.likedVideos), ...state.searchResults.videos]).filter(isLikelyMusicVideo);
  const channels = uniqueChannels([
    ...demoChannels,
    ...Object.values(state.cachedChannels),
    ...Object.values(state.followedChannels),
    ...videos.map(channelFromVideo)
  ]);
  const signature = metadataMatrixSignature(videos, channels);
  if (metadataMatrix?.signature === signature) return metadataMatrix;

  const videoDocs = videos.map((video) => ({
    id: video.id,
    type: "video",
    item: video,
    features: limitFeatureMap(videoMetadataFeatures(video), METADATA_MATRIX_VIDEO_TERMS)
  }));
  const channelDocs = channels.map((channel) => ({
    id: channel.id,
    type: "channel",
    item: channel,
    features: limitFeatureMap(channelMetadataFeatures(channel), METADATA_MATRIX_CHANNEL_TERMS)
  }));
  const docs = [...videoDocs, ...channelDocs];
  const documentFrequency = new Map();

  for (const doc of docs) {
    for (const token of doc.features.keys()) {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    }
  }

  const keptTerms = chooseMatrixTerms(documentFrequency, docs.length);
  const idf = new Map();
  for (const token of keptTerms) {
    idf.set(token, Math.log((docs.length + 1) / ((documentFrequency.get(token) || 0) + 1)) + 1);
  }

  const videoRows = videoDocs.map((doc) => ({ ...doc, vector: vectorizeFeatures(doc.features, idf, keptTerms) }));
  const channelRows = channelDocs.map((doc) => ({ ...doc, vector: vectorizeFeatures(doc.features, idf, keptTerms) }));
  const videoById = new Map(videoRows.map((row) => [row.id, row]));
  const channelById = new Map(channelRows.map((row) => [row.id, row]));
  const profileVector = buildProfileVector(videoRows, channelRows);

  metadataMatrix = {
    signature,
    terms: [...keptTerms],
    idf,
    videoRows,
    channelRows,
    videoById,
    channelById,
    profileVector
  };
  return metadataMatrix;
}

function metadataMatrixSignature(videos, channels) {
  const videoPart = videos
    .map((video) => `${video.id}:${video.title}:${video.channelId}:${video.publishedAt}:${(video.tags || []).join(",")}:${isLiked(video.id) ? 1 : 0}:${isFollowing(video.channelId) ? 1 : 0}`)
    .sort()
    .join("|");
  const channelPart = channels
    .map((channel) => `${channel.id}:${channel.title}:${channel.description}:${isFollowing(channel.id) ? 1 : 0}`)
    .sort()
    .join("|");
  return `${videoPart}::${channelPart}::current:${state.currentVideo?.id || ""}`;
}

function videoMetadataFeatures(video) {
  const weights = new Map();
  addTextFeatures(weights, video.title, 4);
  addTextFeatures(weights, video.channelTitle, 2.5);
  addTextFeatures(weights, (video.tags || []).join(" "), 2);
  addTextFeatures(weights, sourceWords(video.sources), 1);
  addFeature(weights, `channel:${String(video.channelId || "").toLowerCase()}`, 5);
  if (video.publishedAt) {
    const year = new Date(video.publishedAt).getFullYear();
    if (Number.isFinite(year)) {
      addFeature(weights, `year:${year}`, 0.8);
      addFeature(weights, `decade:${Math.floor(year / 10) * 10}`, 0.5);
    }
  }
  const duration = Number(video.durationSeconds || 0);
  if (duration > 0) addFeature(weights, duration <= 60 ? "format:short" : "format:video", 1.2);
  return weights;
}

function channelMetadataFeatures(channel) {
  const weights = new Map();
  addTextFeatures(weights, channel.title, 4);
  addTextFeatures(weights, channel.description, 2);
  addTextFeatures(weights, channel.url, 1);
  addTextFeatures(weights, sourceWords(channel.sources), 1);
  addFeature(weights, `channel:${String(channel.id || "").toLowerCase()}`, 5);
  return weights;
}

function addTextFeatures(weights, text, amount) {
  for (const token of tokenize(text)) addFeature(weights, token, amount);
}

function addFeature(weights, token, amount) {
  if (!token || token.endsWith(":")) return;
  weights.set(token, (weights.get(token) || 0) + amount);
}

function sourceWords(sources = []) {
  return Array.isArray(sources) ? sources.join(" ") : "";
}

function limitFeatureMap(features, limit) {
  return new Map([...features.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit));
}

function chooseMatrixTerms(documentFrequency, documentCount) {
  return new Set(
    [...documentFrequency.entries()]
      .sort((a, b) => matrixTermScore(b, documentCount) - matrixTermScore(a, documentCount))
      .slice(0, METADATA_MATRIX_MAX_TERMS)
      .map(([token]) => token)
  );
}

function matrixTermScore([token, frequency], documentCount) {
  const idf = Math.log((documentCount + 1) / (frequency + 1)) + 1;
  const profileBoost = token.startsWith("channel:") || token.startsWith("format:") ? 3 : 0;
  return idf * Math.min(5, frequency) + profileBoost;
}

function vectorizeFeatures(features, idf, keptTerms) {
  const vector = new Map();
  for (const [token, weight] of features) {
    if (!keptTerms.has(token)) continue;
    vector.set(token, weight * (idf.get(token) || 1));
  }
  return normalizeVector(vector);
}

function buildProfileVector(videoRows, channelRows) {
  const profile = new Map();
  let signals = 0;
  for (const row of videoRows) {
    if (isLiked(row.id)) {
      mergeVector(profile, row.vector, 4);
      signals += 1;
    }
    if (isFollowing(row.item.channelId)) {
      mergeVector(profile, row.vector, 1.3);
      signals += 0.25;
    }
  }
  for (const row of channelRows) {
    if (isFollowing(row.id)) {
      mergeVector(profile, row.vector, 2.5);
      signals += 1;
    }
  }
  if (state.currentVideo) {
    const current = videoRows.find((row) => row.id === state.currentVideo.id);
    if (current) {
      mergeVector(profile, current.vector, 0.8);
      signals += 0.2;
    }
  }
  if (!signals) {
    for (const row of videoRows.slice(0, 24)) mergeVector(profile, row.vector, 0.5);
  }
  return normalizeVector(profile);
}

function mergeVector(target, vector, weight = 1) {
  for (const [token, value] of vector) {
    target.set(token, (target.get(token) || 0) + value * weight);
  }
}

function normalizeVector(vector) {
  let magnitude = 0;
  for (const value of vector.values()) magnitude += value * value;
  magnitude = Math.sqrt(magnitude);
  if (!magnitude) return vector;
  const normalized = new Map();
  for (const [token, value] of vector) normalized.set(token, value / magnitude);
  return normalized;
}

function dotVectors(a, b) {
  if (!a?.size || !b?.size) return 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let score = 0;
  for (const [token, value] of small) score += value * (large.get(token) || 0);
  return score;
}

function buildQueryVector(query, matrix) {
  const features = new Map();
  addTextFeatures(features, query, 4);
  return vectorizeFeatures(features, matrix.idf, new Set(matrix.terms));
}

function searchMetadataRows(rows, query) {
  const text = query.trim().toLowerCase();
  if (!text) return [];
  const matrix = getMetadataMatrix();
  const queryVector = buildQueryVector(query, matrix);
  return rows
    .map((row) => {
      const itemText = searchable(row.item);
      const exactScore = itemText.includes(text) ? 4 : 0;
      const titleScore = String(row.item.title || "").toLowerCase().includes(text) ? 2 : 0;
      return { row, score: exactScore + titleScore + dotVectors(row.vector, queryVector) * 10 };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((match) => match.row);
}

function topMatrixTerms(matrix, count) {
  return [...matrix.profileVector.entries()]
    .filter(([token]) => !token.includes(":"))
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([token]) => token);
}

function addTokens(weights, text, amount) {
  for (const token of tokenize(text)) {
    weights.set(token, (weights.get(token) || 0) + amount);
  }
}

function tokenize(text) {
  const stop = new Set(["the", "and", "for", "with", "official", "video", "music", "feat", "from", "live", "you", "your", "this", "that"]);
  return String(text)
    .toLowerCase()
    .replace(/&amp;/g, " ")
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 2 && !stop.has(token));
}

function uniqueVideos(videos) {
  const seen = new Set();
  const unique = [];
  for (const video of videos) {
    if (!video?.id || seen.has(video.id)) continue;
    seen.add(video.id);
    unique.push(video);
  }
  return unique;
}

function uniqueChannels(channels) {
  const seen = new Set();
  const unique = [];
  for (const channel of channels) {
    if (!channel?.id || seen.has(channel.id)) continue;
    seen.add(channel.id);
    unique.push(channel);
  }
  return unique;
}

function uniqueStrings(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function closeModal() {
  els.modalRoot.hidden = true;
  els.modalRoot.innerHTML = "";
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    els.toast.hidden = true;
  }, 4200);
}

function installIcons(root) {
  root.querySelectorAll("[data-icon]").forEach((slot) => {
    const name = slot.dataset.icon;
    if (icons[name]) slot.innerHTML = icons[name];
  });
}

function icon(name) {
  return icons[name] || icons.music;
}

function searchable(item) {
  return `${item.title || ""} ${item.channelTitle || ""} ${item.description || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
}

function rankSearchVideos(videos, query) {
  return uniqueVideos(videos)
    .filter((video) => isPlayableVideo(video) && isLikelyMusicVideo(video) && matchesSearchIntent(video, query))
    .map((video) => ({ video, score: queryMatchScore(video, query) * 100 + searchPriorityBoost(video, query) + scoreVideo(video) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.video);
}

function searchPriorityBoost(video, query) {
  let score = 0;
  if (isFollowing(video.channelId)) score += 5000;
  const title = String(video.title || "").toLowerCase();
  const channel = String(video.channelTitle || "").toLowerCase();
  const phrase = String(query || "").trim().toLowerCase();
  if (phrase && title.includes(phrase)) score += 1200;
  if (phrase && channel.includes(phrase)) score += 900;
  if (isFollowing(video.channelId) && phrase && title.includes(phrase)) score += 2000;
  return score;
}

function filterChannelsForQuery(channels, query, videos = []) {
  const videoChannelIds = new Set((videos || []).map((video) => video.channelId).filter(Boolean));
  return uniqueChannels(channels)
    .filter((channel) => videoChannelIds.has(channel.id) || matchesSearchIntent(channel, query))
    .map((channel) => ({ channel, score: (videoChannelIds.has(channel.id) ? 40 : 0) + queryMatchScore(channel, query) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.channel);
}

function matchesSearchIntent(item, query) {
  return queryMatchScore(item, query) > Number.NEGATIVE_INFINITY;
}

function queryMatchScore(item, query) {
  const tokens = queryIntentTokens(query);
  const genreTerms = queryGenreTerms(query);
  if (!tokens.length && !genreTerms.length) return 0;
  const text = searchable(item);
  const phrase = String(query || "").trim().toLowerCase();
  const matched = tokens.filter((token) => tokenMatchesItem(token, item));
  const matchedGenres = genreTerms.filter((term) => tokenInText(term, text));
  const genreTokens = new Set(tokenize(genreTerms.join(" ")));
  const nonGenreTokens = tokens.filter((token) => !genreTokens.has(token));

  if (genreTerms.length) {
    if (!matchedGenres.length) return Number.NEGATIVE_INFINITY;
    if (nonGenreTokens.length) {
      const matchedNonGenre = nonGenreTokens.filter((token) => tokenMatchesItem(token, item));
      const requiredNonGenre = nonGenreTokens.length <= 2 ? nonGenreTokens.length : Math.max(2, Math.ceil(nonGenreTokens.length * 0.75));
      if (matchedNonGenre.length < requiredNonGenre) return Number.NEGATIVE_INFINITY;
    }
  } else {
    const required = tokens.length <= 2 ? tokens.length : Math.max(2, Math.ceil(tokens.length * 0.75));
    if (matched.length < required) return Number.NEGATIVE_INFINITY;
  }

  const title = String(item.title || "").toLowerCase();
  const channel = String(item.channelTitle || item.title || "").toLowerCase();
  const tagText = Array.isArray(item.tags) ? item.tags.join(" ").toLowerCase() : "";
  const tokenScoreBase = tokens.length ? (matched.length / tokens.length) * 20 : 0;
  let score = matched.length * 12 + tokenScoreBase + matchedGenres.length * 18;
  if (phrase && text.includes(phrase)) score += 35;
  if (tokens.length && matched.length === tokens.length) score += 16;
  if (genreTerms.length && matchedGenres.length) score += 18;
  for (const token of matched) {
    if (tokenInText(token, title)) score += 5;
    if (tokenInText(token, channel)) score += 4;
    if (tokenInText(token, tagText)) score += 3;
  }
  for (const genre of matchedGenres) {
    if (tokenInText(genre, title)) score += 6;
    if (tokenInText(genre, tagText)) score += 5;
  }
  return score;
}

function queryIntentTokens(query) {
  return [...new Set(tokenize(query))];
}

function tokenMatchesItem(token, item) {
  return tokenInText(token, searchable(item)) || itemAcronyms(item).some((acronym) => acronym.includes(token));
}

function tokenInText(token, text) {
  const lower = String(text || "").toLowerCase();
  if (!lower) return false;
  if (new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}([^a-z0-9]|$)`, "i").test(lower)) return true;
  return normalizeCreatorKey(lower).includes(normalizeCreatorKey(token));
}

function itemAcronyms(item) {
  const values = [item.title, item.channelTitle, item.description].filter(Boolean);
  return values
    .map((value) => String(value).match(/[a-z0-9]+/gi) || [])
    .filter((words) => words.length > 1)
    .map((words) => words.map((word) => word[0]).join("").toLowerCase());
}

function isLikelyMusicVideo(video, query = "") {
  if (!video?.id) return false;
  if (String(video.channelId || "").startsWith("demo-")) return true;

  const text = searchable(video);
  const queryText = String(query || "").toLowerCase();
  const hasMusicSignal = hasTermSignal(text, MUSIC_SIGNAL_TERMS) || hasGenreSignal(text);
  const hasNonMusicSignal = hasTermSignal(text, NON_MUSIC_SIGNAL_TERMS);
  if (hasNonMusicSignal && !hasMusicSignal) return false;
  if (hasMusicSignal) return true;
  if (looksLikeArtistSongResult(video, query) && !hasNonMusicSignal) return true;
  if ((hasTermSignal(queryText, MUSIC_SIGNAL_TERMS) || hasGenreSignal(queryText)) && !hasNonMusicSignal) return true;
  return isFollowing(video.channelId) && !hasNonMusicSignal;
}

function allGenreTerms() {
  return Object.values(GENRE_ALIASES).flat();
}

function queryGenreTerms(query) {
  const normalizedQuery = normalizeCreatorKey(query);
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
  const normalizedAlias = normalizeCreatorKey(alias);
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

function hasGenreSignal(text) {
  return hasTermSignal(text, allGenreTerms());
}

function looksLikeArtistSongResult(video, query) {
  const key = normalizeCreatorKey(query);
  if (key.length < 3 || key.length > 32) return false;
  const haystack = normalizeCreatorKey(`${video.title || ""} ${video.channelTitle || ""}`);
  if (!haystack.includes(key)) return false;
  const title = String(video.title || "").toLowerCase();
  return /\s[-–—:]\s/.test(title);
}

function hasTermSignal(text, terms) {
  const lower = String(text || "").toLowerCase();
  if (!lower) return false;
  return terms.some((term) => {
    const needle = String(term || "").toLowerCase();
    if (!needle) return false;
    if (needle.includes(" ")) return lower.includes(needle);
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}([^a-z0-9]|$)`, "i").test(lower);
  });
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseYouTubeDuration(iso = "") {
  const totalSeconds = parseYouTubeDurationSeconds(iso);
  if (!totalSeconds) return "";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = hours ? [hours, String(minutes).padStart(2, "0"), String(seconds).padStart(2, "0")] : [minutes, String(seconds).padStart(2, "0")];
  return parts.join(":");
}

function parseYouTubeDurationSeconds(iso = "") {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function applyChannelFilter(videos) {
  if (state.channelFilter === "shorts") {
    return videos.filter(isShortVideo);
  }
  if (state.channelFilter === "videos") {
    return videos.filter((video) => !isShortVideo(video));
  }
  return videos;
}

function isShortVideo(video) {
  if (!video) return false;
  if (video.isShort) return true;
  if (/\/shorts\//i.test(video.watchUrl || "")) return true;
  if ((video.tags || []).some((tag) => String(tag).toLowerCase() === "shorts")) return true;
  const duration = Number(video.durationSeconds || 0);
  return duration > 0 && duration <= 60;
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short" }).format(new Date(dateString));
}

function initials(name = "M") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function friendlyFeedError(error) {
  const message = error?.message || "Feed unavailable";
  if (/Open Melodify with Open Melodify\.bat/i.test(message)) return "Open Melodify from the Desktop or Start Menu shortcut to refresh channel feeds.";
  if (/Failed to fetch|NetworkError|Load failed|404|Not found|proxy/i.test(message)) return "Open Melodify from the Desktop or Start Menu shortcut to refresh channel feeds.";
  if (/invalid channel/i.test(message)) return "Enter a raw UC channel ID or a /channel/UC... URL.";
  return "Feed unavailable";
}

function startAppUpdateWatcher() {
  if (!canUseAppUpdateWatcher()) return;

  const checkForUpdates = () => {
    checkForAppUpdate().catch(() => {});
  };

  window.setTimeout(checkForUpdates, 2000);
  window.setInterval(checkForUpdates, APP_UPDATE_CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkForUpdates();
  });
}

function startFollowedChannelRefreshWatcher() {
  if (isFileMode()) return;
  const refresh = () => {
    refreshFollowedChannelsCache(false).catch(() => {});
  };

  window.setTimeout(refresh, 15000);
  window.setInterval(refresh, FOLLOWED_CHANNEL_REFRESH_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
  });
}

function canUseAppUpdateWatcher() {
  return location.protocol.startsWith("http");
}

async function checkForAppUpdate() {
  if (appUpdateInProgress) return;

  const response = await fetch(`${APP_VERSION_PATH}?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) return;

  const version = await response.json();
  if (!version?.signature) return;

  if (!appVersionSignature) {
    appVersionSignature = version.signature;
    appServerVersionSignature = version.serverSignature || "";
    return;
  }

  if (version.signature !== appVersionSignature) {
    const serverChanged = Boolean(
      appServerVersionSignature &&
      version.serverSignature &&
      version.serverSignature !== appServerVersionSignature
    );
    await applyDetectedAppUpdate(serverChanged);
  }
}

async function applyDetectedAppUpdate(serverChanged) {
  appUpdateInProgress = true;
  persist();
  showToast("Melodify updated. Refreshing now...");

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
      registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
    }
  } catch {
    // A normal page reload still picks up the fresh files from the local helper.
  }

  if (serverChanged) {
    try {
      await fetch(`${APP_RESTART_PATH}?t=${Date.now()}`, { cache: "no-store" });
    } catch {
      // If the helper cannot restart itself, the page reload still applies front-end files.
    }
  }

  window.setTimeout(() => {
    window.location.reload();
  }, serverChanged ? APP_UPDATE_SERVER_RELOAD_DELAY_MS : APP_UPDATE_RELOAD_DELAY_MS);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    let reloadingForUpdate = false;
    let reloadOnControllerChange = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!reloadOnControllerChange) return;
      if (reloadingForUpdate) return;
      reloadingForUpdate = true;
      window.location.reload();
    });
    navigator.serviceWorker.register("sw.js").then((registration) => {
      registration.update().catch(() => {});
      window.setInterval(() => registration.update().catch(() => {}), 60 * 1000);
      if (registration.waiting && navigator.serviceWorker.controller) {
        reloadOnControllerChange = true;
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            reloadOnControllerChange = true;
            worker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    }).catch(() => {});
  }
}
