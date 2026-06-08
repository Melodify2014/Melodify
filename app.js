"use strict";

const STATE_STORAGE = "melodify-state-v1";
const STATE_DB_NAME = "melodify-cache-v1";
const STATE_DB_VERSION = 2;
const STATE_DB_STORE = "records";
const STATE_RECORDINGS_STORE = "recordings";
const STATE_DB_KEY = "state";
const FEED_PROXY_PATH = "/yt/feed";
const OEMBED_PROXY_PATH = "/yt/oembed";
const DISCOVERY_PROXY_PATH = "/yt/discover";
const SPOTIFY_CONFIG_PATH = "/spotify/config";
const SPOTIFY_SEARCH_PATH = "/spotify/search";
const APP_VERSION_PATH = "/__melodify/version";
const APP_RESTART_PATH = "/__melodify/restart";
const MUSIC_CATEGORY_ID = "10";
const PLAYER_UNAVAILABLE_ERRORS = new Set([2, 5, 100, 101, 150]);
const SEARCH_CACHE_TTL_MS = Number.POSITIVE_INFINITY;
const CHANNEL_CACHE_TTL_MS = 60 * 60 * 1000;
const FOLLOWED_CHANNEL_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const CHANNEL_BACKGROUND_DISCOVERY_INTERVAL_MS = 60 * 1000;
const CHANNEL_DEEP_DISCOVERY_RETRY_MS = 10 * 60 * 1000;
const CHANNEL_DISCOVERY_TARGET_VIDEO_COUNT = 200;
const CHANNEL_BACKGROUND_DISCOVERY_BATCH_SIZE = 2;
const CHANNEL_DISCOVERY_QUERY_LIMIT = 5;
const CHANNEL_DISCOVERY_SHORT_QUERY_LIMIT = 2;
const CHANNEL_PAGE_AUTO_REFRESH_RETRY_MS = 2 * 60 * 1000;
const APP_UPDATE_CHECK_INTERVAL_MS = 15000;
const APP_UPDATE_RELOAD_DELAY_MS = 1200;
const APP_UPDATE_SERVER_RELOAD_DELAY_MS = 3200;
const LOCAL_APP_HELP = "Open Melodify from the Desktop or Start Menu shortcut to discover new videos.";
const LOCAL_PLAYER_HELP = "Open Melodify from the Desktop or Start Menu shortcut to play YouTube videos inside the app.";
const SEARCH_DISCOVERY_TIMEOUT_MS = 7000;
const SPOTIFY_SEARCH_TIMEOUT_MS = 4500;
const MAX_SEARCH_QUERY_LENGTH = 160;
const CATALOG_SEARCH_MIN_LINES = 10;
const CATALOG_SEARCH_MAX_TITLES = 80;
const SEARCH_FILLER_TOKENS = new Set([
  "official", "video", "music", "views", "month", "months", "year", "years", "slowed", "reverb",
  "super", "brazilian", "phonk", "montagem", "audio", "song", "edit", "lyrics", "topic"
]);
const SPOTIFY_AUTH_STORAGE = "melodify-spotify-auth-v1";
const SPOTIFY_PKCE_STORAGE = "melodify-spotify-pkce-v1";
const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state"
].join(" ");
const METADATA_FETCH_TIMEOUT_MS = 5000;
const VIDEO_IMPORT_CONCURRENCY = 6;
const VIDEO_SEARCH_IMPORT_LIMIT = 10;
const CHANNEL_DISCOVERY_IMPORT_LIMIT = 220;
const SEARCH_CHANNEL_EXPANSION_LIMIT = 36;
const SEARCH_CACHE_SCAN_BATCH_SIZE = 80;
const SEARCH_CACHE_VIDEO_RESULT_LIMIT = 60;
const SEARCH_CACHE_CHANNEL_RESULT_LIMIT = 12;
const RECENT_SEARCH_LIMIT = 8;
const VIDEO_GRID_BATCH_SIZE = 48;
const RECOMMENDATION_DISCOVERY_QUERY_LIMIT = 5;
const RECOMMENDATION_CHANNEL_QUERY_LIMIT = 4;
const RECOMMENDATION_IMPORT_LIMIT = 16;
const RECOMMENDATION_RELATED_CHANNEL_LIMIT = 6;
const RECOMMENDATION_RELATED_VIDEO_LIMIT = 24;
const WATCH_HISTORY_LIMIT = Number.POSITIVE_INFINITY;
const AVAILABILITY_MODEL_VERSION = 2;
const CHANNEL_OWNERSHIP_MODEL_VERSION = 4;
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
  "hollow knight", "silksong", "dark souls", "elden ring", "bloodborne", "sekiro",
  "boss fight", "bosses", "full game", "blind run",
  "wuchang", "fallen feathers",
  "roblox", "minecraft", "fortnite", "valorant", "gta", "doors", "forsaken", "jujutsu",
  "secret button", "build", "building", "builder", "mod", "mods", "update", "patch",
  "trailer", "teaser", "movie actors", "reaction", "vlog", "livestream", "live stream",
  "episode", "chapter", "challenge", "test", "take 2", "ranked", "pvp"
];
const HARD_NON_MUSIC_SIGNAL_TERMS = [
  "hollow knight", "silksong", "dark souls", "elden ring", "bloodborne", "sekiro",
  "wuchang", "fallen feathers", "gameplay", "walkthrough",
  "playthrough", "speedrun", "full stream", "livestream", "live stream", "vod",
  "playing", "let's play", "lets play", "boss fight", "full game"
];
const GAME_TITLE_SIGNAL_TERMS = [
  "hollow knight", "silksong", "dark souls", "darksouls", "elden ring", "bloodborne", "sekiro",
  "wuchang", "fallen feathers"
];
const TITLE_GAMEPLAY_CONTEXT_TERMS = [
  "live", "stream", "streams", "streaming", "vod", "gameplay", "walkthrough", "playthrough",
  "let's play", "lets play", "playing", "boss", "bosses", "boss fight", "full game",
  "day", "part", "pt", "finale", "hindi", "addicted", "harder", "lost", "rage",
  "first time", "blind", "run", "no hit", "challenge", "dlc", "ng+"
];
const STRONG_MUSIC_SIGNAL_TERMS = [
  "music video", "official music video", "official video", "official audio", "song",
  "lyrics", "lyric video", "visualizer", "remix", "cover", "instrumental", "beat",
  "beats", "album", "ep", "soundtrack", "ost", "theme", "acoustic", "live performance",
  "performance", "karaoke", "slowed", "reverb", "sped up", "nightcore", "mashup",
  "dj set", "prod", "producer", "records", "recordings", "vevo", "topic"
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
  shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 18h2.6a5 5 0 0 0 3.8-1.8L15.6 7A5 5 0 0 1 19.4 5H22"/><path d="m18 2 4 3-4 3"/><path d="M2 6h2.6a5 5 0 0 1 3.8 1.8l1.3 1.7"/><path d="m18 16 4 3-4 3"/><path d="M22 19h-2.6a5 5 0 0 1-3.8-1.8l-1.4-1.8"/></svg>',
  "user-plus": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></svg>',
  external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6"/><path d="m10 14 11-11"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
  music: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  queue: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 0 1-15.4 6.4L3 16"/><path d="M3 21v-5h5"/><path d="M3 12A9 9 0 0 1 18.4 5.6L21 8"/><path d="M21 3v5h-5"/></svg>',
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
  watchedVideos: {},
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
  recentSearches: [],
  channelVisibleCounts: {},
  recordings: {},
  dailyPlaylists: { date: "", playlists: [] },
  channelOwnershipModelVersion: CHANNEL_OWNERSHIP_MODEL_VERSION,
  unavailableVideos: {},
  sessionBlockedVideos: {},
  recommendations: [],
  recommendedChannels: [],
  spotify: {
    configured: false,
    clientId: "",
    accessToken: "",
    expiresAt: 0,
    connected: false,
    premiumBlocked: false,
    playerReady: false,
    deviceId: "",
    error: ""
  },
  loading: false,
  error: ""
};

let ytPlayer = null;
let ytReady = false;
let playerReady = false;
let playerBlocked = false;
let localRecordingUrl = "";
let localRecordingLoading = false;
let spotifyPlayer = null;
let spotifySdkReady = false;
let spotifyPlayerConnecting = false;
let fileModeToastShown = false;
let lastVisibleVideos = [];
let metadataMatrix = null;
let toastTimer = 0;
let appVersionSignature = "";
let appServerVersionSignature = "";
let appUpdateInProgress = false;
let followedChannelRefreshInFlight = false;
let channelBackgroundDiscoveryInFlight = false;
let activeSearchRequestId = 0;
let scheduledPersistTimer = 0;
const channelAutoLoadRequests = new Map();
const gridVisibleCounts = new Map();

const els = {};

window.onYouTubeIframeAPIReady = () => {
  ytReady = true;
  ensurePlayer();
};

window.onSpotifyWebPlaybackSDKReady = () => {
  spotifySdkReady = true;
  if (state.spotify.premiumBlocked) return;
  connectSpotifyPlayer().catch(() => {});
};

document.addEventListener("DOMContentLoaded", () => {
  init().catch(() => {
    try {
      showToast("Melodify cache could not finish loading.");
    } catch {}
  });
});

async function init() {
  cacheElements();
  redirectFileModeToLocalApp();
  await hydrateState();
  await handleSpotifyAuthCallback();
  await hydrateSpotify();
  primeCache();
  pruneNonMusicCache();
  installIcons(document);
  bindEvents();
  routeFromHash();
  render();
  registerServiceWorker();
  requestPersistentStorage();
  startAppUpdateWatcher();
  startFollowedChannelRefreshWatcher();
  startChannelBackgroundDiscoveryWatcher();

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
  els.recordedCount = document.getElementById("recordedCount");
  els.followCount = document.getElementById("followCount");
  els.modalRoot = document.getElementById("modalRoot");
  els.toast = document.getElementById("toast");
  els.trackArt = document.getElementById("trackArt");
  els.playerSource = document.getElementById("playerSource");
  els.playerTitle = document.getElementById("playerTitle");
  els.playerChannel = document.getElementById("playerChannel");
  els.playButtonIcon = document.getElementById("playButtonIcon");
  els.loopButton = document.getElementById("loopButton");
  els.playerRecording = document.getElementById("playerRecording");
  els.playerRecordingIcon = document.getElementById("playerRecordingIcon");
  els.queueButton = document.getElementById("queueButton");
  els.playerCopy = document.getElementById("playerCopy");
  els.playerLike = document.getElementById("playerLike");
  els.playerSubscribe = document.getElementById("playerSubscribe");
  els.youtubeLink = document.getElementById("youtubeLink");
  els.emptyPlayer = document.getElementById("emptyPlayer");
}

async function hydrateState() {
  try {
    const localSaved = JSON.parse(localStorage.getItem(STATE_STORAGE) || "{}");
    const saved = await readPersistentState() || localSaved;
    applySavedState(saved);
    if (saved.availabilityModelVersion !== AVAILABILITY_MODEL_VERSION) {
      reEnableCachedVideos();
      persist();
    }
    if (saved.channelOwnershipModelVersion !== CHANNEL_OWNERSHIP_MODEL_VERSION) {
      pruneAmbiguousChannelDiscoveryCache();
      state.channelOwnershipModelVersion = CHANNEL_OWNERSHIP_MODEL_VERSION;
      persist();
    }
  } catch {
    localStorage.removeItem(STATE_STORAGE);
  }
}

function applySavedState(saved = {}) {
  state.likedVideos = saved.likedVideos || {};
  state.watchedVideos = saved.watchedVideos || {};
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
  state.recentSearches = Array.isArray(saved.recentSearches) ? saved.recentSearches.slice(0, RECENT_SEARCH_LIMIT) : [];
  state.channelVisibleCounts = saved.channelVisibleCounts || {};
  state.recordings = saved.recordings || {};
  state.dailyPlaylists = saved.dailyPlaylists || { date: "", playlists: [] };
  state.channelOwnershipModelVersion = saved.channelOwnershipModelVersion || 1;
  state.recommendedChannels = saved.recommendedChannels || [];
  state.unavailableVideos = saved.availabilityModelVersion === AVAILABILITY_MODEL_VERSION ? saved.unavailableVideos || {} : {};
}

function persist() {
  const snapshot = stateSnapshot();
  writePersistentState(snapshot);
  try {
    localStorage.setItem(
      STATE_STORAGE,
      JSON.stringify(localStateSnapshot(snapshot))
    );
  } catch {
    showToast("Melodify saved the large cache, but the tiny backup cache is full.");
  }
}

function stateSnapshot() {
  return {
    likedVideos: state.likedVideos,
    watchedVideos: compactWatchedVideos(state.watchedVideos),
    followedChannels: state.followedChannels,
    currentVideo: state.currentVideo,
    loop: state.loop,
    recommendations: state.recommendations,
    videoCache: state.videoCache,
    cachedChannels: state.cachedChannels,
    channelVideoIds: state.channelVideoIds,
    channelFetchedAt: state.channelFetchedAt,
    channelFeedErrors: state.channelFeedErrors,
    channelDiscoveryFetchedAt: state.channelDiscoveryFetchedAt,
    creatorIndex: state.creatorIndex,
    searchCache: state.searchCache,
    recentSearches: state.recentSearches,
    channelVisibleCounts: state.channelVisibleCounts,
    recordings: state.recordings,
    dailyPlaylists: state.dailyPlaylists,
    channelOwnershipModelVersion: CHANNEL_OWNERSHIP_MODEL_VERSION,
    recommendedChannels: state.recommendedChannels,
    unavailableVideos: state.unavailableVideos,
    availabilityModelVersion: AVAILABILITY_MODEL_VERSION,
    savedAt: new Date().toISOString()
  };
}

function localStateSnapshot(snapshot) {
  return {
    likedVideos: snapshot.likedVideos,
    watchedVideos: snapshot.watchedVideos,
    followedChannels: snapshot.followedChannels,
    currentVideo: snapshot.currentVideo,
    loop: snapshot.loop,
    recommendations: snapshot.recommendations.slice(0, 30),
    recommendedChannels: snapshot.recommendedChannels.slice(0, 16),
    recentSearches: snapshot.recentSearches,
    channelVisibleCounts: snapshot.channelVisibleCounts,
    recordings: snapshot.recordings,
    unavailableVideos: snapshot.unavailableVideos,
    channelOwnershipModelVersion: snapshot.channelOwnershipModelVersion,
    availabilityModelVersion: snapshot.availabilityModelVersion,
    savedAt: snapshot.savedAt,
    largeCacheStoredIn: "IndexedDB"
  };
}

function openPersistentCacheDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(STATE_DB_NAME, STATE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STATE_DB_STORE)) db.createObjectStore(STATE_DB_STORE);
      if (!db.objectStoreNames.contains(STATE_RECORDINGS_STORE)) db.createObjectStore(STATE_RECORDINGS_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB failed"));
  });
}

async function readPersistentState() {
  try {
    const db = await openPersistentCacheDb();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STATE_DB_STORE, "readonly");
      const store = transaction.objectStore(STATE_DB_STORE);
      const request = store.get(STATE_DB_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Cache read failed"));
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => db.close();
    });
  } catch {
    return null;
  }
}

async function writePersistentState(snapshot) {
  try {
    const db = await openPersistentCacheDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STATE_DB_STORE, "readwrite");
      const store = transaction.objectStore(STATE_DB_STORE);
      store.put(snapshot, STATE_DB_KEY);
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error || new Error("Cache write failed"));
      };
    });
  } catch {
    // localStorage still keeps the small backup state when IndexedDB is unavailable.
  }
}

async function saveRecordingBlob(videoId, file) {
  if (!videoId || !file) return;
  const db = await openPersistentCacheDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STATE_RECORDINGS_STORE, "readwrite");
    const store = transaction.objectStore(STATE_RECORDINGS_STORE);
    store.put({
      id: videoId,
      blob: file,
      name: file.name || "",
      type: file.type || "video/mp4",
      size: file.size || 0,
      savedAt: new Date().toISOString()
    }, videoId);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Recording save failed"));
    };
  });
}

async function readRecordingBlob(videoId) {
  if (!videoId) return null;
  try {
    const db = await openPersistentCacheDb();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STATE_RECORDINGS_STORE, "readonly");
      const store = transaction.objectStore(STATE_RECORDINGS_STORE);
      const request = store.get(videoId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Recording read failed"));
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => db.close();
    });
  } catch {
    return null;
  }
}

async function requestPersistentStorage() {
  try {
    if (!navigator.storage?.persist) return;
    const alreadyPersistent = await navigator.storage.persisted();
    if (!alreadyPersistent) await navigator.storage.persist();
  } catch {
    // Browsers can deny persistent storage; Melodify still uses the largest cache it can.
  }
}

function schedulePersist(delay = 500) {
  window.clearTimeout(scheduledPersistTimer);
  scheduledPersistTimer = window.setTimeout(() => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => persist(), { timeout: 2000 });
    } else {
      persist();
    }
  }, delay);
}

function bindEvents() {
  window.addEventListener("hashchange", () => {
    routeFromHash();
    render();
  });

  els.searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitSearchInput();
  });

  els.searchInput.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    await submitSearchInput();
  });

  document.addEventListener("keydown", handleKeyboardShortcut);

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

  window.addEventListener("offline", () => {
    if (getRecordedVideos().length && (state.route === "home" || state.route === "search")) {
      location.hash = "recorded";
    } else {
      render();
    }
    showToast("Offline mode: saved recordings can play without Wi-Fi.");
  });

  window.addEventListener("online", () => {
    routeFromHash();
    render();
    showToast("Back online.");
  });
}

async function submitSearchInput() {
  const prepared = prepareSearchQuery(els.searchInput.value);
  const query = prepared.query;
  if (!query) {
    showToast("Type a music video or creator first.");
    return;
  }
  if (prepared.compacted) {
    els.searchInput.value = query;
    showToast("Shortened pasted catalog into a faster music search.");
  }
  state.query = query;
  location.hash = "search";
  await runSearch(query, state.filter);
}

async function handleAction(action, target, event) {
  if (action === "close-modal") {
    closeModal();
    return;
  }

  if (action === "continue-listening") {
    if (state.currentVideo) togglePlayback();
    return;
  }

  if (action === "recent-search") {
    const query = target.dataset.query || "";
    const filter = target.dataset.filter || "all";
    if (query) {
      state.filter = filter;
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item.dataset.filter === filter));
      els.searchInput.value = query;
      state.query = query;
      location.hash = "search";
      await runSearch(query, filter);
    }
    return;
  }

  if (action === "clear-recent-searches") {
    state.recentSearches = [];
    schedulePersist();
    render();
    showToast("Recent searches cleared.");
    return;
  }

  if (action === "show-more-grid") {
    showMoreGrid(target.dataset.gridKey, Number(target.dataset.total || 0));
    render();
    return;
  }

  if (action === "show-more-channel") {
    showMoreChannelVideos(target.dataset.channelId, Number(target.dataset.total || 0));
    render();
    return;
  }

  if (action === "find-more-channel") {
    await findMoreChannelVideos(target.dataset.channelId);
    return;
  }

  if (action === "clean-channel") {
    await cleanChannel(target.dataset.channelId);
    return;
  }

  if (action === "copy-channel-link") {
    await copyChannelLink(target.dataset.channelId);
    return;
  }

  if (action === "open-queue") {
    openQueueModal();
    return;
  }

  if (action === "play-queue-video") {
    const video = findVideo(target.dataset.videoId);
    if (video) {
      closeModal();
      await playVideo(video, state.queue.length ? state.queue : [video]);
    }
    return;
  }

  if (action === "clear-queue") {
    clearQueue();
    openQueueModal();
    renderPlayer();
    return;
  }

  if (action === "play-visible") {
    await playVisibleVideos(false);
    return;
  }

  if (action === "shuffle-visible") {
    await playVisibleVideos(true);
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

  if (action === "attach-recording") {
    const video = findVideo(target.dataset.videoId);
    if (video) await attachRecording(video);
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

  if (action === "connect-spotify") {
    await connectSpotify();
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

  if (action === "current-recording" && state.currentVideo) {
    await attachRecording(state.currentVideo);
    return;
  }

  if (action === "current-copy") {
    await copyCurrentVideoLink();
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

async function attachRecording(video) {
  if (!video?.id) return;
  const file = await pickRecordingFile();
  if (!file) return;
  if (!looksLikeVideoFile(file)) {
    showToast("Choose a video file for the recording.");
    return;
  }

  try {
    await saveRecordingBlob(video.id, file);
  } catch {
    showToast("Melodify could not save that recording. The browser storage may be full.");
    return;
  }

  const compact = compactVideo({
    ...video,
    embeddable: true,
    tags: uniqueStrings([...(video.tags || []), "recorded", "music video"])
  });
  state.recordings[video.id] = {
    ...compact,
    fileName: file.name || "recording",
    fileType: file.type || "video/mp4",
    fileSize: file.size || 0,
    savedAt: new Date().toISOString()
  };
  cacheVideo({ ...compact, embeddable: true }, "recording", false);
  markWatched(compact, false);
  persist();
  render();
  showToast("Recording saved. It will play offline from Recorded.");
  if (state.currentVideo?.id === compact.id) {
    state.currentVideo = compact;
    await playLocalRecording(compact);
  }
}

function pickRecordingFile() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    let settled = false;
    const finish = (file) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(file || null);
    };

    input.type = "file";
    input.accept = "video/*,.mp4,.webm,.m4v,.mov,.mkv";
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.addEventListener("change", () => finish(input.files?.[0] || null), { once: true });
    window.addEventListener("focus", () => {
      window.setTimeout(() => {
        if (!input.files?.length) finish(null);
      }, 500);
    }, { once: true });
    document.body.append(input);
    input.click();
  });
}

function looksLikeVideoFile(file) {
  if (!file) return false;
  if (String(file.type || "").startsWith("video/")) return true;
  return /\.(mp4|webm|m4v|mov|mkv)$/i.test(file.name || "");
}

function prepareSearchQuery(value) {
  const raw = String(value || "").trim();
  if (!raw) return { query: "", compacted: false };

  const singleLine = raw.replace(/\s+/g, " ").trim();
  if (parseYoutubeVideoId(raw) || parseChannelId(raw)) {
    return { query: singleLine, compacted: singleLine !== raw };
  }
  const catalogText = normalizeCatalogSearchText(raw);
  if (singleLine.length <= MAX_SEARCH_QUERY_LENGTH && !looksLikeCatalogSearchInput(raw) && !looksLikeCatalogSearchInput(catalogText)) {
    return { query: singleLine, compacted: false };
  }

  const compacted = compactCatalogSearchInput(raw) || compactCatalogSearchInput(catalogText) || compactLongSearchInput(catalogText);
  return {
    query: compacted,
    compacted: compacted !== singleLine
  };
}

function normalizeCatalogSearchText(value) {
  return String(value || "")
    .replace(/(\d{1,2}:\d{2})(?=[^\s\d:])/g, "$1\n")
    .replace(/([^\s])((?:\d+(?:\.\d+)?\s*[KMB]?|No)\s+views?)/gi, "$1\n$2")
    .replace(/(views?)(?:â€¢|•)?(?=\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago)/gi, "$1\n")
    .replace(/(ago)(?=\d{1,2}:\d{2})/gi, "$1\n");
}

function compactCatalogSearchInput(value) {
  const lines = splitCatalogSearchLines(value);
  if (!looksLikeCatalogSearchInput(value, lines)) return "";

  const titles = catalogSearchTitleLines(lines).slice(0, CATALOG_SEARCH_MAX_TITLES);
  const titleText = titles.join(" ");
  const creators = topCatalogCreatorNames(titles, 1);
  const genres = catalogGenreTerms(titleText);
  const titleHints = creators.length ? [] : topCatalogTitleHints(titles, 2);
  return uniqueStrings([...creators, ...genres.slice(0, 1), ...titleHints, "music"])
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_QUERY_LENGTH);
}

function compactLongSearchInput(value) {
  const genres = catalogGenreTerms(value);
  const tokens = tokenize(value).filter((token) => !isSearchFillerToken(token));
  return uniqueStrings([...tokens.slice(0, 8), ...genres, "music"])
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_QUERY_LENGTH);
}

function looksLikeCatalogSearchInput(value, preparedLines = null) {
  const lines = preparedLines || splitCatalogSearchLines(value);
  if (lines.length < CATALOG_SEARCH_MIN_LINES) return false;
  const durationCount = lines.filter(isCatalogDurationLine).length;
  const viewsCount = lines.filter(isCatalogViewsLine).length;
  const ageCount = lines.filter(isCatalogAgeLine).length;
  return durationCount >= 3 && (viewsCount >= 3 || ageCount >= 3) && catalogSearchTitleLines(lines).length >= 3;
}

function splitCatalogSearchLines(value) {
  return String(value || "")
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean);
}

function catalogSearchTitleLines(lines) {
  return (lines || []).filter((line) => {
    if (isCatalogMetadataLine(line)) return false;
    if (/^and\s+(?:\d+\s+more|[A-Z0-9 ._-]{2,30})$/i.test(line)) return false;
    if (/^(?:shorts|videos|play all|sort by|latest|popular)$/i.test(line)) return false;
    if (/^ð/i.test(line)) return false;
    return line.length >= 5;
  });
}

function isCatalogMetadataLine(line) {
  return isCatalogDurationLine(line) || isCatalogViewsLine(line) || isCatalogAgeLine(line) || /^(?:â€¢|•)$/.test(line);
}

function isCatalogDurationLine(line) {
  return /^\d{1,2}:\d{2}(?::\d{2})?$/.test(line);
}

function isCatalogViewsLine(line) {
  return /^(?:[\d,.]+\s*[KMB]?|No)\s+views?$/i.test(line);
}

function isCatalogAgeLine(line) {
  return /^\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago$/i.test(line);
}

function topCatalogCreatorNames(titles, limit) {
  const counts = new Map();
  for (const title of titles || []) {
    const beforeTilde = String(title).split("~")[0] || "";
    const match = beforeTilde.match(/[-–—]\s*([^()[\]]+)/);
    if (!match) continue;
    for (const part of match[1].split(/,|&|\+|\band\b|\sx\s/gi)) {
      const name = part.replace(/\s+/g, " ").trim();
      const key = normalizeCreatorKey(name);
      if (!key || isSearchFillerToken(key) || key.length < 2 || key.length > 32) continue;
      counts.set(key, { name, count: (counts.get(key)?.count || 0) + 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((item) => item.name.toLowerCase());
}

function catalogGenreTerms(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("brazilian phonk")) return ["brazilian phonk"];
  return uniqueStrings(queryGenreTerms(text).filter((term) => term.length > 2)).slice(0, 1);
}

function topCatalogTitleHints(titles, limit) {
  const counts = new Map();
  for (const title of titles || []) {
    const titlePart = String(title).split(/[-–—~(\[]/)[0] || "";
    for (const token of tokenize(titlePart)) {
      if (isSearchFillerToken(token) || token.length < 4) continue;
      counts.set(token, (counts.get(token) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token);
}

function isSearchFillerToken(token) {
  return SEARCH_FILLER_TOKENS.has(String(token || "").toLowerCase());
}

async function hydrateSpotify() {
  restoreSpotifyAuth();
  try {
    const response = await fetch(SPOTIFY_CONFIG_PATH, { cache: "no-store" });
    if (response.ok) {
      const config = await response.json();
      state.spotify.configured = Boolean(config.configured && config.clientId);
      state.spotify.clientId = config.clientId || "";
    }
  } catch {
    state.spotify.configured = false;
  }
  state.spotify.connected = Boolean(spotifyAccessToken());
  if (state.spotify.connected && !state.spotify.premiumBlocked) loadSpotifySdk();
}

function restoreSpotifyAuth() {
  try {
    const auth = JSON.parse(localStorage.getItem(SPOTIFY_AUTH_STORAGE) || "{}");
    state.spotify.premiumBlocked = Boolean(auth.premiumBlocked);
    state.spotify.accessToken = auth.accessToken || "";
    state.spotify.expiresAt = Number(auth.expiresAt || 0);
  } catch {
    localStorage.removeItem(SPOTIFY_AUTH_STORAGE);
  }
}

function saveSpotifyAuth() {
  if (state.spotify.accessToken) {
    localStorage.setItem(SPOTIFY_AUTH_STORAGE, JSON.stringify({
      accessToken: state.spotify.accessToken,
      expiresAt: state.spotify.expiresAt,
      premiumBlocked: Boolean(state.spotify.premiumBlocked)
    }));
    return;
  }
  if (state.spotify.premiumBlocked) {
    localStorage.setItem(SPOTIFY_AUTH_STORAGE, JSON.stringify({ premiumBlocked: true }));
    return;
  }
  localStorage.removeItem(SPOTIFY_AUTH_STORAGE);
}

function spotifyAccessToken() {
  if (state.spotify.premiumBlocked || !state.spotify.accessToken || Date.now() >= state.spotify.expiresAt) {
    state.spotify.accessToken = "";
    state.spotify.expiresAt = 0;
    state.spotify.connected = false;
    saveSpotifyAuth();
    return "";
  }
  return state.spotify.accessToken;
}

async function connectSpotify() {
  if (!state.spotify.configured || !state.spotify.clientId) {
    showToast("Spotify needs a Spotify Client ID in Render first.");
    return;
  }
  state.spotify.premiumBlocked = false;
  state.spotify.error = "";
  saveSpotifyAuth();
  const verifier = randomString(64);
  const challenge = await pkceChallenge(verifier);
  const authState = randomString(24);
  localStorage.setItem(SPOTIFY_PKCE_STORAGE, JSON.stringify({ verifier, state: authState, returnHash: location.hash || "#home" }));
  const redirectUri = spotifyRedirectUri();
  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("client_id", state.spotify.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", SPOTIFY_SCOPES);
  url.searchParams.set("state", authState);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", challenge);
  window.location.href = url.toString();
}

async function handleSpotifyAuthCallback() {
  const params = new URLSearchParams(window.location.search || "");
  const code = params.get("code");
  const returnedState = params.get("state");
  if (!code) return;
  let pkce = {};
  try {
    pkce = JSON.parse(localStorage.getItem(SPOTIFY_PKCE_STORAGE) || "{}");
  } catch {}
  localStorage.removeItem(SPOTIFY_PKCE_STORAGE);
  if (!pkce.verifier || pkce.state !== returnedState) {
    showToast("Spotify login could not be verified.");
    cleanSpotifyCallbackUrl(pkce.returnHash || "#home");
    return;
  }
  const clientId = state.spotify.clientId || await fetchSpotifyClientId();
  if (!clientId) {
    cleanSpotifyCallbackUrl(pkce.returnHash || "#home");
    return;
  }

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: spotifyRedirectUri(),
      code_verifier: pkce.verifier
    });
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    if (!response.ok) throw new Error("Spotify token failed");
    const token = await response.json();
    state.spotify.accessToken = token.access_token || "";
    state.spotify.expiresAt = Date.now() + Math.max(60, Number(token.expires_in || 3600) - 60) * 1000;
    state.spotify.connected = Boolean(state.spotify.accessToken);
    state.spotify.premiumBlocked = false;
    state.spotify.error = "";
    saveSpotifyAuth();
    if (state.spotify.connected) loadSpotifySdk();
    showToast("Spotify connected.");
  } catch {
    showToast("Spotify login failed.");
  } finally {
    cleanSpotifyCallbackUrl(pkce.returnHash || "#home");
  }
}

async function fetchSpotifyClientId() {
  try {
    const response = await fetch(SPOTIFY_CONFIG_PATH, { cache: "no-store" });
    if (!response.ok) return "";
    const config = await response.json();
    state.spotify.configured = Boolean(config.configured && config.clientId);
    state.spotify.clientId = config.clientId || "";
    return state.spotify.clientId;
  } catch {
    return "";
  }
}

function cleanSpotifyCallbackUrl(returnHash) {
  history.replaceState(null, "", `${location.pathname}${returnHash || "#home"}`);
}

function spotifyRedirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}

function randomString(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"[byte % 66]).join("");
}

async function pkceChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function loadSpotifySdk() {
  if (state.spotify.premiumBlocked) return;
  if (spotifySdkReady || document.querySelector("script[data-spotify-sdk]")) {
    connectSpotifyPlayer().catch(() => {});
    return;
  }
  const script = document.createElement("script");
  script.src = "https://sdk.scdn.co/spotify-player.js";
  script.async = true;
  script.dataset.spotifySdk = "true";
  document.head.append(script);
}

function routeFromHash() {
  const hash = location.hash.replace(/^#/, "") || "home";
  const [route, channelId] = hash.split("/");
  state.route = route;
  state.activeChannelId = channelId ? decodeURIComponent(channelId) : "";
  if (!isOffline() && state.route === "recorded") {
    state.route = "home";
    state.activeChannelId = "";
    if (location.hash === "#recorded") history.replaceState(null, "", "#home");
  }
  if (isOffline() && getRecordedVideos().length && (state.route === "home" || state.route === "search")) {
    state.route = "recorded";
    state.activeChannelId = "";
  }
}

function render() {
  updateConnectionState();
  installIcons(document);
  renderNav();
  renderPlayer();
  renderView();
}

function updateConnectionState() {
  document.body.classList.toggle("is-offline", isOffline());
}

function renderNav() {
  document.querySelectorAll("[data-nav]").forEach((item) => {
    item.classList.toggle("active", item.dataset.nav === state.route);
  });
  els.likedCount.textContent = String(Object.keys(state.likedVideos).length);
  if (els.recordedCount) els.recordedCount.textContent = String(getRecordedVideos().length);
  els.followCount.textContent = String(Object.keys(state.followedChannels).length);
}

function renderView() {
  let html = "";

  if (state.route === "search") {
    html = renderSearchView();
  } else if (state.route === "liked") {
    html = renderLikedView();
  } else if (state.route === "recorded" && isOffline()) {
    html = renderRecordedView();
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
      <div class="view-actions">
        ${renderListQuickActions(picks)}
        <div class="badge-row">
          <span class="badge green">${likedCount} liked</span>
          <span class="badge amber">${followedCount} following</span>
          <span class="badge">${Object.keys(state.videoCache).length} cached</span>
        </div>
        ${renderSpotifyConnectButton()}
      </div>
    </header>
    ${renderContinueListening()}
    ${renderRecentSearches()}
    <section>
      <h2 class="section-title">Recommended</h2>
      ${renderVideoGrid(picks, { key: "home-picks" })}
    </section>
    ${channelHtml}
  `;
}

function renderSpotifyConnectButton() {
  if (!state.spotify.configured) return "";
  if (state.spotify.premiumBlocked) {
    return `
      <button class="secondary-button" type="button" data-action="connect-spotify" title="Spotify playback requires Premium. Melodify is using YouTube only.">
        <span data-icon="music" aria-hidden="true"></span>
        <span>Connect Spotify Premium</span>
      </button>
    `;
  }
  if (state.spotify.connected) {
    return `<span class="badge green">Spotify connected</span>`;
  }
  return `
    <button class="secondary-button" type="button" data-action="connect-spotify">
      <span data-icon="music" aria-hidden="true"></span>
      <span>Connect Spotify</span>
    </button>
  `;
}

function renderContinueListening() {
  const video = state.currentVideo;
  if (!video) return "";
  const source = isSpotifyVideo(video) ? "Spotify track" : hasRecording(video.id) ? "Offline recording" : "YouTube music video";
  return `
    <section class="continue-card">
      <div class="continue-art" style="background-image: url('${escapeAttr(video.thumbnail || "")}')"></div>
      <div>
        <p class="eyebrow">Continue listening</p>
        <h2>${escapeHtml(video.title || "Current video")}</h2>
        <p class="meta">${escapeHtml(video.channelTitle || source)} / ${escapeHtml(source)}</p>
      </div>
      <button class="primary-button" type="button" data-action="continue-listening">
        <span data-icon="${state.isPlaying ? "pause" : "play"}" aria-hidden="true"></span>
        <span>${state.isPlaying ? "Pause" : "Play"}</span>
      </button>
    </section>
  `;
}

function renderRecentSearches() {
  const searches = (state.recentSearches || []).slice(0, RECENT_SEARCH_LIMIT);
  if (!searches.length) return "";
  return `
    <section class="recent-searches" aria-label="Recent searches">
      <div class="section-heading">
        <h2 class="section-title">Recent searches</h2>
        <button class="link-button quiet-action" type="button" data-action="clear-recent-searches">Clear</button>
      </div>
      <div class="chip-row">
        ${searches.map((item) => `
          <button class="search-chip" type="button" data-action="recent-search" data-query="${escapeAttr(item.query)}" data-filter="${escapeAttr(item.filter || "all")}">
            <span data-icon="search" aria-hidden="true"></span>
            <span>${escapeHtml(item.query)}</span>
          </button>
        `).join("")}
      </div>
    </section>
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
      ${renderRecentSearches()}
      ${renderEmpty("No results found", "Melodify could not discover matching music videos yet.", "search")}
    `;
  }

  const channelSection = channels.length && (state.filter !== "videos" || !videos.length)
    ? `<section><h2 class="section-title">Creators</h2>${renderChannelList(channels)}</section>`
    : "";
  const videoSection = videos.length && state.filter !== "channels"
    ? `<section><h2 class="section-title">Music videos</h2>${renderVideoGrid(videos, { key: searchGridKey() })}</section>`
    : "";
  lastVisibleVideos = videos;

  return `
    <header class="view-header">
      <div>
        <p class="eyebrow">Web + cache</p>
        <h1 class="view-title">${title}</h1>
      </div>
      <div class="view-actions">
        ${renderListQuickActions(videos)}
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
      <div class="view-actions">
        ${renderListQuickActions(videos)}
      </div>
    </header>
    ${renderVideoGrid(videos, { key: "liked" })}
  `;
}

function renderRecordedView() {
  const videos = getRecordedVideos();
  lastVisibleVideos = videos;
  if (!videos.length) {
    return renderEmpty("Recorded", "Add a local recording to a video or Short, then it will play here without Wi-Fi.", "music");
  }
  return `
    <header class="view-header">
      <div>
        <p class="eyebrow">${videos.length} offline recordings</p>
        <h1 class="view-title">Recorded</h1>
      </div>
      <div class="view-actions">
        ${renderListQuickActions(videos)}
      </div>
    </header>
    ${renderVideoGrid(videos, { key: "recorded" })}
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
  const channels = getRenderedRecommendedChannels();
  lastVisibleVideos = videos;
  const playlistHtml = playlists.length
    ? playlists.map(renderDailyPlaylist).join("")
    : renderEmpty("No unwatched recommendations yet", "Refresh after watching more music videos or following more creators.", "sparkles");
  const channelHtml = channels.length
    ? `<section><h2 class="section-title">New creators</h2>${renderChannelList(channels)}</section>`
    : "";
  return `
    <header class="view-header">
      <div>
        <p class="eyebrow">${state.dailyPlaylists.date === todayKey() ? "AI profile recommendations" : "Local profile ranking"}</p>
        <h1 class="view-title">Recommended</h1>
      </div>
      <div class="view-actions">
        ${renderListQuickActions(videos)}
        <button class="secondary-button" type="button" data-action="refresh-recommendations">
          <span data-icon="sparkles" aria-hidden="true"></span>
          <span>Refresh</span>
        </button>
      </div>
    </header>
    ${state.loading && !videos.length ? renderSkeletonGrid() : playlistHtml}
    ${state.loading && !channels.length ? "" : channelHtml}
  `;
}

function renderChannelView() {
  const channel = findChannel(state.activeChannelId) || { id: state.activeChannelId, title: "Creator", description: "", thumbnail: "" };
  const avatar = channel.thumbnail
    ? `<img class="channel-hero-avatar" src="${escapeAttr(channel.thumbnail)}" alt="" loading="lazy">`
    : `<span class="channel-hero-avatar placeholder">${escapeHtml(initials(channel.title))}</span>`;
  const storedIds = state.channelVideoIds[state.activeChannelId] || [];
  const storedVideos = storedIds.map((id) => state.videoCache[id]).filter(Boolean).filter((video) => isLikelyMusicVideo(video) && trustedChannelVideo(video, channel));
  const cache = state.channelCache[state.activeChannelId] || (storedVideos.length ? { channel, videos: storedVideos, nextPageToken: "", loading: false } : null);
  const allVideos = uniqueVideos([...(cache?.videos || []), ...storedVideos]).filter((video) => isLikelyMusicVideo(video) && trustedChannelVideo(video, channel));
  const videos = sortChannelVideos(applyChannelFilter(allVideos));
  lastVisibleVideos = videos;
  const showSkeleton = cache?.loading && !allVideos.length;
  const canDiscoverMore = canDiscoverMoreChannelVideos(channel, allVideos.length);
  const feedStatus = channelFeedStatus(channel.id);
  const feedBadgeClass = feedStatus === "Updated this hour" ? "green" : feedStatus === "Feed unavailable" ? "amber" : "";
  const countLabel = state.channelFilter === "all"
    ? `${videos.length} cached videos`
    : `${videos.length} shown / ${allVideos.length} cached`;

  const action = isFollowing(channel.id)
    ? `<button class="pill-action active" type="button" data-action="subscribe" data-channel-id="${escapeAttr(channel.id)}"><span data-icon="check" aria-hidden="true"></span><span>Subscribed</span></button>`
    : `<button class="pill-action" type="button" data-action="subscribe" data-channel-id="${escapeAttr(channel.id)}"><span data-icon="user-plus" aria-hidden="true"></span><span>Subscribe</span></button>`;

  return `
    <header class="view-header channel-hero">
      <div class="channel-hero-copy">
        ${avatar}
        <div>
          <p class="eyebrow">Creator</p>
          <h1 class="view-title">${escapeHtml(channel.title)}</h1>
          <p class="meta">${escapeHtml(channel.description || "Music videos")}</p>
          <div class="badge-row">
            <span class="badge ${feedBadgeClass}">${escapeHtml(feedStatus)}</span>
            <span class="badge">${escapeHtml(countLabel)}</span>
          </div>
        </div>
      </div>
      <div class="view-actions">
        ${renderListQuickActions(videos)}
        <div class="segmented compact" role="group" aria-label="Channel video filter">
          <button type="button" class="segment ${state.channelFilter === "all" ? "active" : ""}" data-action="set-channel-filter" data-filter="all">All</button>
          <button type="button" class="segment ${state.channelFilter === "videos" ? "active" : ""}" data-action="set-channel-filter" data-filter="videos">Videos</button>
          <button type="button" class="segment ${state.channelFilter === "shorts" ? "active" : ""}" data-action="set-channel-filter" data-filter="shorts">Shorts</button>
        </div>
        <button class="secondary-button compact-action" type="button" data-action="copy-channel-link" data-channel-id="${escapeAttr(channel.id)}" title="Copy channel link" aria-label="Copy channel link">
          <span data-icon="copy" aria-hidden="true"></span>
          <span>Copy</span>
        </button>
        <button class="secondary-button compact-action" type="button" data-action="clean-channel" data-channel-id="${escapeAttr(channel.id)}" title="Clean mixed channel videos" aria-label="Clean mixed channel videos">
          <span data-icon="refresh" aria-hidden="true"></span>
          <span>Clean</span>
        </button>
        ${action}
      </div>
    </header>
    ${showSkeleton ? renderSkeletonGrid() : videos.length ? renderVideoGrid(videos, { channelId: channel.id, discoveryLoading: Boolean(cache?.loading), canDiscoverMore }) : renderChannelEmptyState(channel.id, allVideos.length, canDiscoverMore, Boolean(cache?.loading))}
  `;
}

function renderChannelEmptyState(channelId, totalVideos, canDiscoverMore, loading) {
  const message = totalVideos ? "Try a different channel filter." : "Melodify is searching this channel for music videos and Shorts.";
  const action = canDiscoverMore ? `
    <div class="load-row">
      <button class="secondary-button" type="button" data-action="find-more-channel" data-channel-id="${escapeAttr(channelId)}" ${loading ? "disabled" : ""}>
        <span data-icon="sparkles" aria-hidden="true"></span>
        <span>${loading ? "Finding more..." : "Find more videos"}</span>
      </button>
    </div>
  ` : "";
  return `${renderEmpty("No music videos loaded", message, "music")}${action}`;
}

function renderListQuickActions(videos) {
  const count = playableListVideos(videos).length;
  if (!count) return "";
  return `
    <div class="list-quick-actions" aria-label="List playback">
      <button class="secondary-button compact-action" type="button" data-action="play-visible" title="Play this list" aria-label="Play this list">
        <span data-icon="play" aria-hidden="true"></span>
        <span>Play</span>
      </button>
      <button class="secondary-button compact-action" type="button" data-action="shuffle-visible" title="Shuffle this list" aria-label="Shuffle this list">
        <span data-icon="shuffle" aria-hidden="true"></span>
        <span>Shuffle</span>
      </button>
    </div>
  `;
}

function renderDailyPlaylist(playlist) {
  return `
    <section class="playlist-section">
      <div class="section-heading">
        <h2 class="section-title">${escapeHtml(playlist.title)}</h2>
        <p class="meta">${escapeHtml(playlist.query || "Cached recommendations")}</p>
      </div>
      ${renderVideoGrid(playlist.videos, { key: `playlist-${playlist.id}` })}
    </section>
  `;
}

function renderVideoGrid(videos, options = {}) {
  if (!videos.length) return renderEmpty("Nothing here yet", "Search or like a music video.", "music");
  const visibleCount = gridVisibleCount(options, videos.length);
  const visibleVideos = videos.slice(0, visibleCount);
  const moreCount = Math.max(0, videos.length - visibleVideos.length);
  const grid = `<div class="grid">${visibleVideos.map(renderVideoCard).join("")}</div>`;
  const controls = renderGridControls(options, visibleVideos.length, videos.length, moreCount);
  return `${grid}${controls}`;
}

function gridVisibleCount(options, total) {
  if (total <= VIDEO_GRID_BATCH_SIZE) return total;
  if (options.channelId) {
    const key = channelVisibleKey(options.channelId);
    return Math.min(total, Math.max(VIDEO_GRID_BATCH_SIZE, Number(state.channelVisibleCounts[key] || VIDEO_GRID_BATCH_SIZE)));
  }
  const key = options.key || `${state.route || "grid"}:${state.query || ""}:${state.filter || ""}`;
  return Math.min(total, Math.max(VIDEO_GRID_BATCH_SIZE, Number(gridVisibleCounts.get(key) || VIDEO_GRID_BATCH_SIZE)));
}

function renderGridControls(options, visibleCount, total, moreCount) {
  const parts = [];
  if (moreCount > 0) {
    if (options.channelId) {
      parts.push(`
        <button class="secondary-button" type="button" data-action="show-more-channel" data-channel-id="${escapeAttr(options.channelId)}" data-total="${escapeAttr(total)}">
          <span data-icon="plus" aria-hidden="true"></span>
          <span>Show ${Math.min(VIDEO_GRID_BATCH_SIZE, moreCount)} more</span>
        </button>
      `);
    } else {
      const key = options.key || `${state.route || "grid"}:${state.query || ""}:${state.filter || ""}`;
      parts.push(`
        <button class="secondary-button" type="button" data-action="show-more-grid" data-grid-key="${escapeAttr(key)}" data-total="${escapeAttr(total)}">
          <span data-icon="plus" aria-hidden="true"></span>
          <span>Show ${Math.min(VIDEO_GRID_BATCH_SIZE, moreCount)} more</span>
        </button>
      `);
    }
  }

  if (options.channelId && !moreCount && options.canDiscoverMore) {
    parts.push(`
      <button class="secondary-button" type="button" data-action="find-more-channel" data-channel-id="${escapeAttr(options.channelId)}" ${options.discoveryLoading ? "disabled" : ""}>
        <span data-icon="sparkles" aria-hidden="true"></span>
        <span>${options.discoveryLoading ? "Finding more..." : "Find more videos"}</span>
      </button>
    `);
  }

  if (options.discoveryLoading && visibleCount > 0) {
    parts.push(`<span class="load-note">Searching this channel in the background...</span>`);
  }

  return parts.length ? `<div class="load-row">${parts.join("")}</div>` : "";
}

function renderVideoCard(video) {
  const liked = isLiked(video.id);
  const channel = channelFromVideo(video);
  const spotify = isSpotifyVideo(video);
  const recorded = hasRecording(video.id);
  const current = state.currentVideo?.id === video.id;
  const unavailable = !recorded && !isPlayableVideo(video);
  const views = !spotify ? formatViewCount(video.viewCount) : "";
  const baseStatus = spotify ? "Spotify track" : recorded ? "Recorded" : unavailable ? "Unavailable" : video.duration || "Music video";
  const status = views ? `${baseStatus} / ${views} views` : baseStatus;
  const cardClasses = [
    "video-card",
    unavailable ? "unavailable" : "",
    current ? "current" : "",
    recorded ? "recorded" : "",
    spotify ? "spotify" : ""
  ].filter(Boolean).join(" ");
  const thumbLabel = spotify ? "Spotify" : recorded ? "Recorded" : isShortVideo(video) ? "Short" : current ? "Playing" : "";
  const channelControl = spotify
    ? `<a class="link-button" href="${escapeAttr(video.spotifyUrl || "https://open.spotify.com")}" target="_blank" rel="noreferrer">${escapeHtml(video.channelTitle)}</a>`
    : `<button class="link-button" type="button" data-action="open-channel" data-channel-id="${escapeAttr(video.channelId)}">${escapeHtml(video.channelTitle)}</button>`;
  const recordingButton = spotify ? "" : `
        <button class="mini-action ${recorded ? "active" : ""}" type="button" data-action="attach-recording" data-video-id="${escapeAttr(video.id)}" aria-label="${recorded ? "Replace" : "Add"} offline recording for ${escapeAttr(video.title)}" title="${recorded ? "Replace recording" : "Add offline recording"}">
          ${icon(recorded ? "check" : "plus")}
        </button>`;
  return `
    <article class="${cardClasses}">
      <button class="thumb-button" type="button" data-action="${unavailable ? "noop" : "play"}" data-video-id="${escapeAttr(video.id)}" aria-label="Play ${escapeAttr(video.title)}" ${unavailable ? "disabled" : ""}>
        <img src="${escapeAttr(video.thumbnail)}" alt="" loading="lazy">
        ${thumbLabel ? `<span class="thumb-badge">${escapeHtml(thumbLabel)}</span>` : ""}
        <span class="thumb-overlay">${icon(unavailable ? "alert" : spotify ? "music" : "play")}</span>
      </button>
      <div>
        <h2 class="video-title">${escapeHtml(video.title)}</h2>
        ${channelControl}
        <p class="meta">${escapeHtml(status)} ${video.publishedAt ? " / " + escapeHtml(formatDate(video.publishedAt)) : ""}</p>
      </div>
      <div class="card-actions">
        <button class="mini-action ${liked ? "active" : ""}" type="button" data-action="like" data-video-id="${escapeAttr(video.id)}" aria-label="${liked ? "Unlike" : "Like"} ${escapeAttr(video.title)}" title="${liked ? "Unlike" : "Like"}">
          ${icon("heart")}
        </button>
        ${recordingButton}
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
    <article class="${row ? "channel-row" : "channel-card"} ${followed ? "followed" : ""}">
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
  const spotify = hasVideo && isSpotifyVideo(video);
  const hasLocalRecording = hasVideo && hasRecording(video.id);
  const hasEmbeddedPlayer = Boolean(ytPlayer || getLocalPlayer());

  document.body.classList.toggle("has-current", hasVideo);
  els.playerSource.textContent = hasVideo ? spotify ? "Spotify track" : hasLocalRecording ? "Offline recording" : "YouTube music video" : "Ready";
  els.playerTitle.textContent = hasVideo ? video.title : "Choose a music video";
  els.playerChannel.textContent = hasVideo ? video.channelTitle : "Melodify";
  els.playerChannel.disabled = !hasVideo;
  els.trackArt.style.backgroundImage = hasVideo ? `url("${video.thumbnail}")` : "";
  els.playButtonIcon.innerHTML = icon(state.isPlaying ? "pause" : "play");
  els.loopButton.classList.toggle("active", state.loop);
  els.playerRecording.disabled = !hasVideo || spotify;
  els.playerRecording.classList.toggle("active", hasLocalRecording);
  if (els.queueButton) els.queueButton.disabled = !hasVideo && !state.queue.length;
  if (els.playerCopy) els.playerCopy.disabled = !hasVideo;
  els.playerRecording.title = hasLocalRecording ? "Replace offline recording" : "Add offline recording";
  els.playerRecording.setAttribute("aria-label", hasVideo ? `${hasLocalRecording ? "Replace" : "Add"} offline recording for ${video.title}` : "Add offline recording");
  els.playerRecordingIcon.innerHTML = icon(hasLocalRecording ? "check" : "plus");
  els.playerLike.disabled = !hasVideo;
  els.playerSubscribe.disabled = !hasVideo || spotify;
  els.youtubeLink.href = hasVideo ? videoExternalUrl(video) : "https://www.youtube.com";
  els.youtubeLink.title = hasVideo && spotify ? "Open on Spotify" : "Open on YouTube";
  els.youtubeLink.setAttribute("aria-label", hasVideo && spotify ? "Open on Spotify" : "Open on YouTube");

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
    els.emptyPlayer.classList.toggle("hidden", hasEmbeddedPlayer);
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
  const channel = findChannel(channelId);
  const cachedVideos = uniqueVideos([...(activeCache?.videos || []), ...channelVideos(channelId)])
    .filter((video) => isLikelyMusicVideo(video) && (!channel || trustedChannelVideo(video, channel)));
  return !cachedVideos.length || shouldRefreshChannel(channelId) || shouldDiscoverChannel(channelId) || shouldDeepenChannel(channelId);
}

function searchGridKey() {
  return `search:${state.filter || "all"}:${normalizeCreatorKey(state.query || "")}`;
}

function rememberRecentSearch(query, filter) {
  const cleaned = String(query || "").trim();
  if (!cleaned) return;
  const item = {
    query: cleaned,
    filter: filter || "all",
    searchedAt: new Date().toISOString()
  };
  const key = recentSearchKey(item);
  state.recentSearches = [
    item,
    ...(state.recentSearches || []).filter((entry) => recentSearchKey(entry) !== key)
  ].slice(0, RECENT_SEARCH_LIMIT);
  schedulePersist();
}

function recentSearchKey(item) {
  return `${String(item?.filter || "all").toLowerCase()}::${String(item?.query || "").trim().toLowerCase()}`;
}

function showMoreGrid(key, total) {
  if (!key) return;
  const current = Number(gridVisibleCounts.get(key) || VIDEO_GRID_BATCH_SIZE);
  gridVisibleCounts.set(key, Math.min(Math.max(total, VIDEO_GRID_BATCH_SIZE), current + VIDEO_GRID_BATCH_SIZE));
}

function showMoreChannelVideos(channelId, total) {
  if (!channelId) return;
  const key = channelVisibleKey(channelId);
  const current = Number(state.channelVisibleCounts[key] || VIDEO_GRID_BATCH_SIZE);
  state.channelVisibleCounts[key] = Math.min(Math.max(total, VIDEO_GRID_BATCH_SIZE), current + VIDEO_GRID_BATCH_SIZE);
  schedulePersist();
}

function channelVisibleKey(channelId) {
  return `${channelId || ""}:${state.channelFilter || "all"}`;
}

function canDiscoverMoreChannelVideos(channel, cachedCount) {
  return Boolean(channel?.id && !channel.id.startsWith("demo-") && !isOffline() && !isFileMode() && cachedCount < CHANNEL_DISCOVERY_TARGET_VIDEO_COUNT);
}

async function findMoreChannelVideos(channelId) {
  if (!channelId) return;
  const before = channelVideos(channelId).length;
  await expandChannelDiscovery(channelId, true, { renderUpdates: true, limit: CHANNEL_DISCOVERY_IMPORT_LIMIT });
  const after = channelVideos(channelId).length;
  if (after > before) {
    const key = channelVisibleKey(channelId);
    state.channelVisibleCounts[key] = Math.max(Number(state.channelVisibleCounts[key] || VIDEO_GRID_BATCH_SIZE), Math.min(after, before + VIDEO_GRID_BATCH_SIZE));
    schedulePersist();
    render();
    showToast(`Added ${after - before} more channel videos.`);
  } else {
    showToast("No more matching music videos found yet.");
  }
}

async function cleanChannel(channelId) {
  if (!channelId) return;
  const channel = findChannel(channelId);
  if (!channel) {
    showToast("That channel is not in the cache yet.");
    return;
  }

  const removed = cleanChannelCache(channelId);
  render();
  showToast(removed ? `Cleaned ${removed} mixed channel videos.` : "Channel cache already looks clean.");

  if (canDiscoverMoreChannelVideos(channel, channelVideos(channelId).length)) {
    await expandChannelDiscovery(channelId, true, { renderUpdates: true, limit: CHANNEL_DISCOVERY_IMPORT_LIMIT });
  }
}

function cleanChannelCache(channelId) {
  const channel = findChannel(channelId);
  if (!channel) return 0;
  let removed = 0;

  const ids = state.channelVideoIds[channelId] || [];
  if (ids.length) {
    const filteredIds = ids.filter((id) => {
      const video = state.videoCache[id];
      const keep = trustedChannelVideo(video, channel);
      if (!keep) removed += 1;
      return keep;
    });
    state.channelVideoIds[channelId] = filteredIds;
  }

  const cache = state.channelCache[channelId];
  if (cache?.videos?.length) {
    const keptIds = new Set(state.channelVideoIds[channelId] || []);
    const filteredVideos = cache.videos.filter((video) => {
      if (!video) return false;
      if (keptIds.has(video.id)) return true;
      const keep = trustedChannelVideo(video, channel);
      if (!keep) removed += 1;
      return keep;
    });
    state.channelCache[channelId] = { ...cache, channel, videos: uniqueVideos(filteredVideos), loading: false };
  }

  delete state.channelDiscoveryFetchedAt[channelId];
  clearChannelVisibleCounts(channelId);
  state.searchCache = {};
  state.recommendations = [];
  state.recommendedChannels = [];
  state.dailyPlaylists = { date: "", playlists: [] };
  metadataMatrix = null;
  persist();
  return removed;
}

function clearChannelVisibleCounts(channelId) {
  for (const key of Object.keys(state.channelVisibleCounts || {})) {
    if (key.startsWith(`${channelId}:`)) delete state.channelVisibleCounts[key];
  }
}

async function copyChannelLink(channelId) {
  if (!channelId) return;
  const base = window.location.origin && window.location.origin !== "null"
    ? `${window.location.origin}${window.location.pathname}`
    : window.location.href.split("#")[0];
  const url = `${base}#channel/${encodeURIComponent(channelId)}`;
  await copyText(url);
  showToast("Channel link copied.");
}

async function copyCurrentVideoLink() {
  if (!state.currentVideo) {
    showToast("Play a video first.");
    return;
  }
  await copyText(videoExternalUrl(state.currentVideo));
  showToast("Video link copied.");
}

function videoExternalUrl(video) {
  if (!video) return "https://www.youtube.com";
  if (isSpotifyVideo(video)) return video.spotifyUrl || "https://open.spotify.com";
  return video.watchUrl || `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`;
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {}

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  document.body.append(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

async function runSearch(query, filter, options = {}) {
  const { force = false } = options;
  const requestId = ++activeSearchRequestId;
  rememberRecentSearch(query, filter);
  state.route = "search";
  state.activeChannelId = "";
  state.loading = true;
  state.error = "";
  render();
  await yieldToBrowser();

  const importedFromInput = await importDirectSearchInput(query);
  if (!isActiveSearchRequest(requestId)) return;
  if (importedFromInput) {
    const channel = channelFromVideo(importedFromInput);
    state.searchResults = {
      videos: filter === "channels" ? [] : [importedFromInput],
      channels: filter === "videos" ? [] : [channel]
    };
    state.error = "";
    state.loading = false;
    writeSearchCache(query, filter, state.searchResults, { deferPersist: true });
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
      if (!isActiveSearchRequest(requestId)) return;
      const videos = channelVideos(channelFromInput);
      state.searchResults = {
        videos: filter === "channels" ? [] : videos,
        channels: filter === "videos" && videos.length ? [] : [result.channel].filter(Boolean)
      };
      writeSearchCache(query, filter, state.searchResults, { deferPersist: true });
    } catch (error) {
      state.error = friendlyFeedError(error);
    } finally {
      if (!isActiveSearchRequest(requestId)) return;
      state.loading = false;
      location.hash = "search";
      render();
    }
    return;
  }

  const cached = getCachedSearchEntry(query, filter) || { videos: [], channels: [] };
  const local = mergeSearchResults(cached, await cachedSearch(query, filter, requestId));
  if (!isActiveSearchRequest(requestId)) return;
  const hasLocalResults = Boolean(local.videos.length || local.channels.length);
  if (!force && hasLocalResults) {
    state.searchResults = local;
    state.error = "";
    state.loading = false;
    render();
    if (isFileMode()) {
      writeSearchCache(query, filter, local, { deferPersist: true });
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

  if (isOffline()) {
    state.searchResults = local;
    state.error = local.videos.length || local.channels.length ? "" : "No internet connection. Cached Melodify results still work, but new YouTube discovery needs Wi-Fi.";
    state.loading = false;
    render();
    showToast(state.error || "Showing saved offline cache.");
    return;
  }

  state.loading = !hasLocalResults || force;
  state.error = "";
  render();

  try {
    const discovered = await discoverSearch(query, filter, { requestId });
    if (!isActiveSearchRequest(requestId)) return;
    const merged = mergeSearchResults(local, discovered);
    state.searchResults = merged;
    writeSearchCache(query, filter, merged, { deferPersist: true });
    showToast(merged.videos.length || merged.channels.length ? "Discovered and cached new music videos." : "No matching music videos found yet.");
  } catch (error) {
    if (!isActiveSearchRequest(requestId)) return;
    state.searchResults = local;
    state.error = local.videos.length || local.channels.length ? "" : friendlyDiscoveryError(error);
    if (local.videos.length || local.channels.length) writeSearchCache(query, filter, local, { deferPersist: true });
    showToast(state.error || "Showing saved cache results.");
  } finally {
    if (!isActiveSearchRequest(requestId)) return;
    state.loading = false;
    render();
  }
}

function isActiveSearchRequest(requestId) {
  return requestId === activeSearchRequestId;
}

function yieldToBrowser() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 0);
  });
}

function mergeSearchResults(a, b) {
  const videos = rankSearchVideos([...(a?.videos || []), ...(b?.videos || [])], state.query);
  const channels = filterChannelsForQuery([...(a?.channels || []), ...(b?.channels || []), ...deriveChannelsFromVideos(videos, state.query)], state.query, videos);
  return { videos, channels };
}

async function fetchSpotifyCatalog(query) {
  if (!query || isOffline() || state.spotify.premiumBlocked) return { videos: [], queries: [] };
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), SPOTIFY_SEARCH_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(`${SPOTIFY_SEARCH_PATH}?q=${encodeURIComponent(query)}`, { cache: "no-store", signal: controller.signal });
    } finally {
      window.clearTimeout(timer);
    }
    if (response.ok) {
      const data = await response.json();
      if (data?.configured) {
        const videos = shouldShowSpotifyTrackResults() ? spotifyTracksToVideos(data.tracks || []) : [];
        if (videos.length) cacheVideos(videos, "spotify", false);
        return { videos, queries: data.queries || spotifyQueriesFromTracks(data.tracks || [], data.artists || []) };
      }
    }
  } catch {
    // Spotify catalogue search is optional; YouTube discovery continues without it.
  }

  if (state.spotify.connected) {
    return await fetchSpotifyCatalogWithUserToken(query);
  }
  return { videos: [], queries: [] };
}

async function fetchSpotifyCatalogWithUserToken(query) {
  try {
    const token = spotifyAccessToken();
    if (!token) return { videos: [], queries: [] };
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "track,artist");
    url.searchParams.set("limit", "8");
    url.searchParams.set("market", "from_token");
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });
    if (!response.ok) return { videos: [], queries: [] };
    const data = await response.json();
    const tracks = (data.tracks?.items || []).map(compactSpotifyTrack).filter(Boolean);
    const artists = (data.artists?.items || []).map(compactSpotifyArtist).filter(Boolean);
    const videos = shouldShowSpotifyTrackResults() ? spotifyTracksToVideos(tracks) : [];
    if (videos.length) cacheVideos(videos, "spotify", false);
    return { videos, queries: spotifyQueriesFromTracks(tracks, artists) };
  } catch {
    return { videos: [], queries: [] };
  }
}

function spotifyTracksToVideos(tracks) {
  return (tracks || []).map((track) => {
    const artist = track.artists?.[0] || "Spotify";
    return {
      id: `spotify:${track.id}`,
      source: "spotify",
      spotifyId: track.id,
      spotifyUri: `spotify:track:${track.id}`,
      spotifyUrl: track.spotifyUrl || `https://open.spotify.com/track/${track.id}`,
      title: `${artist} - ${track.name}`,
      channelId: `spotify:${normalizeCreatorKey(artist) || track.id}`,
      channelTitle: artist,
      thumbnail: track.image || "",
      publishedAt: "",
      duration: "Spotify",
      durationSeconds: 0,
      embeddable: true,
      isShort: false,
      categoryId: MUSIC_CATEGORY_ID,
      tags: uniqueStrings(["spotify", "music", "song", "track", ...(track.artists || []), track.album].filter(Boolean)),
      viewCount: track.popularity || ""
    };
  });
}

function spotifyQueriesFromTracks(tracks, artists) {
  const trackQueries = (tracks || []).flatMap((track) => {
    const artist = track.artists?.[0] || "";
    return [
      `${artist} ${track.name} official music video`,
      `${artist} ${track.name} official audio`
    ];
  });
  const artistQueries = (artists || []).map((artist) => `${artist.name} ${(artist.genres || [])[0] || "music"} music videos`);
  return uniqueStrings([...trackQueries, ...artistQueries].map((item) => String(item || "").replace(/\s+/g, " ").trim()).filter(Boolean)).slice(0, 8);
}

function compactSpotifyTrack(track) {
  if (!track?.id || !track?.name) return null;
  return {
    id: track.id,
    name: track.name,
    artists: (track.artists || []).map((artist) => artist?.name).filter(Boolean).slice(0, 4),
    album: track.album?.name || "",
    image: track.album?.images?.[0]?.url || track.image || "",
    popularity: Number(track.popularity || 0),
    spotifyUrl: track.external_urls?.spotify || track.spotifyUrl || "",
    isrc: track.external_ids?.isrc || track.isrc || ""
  };
}

function compactSpotifyArtist(artist) {
  if (!artist?.id || !artist?.name) return null;
  return {
    id: artist.id,
    name: artist.name,
    genres: (artist.genres || []).slice(0, 8),
    image: artist.images?.[0]?.url || artist.image || "",
    popularity: Number(artist.popularity || 0),
    spotifyUrl: artist.external_urls?.spotify || artist.spotifyUrl || ""
  };
}

async function discoverSearch(query, filter, options = {}) {
  const { requestId = activeSearchRequestId } = options;
  const spotifyCatalog = filter !== "channels" ? await fetchSpotifyCatalog(query) : { videos: [], queries: [] };
  const imported = filter !== "channels" ? await discoverVideos(query, { spotifyQueries: spotifyCatalog.queries }) : [];
  let discoveredChannels = [];
  if (filter !== "videos" || !imported.length || shouldSearchCreatorsForQuery(query)) {
    try {
      discoveredChannels = await discoverChannels(query, { limit: filter === "channels" ? 4 : 2, followFirst: false, candidateVideos: imported, skipVideoFallback: false });
    } catch (error) {
      if (filter === "channels" || !imported.length) throw error;
    }
  }
  const creatorMatchedChannels = discoveredChannels.filter((channel) => creatorMatchesQuery(channel, query));
  if (filter !== "channels" && (!imported.length || creatorMatchedChannels.length)) {
    scheduleSearchChannelExpansion(query, filter, creatorMatchedChannels.length ? creatorMatchedChannels : discoveredChannels, requestId);
  }
  const indexedChannelVideos = filter !== "channels" ? videosFromCreatorIndex(query) : [];
  const followedChannelVideos = filter !== "channels" ? videosFromFollowedChannels(query) : [];
  const discoveredChannelVideos = uniqueVideos([
    ...followedChannelVideos,
    ...discoveredChannels.flatMap((channel) => channelVideos(channel.id)),
    ...indexedChannelVideos
  ]);
  const videos = filter !== "channels" ? rankSearchVideos([...spotifyCatalog.videos, ...imported, ...discoveredChannelVideos], query) : [];
  const channels = filter !== "videos" || !videos.length
    ? filterChannelsForQuery([...discoveredChannels, ...deriveChannelsFromVideos(videos, query)], query, videos)
    : [];
  return { videos, channels };
}

function scheduleSearchChannelExpansion(query, filter, channels, requestId) {
  if (!channels.length || isFileMode()) return;
  window.setTimeout(async () => {
    if (!isActiveSearchRequest(requestId)) return;
    try {
      const expanded = await expandDiscoveredChannels(channels, { limit: SEARCH_CHANNEL_EXPANSION_LIMIT, renderUpdates: false });
      if (!expanded.length || !isActiveSearchRequest(requestId) || state.route !== "search" || state.query !== query || state.filter !== filter) return;
      const channelsFromExpansion = deriveChannelsFromVideos(expanded, query);
      const merged = mergeSearchResults(state.searchResults, { videos: expanded, channels: channelsFromExpansion });
      state.searchResults = merged;
      writeSearchCache(query, filter, merged, { deferPersist: true });
      render();
      showToast("Added more videos from matching creators.");
    } catch {
      // Search already has first-pass results; background expansion is best-effort.
    }
  }, 0);
}

async function expandDiscoveredChannels(channels, options = {}) {
  const { limit = CHANNEL_DISCOVERY_IMPORT_LIMIT, renderUpdates = true } = options;
  const videos = [];
  for (const channel of channels.slice(0, 2)) {
    videos.push(...await expandChannelDiscovery(channel.id, false, { limit, renderUpdates }));
  }
  return uniqueVideos(videos);
}

async function discoverVideos(query, options = {}) {
  const { limit = VIDEO_SEARCH_IMPORT_LIMIT, enforceIntent = true, spotifyQueries = [] } = options;
  const discoveryQueries = uniqueStrings([query, ...spotifyQueries]).slice(0, 4);
  const responses = await Promise.allSettled(discoveryQueries.flatMap((item) => [
    fetchDiscoveryText(item, "videos"),
    fetchDiscoveryText(item, "shorts")
  ]));
  const texts = responses.filter((result) => result.status === "fulfilled").map((result) => result.value);
  if (!texts.length) throw responses.find((result) => result.status === "rejected")?.reason || new Error("Discovery unavailable");
  const discoveryResults = mergeVideoDiscoveryResults(texts);
  const urls = discoveryResults.map((result) => result.url);
  const viewHints = new Map(discoveryResults.map((result) => [parseYoutubeVideoId(result.url), result.viewCount]).filter(([id, views]) => id && views));
  const channelHints = new Map(discoveryResults.map((result) => [parseYoutubeVideoId(result.url), result.channelId]).filter(([id, channelId]) => id && channelId));
  const imported = await importVideosFromUrls(urls, { query, limit, enforceIntent, viewHints, channelHints });
  if (!enforceIntent) return rankVideos(imported);
  return rankSearchVideos(imported, query);
}

async function discoverVideoUrls(query, type = "videos", limit = 18) {
  return (await discoverVideoResults(query, type, limit)).map((result) => result.url);
}

async function discoverVideoResults(query, type = "videos", limit = 18) {
  const text = await fetchDiscoveryText(query, type);
  return extractYoutubeVideoResults(text).slice(0, limit);
}

async function importVideosFromUrls(urls, options = {}) {
  const { query = "", limit = VIDEO_SEARCH_IMPORT_LIMIT, enforceIntent = true, viewHints = new Map(), channelHints = new Map() } = options;
  const imported = [];
  const candidates = uniqueStrings(urls).slice(0, Math.max(limit * 3, limit));
  for (let index = 0; index < candidates.length && imported.length < limit; index += VIDEO_IMPORT_CONCURRENCY) {
    const batch = candidates.slice(index, index + VIDEO_IMPORT_CONCURRENCY);
    const results = await Promise.all(batch.map((url) => importVideoFromUrl(url, { quiet: true, updateView: false, requireMusic: true, query, deferPersist: true })));
    for (const video of results) {
      const hintedViews = viewHints instanceof Map ? viewHints.get(video?.id) : 0;
      const hintedChannelId = channelHints instanceof Map ? channelHints.get(video?.id) : "";
      if (video && hintedViews) {
        video.viewCount = bestViewCount(hintedViews, video.viewCount);
        cacheVideo(video, "discovery", false);
      }
      if (video && hintedChannelId) {
        video.sourceChannelId = hintedChannelId;
        video.sourceChannelVerified = true;
        cacheVideo(video, "discovery", false);
      }
      if (video && (!enforceIntent || matchesSearchIntent(video, query))) imported.push(video);
      if (imported.length >= limit) break;
    }
    await yieldToBrowser();
  }
  if (imported.length) schedulePersist();
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

function mergeVideoDiscoveryResults(texts) {
  const byUrl = new Map();
  for (const text of texts || []) {
    mergeVideoDiscoveryResult(byUrl, extractYoutubeVideoResults(text));
  }
  return [...byUrl.values()];
}

function mergeVideoDiscoveryResultSets(resultSets) {
  const byUrl = new Map();
  for (const results of resultSets || []) mergeVideoDiscoveryResult(byUrl, results);
  return [...byUrl.values()];
}

function mergeVideoDiscoveryResult(byUrl, results) {
  for (const result of results || []) {
    if (!result?.url) continue;
    const existing = byUrl.get(result.url) || { url: result.url, viewCount: 0, channelId: "" };
    byUrl.set(result.url, {
      url: result.url,
      viewCount: Math.max(parseViewCount(existing.viewCount), parseViewCount(result.viewCount)),
      channelId: existing.channelId || result.channelId || ""
    });
  }
}

function extractYoutubeVideoResults(text) {
  const decoded = decodeHtmlEntities(text || "");
  const expanded = `${decoded}\n${decodeEscapedSearchText(decoded)}`;
  return extractYoutubeVideoUrls(text).map((url) => ({
    url,
    viewCount: viewCountNearVideoId(expanded, parseYoutubeVideoId(url)),
    channelId: channelIdNearVideoId(expanded, parseYoutubeVideoId(url))
  }));
}

function viewCountNearVideoId(text, videoId) {
  if (!videoId) return 0;
  return largestViewCountInText(snippetNearVideoId(text, videoId));
}

function channelIdNearVideoId(text, videoId) {
  if (!videoId) return "";
  const snippet = snippetNearVideoId(text, videoId);
  const patterns = [
    /"authorId"\s*:\s*"(UC[A-Za-z0-9_-]{22})"/i,
    /"uploaderUrl"\s*:\s*"\/channel\/(UC[A-Za-z0-9_-]{22})"/i,
    /"authorUrl"\s*:\s*"\/channel\/(UC[A-Za-z0-9_-]{22})"/i,
    /(?:https?:\/\/(?:www\.)?youtube\.com)?\/channel\/(UC[A-Za-z0-9_-]{22})/i,
    /(?:^|[^A-Za-z0-9_-])(UC[A-Za-z0-9_-]{22})(?:$|[^A-Za-z0-9_-])/i
  ];
  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match?.[1]) return match[1];
  }
  return "";
}

function snippetNearVideoId(text, videoId) {
  const source = String(text || "");
  const index = source.indexOf(videoId);
  if (index < 0) return "";
  return source.slice(Math.max(0, index - 900), Math.min(source.length, index + 1800));
}

function largestViewCountInText(text) {
  let best = 0;
  const source = String(text || "");
  const numericPatterns = [
    /"viewCount"\s*:\s*"?([\d,.]+)"?/gi,
    /"views"\s*:\s*"?([\d,.]+)"?/gi,
    /"view_count"\s*:\s*"?([\d,.]+)"?/gi
  ];
  for (const pattern of numericPatterns) {
    for (const match of source.matchAll(pattern)) {
      best = Math.max(best, parseViewCount(match[1]));
    }
  }
  for (const match of source.matchAll(/([\d,.]+\s*[KMB]?)\s+views?/gi)) {
    best = Math.max(best, parseViewCount(match[1]));
  }
  return best;
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
  const { quiet = false, updateView = true, requireMusic = false, query = "", deferPersist = false } = options;
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
    state.recommendedChannels = [];
    state.dailyPlaylists = { date: "", playlists: [] };
    if (!deferPersist) persist();

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
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), METADATA_FETCH_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${OEMBED_PROXY_PATH}?url=${encodeURIComponent(watchUrl)}`, { cache: "no-store", signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
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
    authorUrl,
    channelUrl: authorUrl,
    thumbnail,
    publishedAt: "",
    duration: "",
    durationSeconds: 0,
    embeddable: true,
    isShort,
    categoryId: MUSIC_CATEGORY_ID,
    tags: [...new Set(["youtube", "oembed", isShort ? "shorts" : "video", ...tokenize(title).slice(0, 8)])],
    sources: ["oembed"],
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

async function expandChannelDiscovery(channelId, force, options = {}) {
  const { limit = CHANNEL_DISCOVERY_IMPORT_LIMIT, renderUpdates = true } = options;
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
  if (renderUpdates) render();

  try {
    const queries = channelDiscoveryQueries(channel);
    const query = queries[0] || channelDiscoveryQuery(channel);
    const perQueryLimit = Math.max(24, Math.ceil(limit / Math.max(1, queries.length)));
    const discoveryJobs = queries.flatMap((item, index) => [
      discoverVideoResults(item, "channel-videos", perQueryLimit),
      ...(index < CHANNEL_DISCOVERY_SHORT_QUERY_LIMIT ? [discoverVideoResults(item, "shorts", Math.max(12, Math.floor(perQueryLimit / 2)))] : [])
    ]);
    const discoveryResults = (await Promise.allSettled(discoveryJobs))
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
    const candidates = mergeVideoDiscoveryResultSets(discoveryResults);
    const viewHints = new Map(candidates.map((result) => [parseYoutubeVideoId(result.url), result.viewCount]).filter(([id, views]) => id && views));
    const channelHints = new Map(candidates.map((result) => [parseYoutubeVideoId(result.url), result.channelId]).filter(([id, discoveredChannelId]) => id && discoveredChannelId));
    const discovered = await importVideosFromUrls(candidates.map((result) => result.url), {
      query,
      limit,
      enforceIntent: false,
      viewHints,
      channelHints
    });
    const imported = discovered
      .map((video) => annotateChannelMatch(video, channel))
      .filter(Boolean);
    for (const video of imported) cacheVideo(video, "channel-discovery", false);

    const videos = uniqueVideos([...(existing.videos || []), ...storedVideos, ...imported]);
    cacheChannelVideos(channelId, videos, false, { markFetched: false });
    state.channelCache[channelId] = { channel, videos, nextPageToken: "", loading: false };
    state.channelDiscoveryFetchedAt[channelId] = Date.now();
    if (imported.length) {
      state.recommendations = [];
      state.recommendedChannels = [];
      state.dailyPlaylists = { date: "", playlists: [] };
    }
    if (renderUpdates) persist();
    else schedulePersist();
    if (renderUpdates) render();
    return imported;
  } catch (error) {
    state.channelCache[channelId] = { ...existing, channel, videos: uniqueVideos([...(existing.videos || []), ...storedVideos]), loading: false };
    state.channelDiscoveryFetchedAt[channelId] = Date.now();
    if (renderUpdates) persist();
    else schedulePersist();
    if (renderUpdates) render();
    if (force) showToast(friendlyDiscoveryError(error));
    return [];
  }
}

async function loadRecommendations(force) {
  const today = todayKey();
  if (!force && state.dailyPlaylists.date === today && state.dailyPlaylists.playlists.length && getRenderedDailyPlaylists().length) return;
  state.loading = true;
  render();

  const profile = buildRecommendationProfile();
  let discovered = { videos: [], channels: [] };
  if (!isFileMode()) {
    try {
      discovered = await discoverAiRecommendationCandidates(profile);
    } catch {
      discovered = { videos: [], channels: [] };
    }
  }

  const playlists = buildRecommendationPlaylists(profile, discovered.videos, discovered.relatedVideos);
  const playlistVideos = uniqueVideos(playlists.flatMap((playlist) => playlist.videoIds.map((id) => state.videoCache[id]).filter(Boolean)));
  const recommendedChannels = rankRecommendedChannels([...discovered.channels, ...deriveChannelsFromVideos([...discovered.videos, ...playlistVideos], "")], [...discovered.videos, ...playlistVideos]);

  state.dailyPlaylists = { date: today, playlists };
  state.recommendations = playlistVideos.slice(0, 42);
  state.recommendedChannels = recommendedChannels.slice(0, 12);
  cacheVideos(state.recommendations, "recommendations", false);
  cacheChannels(state.recommendedChannels, "recommendations", false);
  persist();
  state.loading = false;
  render();
  if (force) showToast(state.recommendations.length ? "Recommended refreshed with new unwatched music." : "No new unwatched music found yet.");
}

function buildRecommendationProfile() {
  const followedChannels = Object.values(state.followedChannels);
  const followedVideos = uniqueVideos(followedChannels.flatMap((channel) => channelVideos(channel.id))).filter(isLikelyMusicVideo);
  const likedVideos = Object.values(state.likedVideos).filter(isLikelyMusicVideo);
  const cachedVideos = Object.values(state.videoCache).filter(isLikelyMusicVideo);
  const seedVideos = uniqueVideos([...followedVideos, ...likedVideos, ...cachedVideos, ...demoVideos]);
  const matrix = getMetadataMatrix();
  const matrixTerms = topMatrixTerms(matrix, 12).filter(isUsefulRecommendationTerm);
  const weightedTerms = topProfileTerms(seedVideos, 12).filter(isUsefulRecommendationTerm);
  const genres = recommendationGenreTerms(seedVideos, [...matrixTerms, ...weightedTerms]).slice(0, 5);
  const terms = uniqueStrings([...genres, ...matrixTerms, ...weightedTerms]).slice(0, 8);
  const creators = followedChannels.length
    ? followedChannels
    : uniqueChannels(seedVideos.map(channelFromVideo)).slice(0, 5);
  const title = terms.slice(0, 3).join(", ") || "music";
  return { creators: creators.slice(0, 6), genres, terms, title, seedVideos };
}

async function discoverAiRecommendationCandidates(profile) {
  const videoQueries = recommendationVideoQueries(profile).slice(0, RECOMMENDATION_DISCOVERY_QUERY_LIMIT);
  const videoResults = await Promise.allSettled(
    videoQueries.map((query) => discoverVideos(query, { limit: RECOMMENDATION_IMPORT_LIMIT, enforceIntent: false }))
  );
  const videos = rankRecommendationVideos(videoResults.flatMap((result) => result.status === "fulfilled" ? result.value : []));
  cacheVideos(videos, "ai-recommendations", false);

  const channelQueries = recommendationChannelQueries(profile).slice(0, RECOMMENDATION_CHANNEL_QUERY_LIMIT);
  const channelResults = await Promise.allSettled(
    channelQueries.map((query) => discoverChannels(query, { limit: RECOMMENDATION_RELATED_CHANNEL_LIMIT, candidateVideos: videos, skipVideoFallback: false }))
  );
  const channels = uniqueChannels([
    ...channelResults.flatMap((result) => result.status === "fulfilled" ? result.value : []),
    ...videos.map(channelFromVideo)
  ]);
  cacheChannels(channels, "ai-recommendations", false);
  const relatedVideos = await discoverRelatedChannelHits(profile, channels);
  return { videos: uniqueVideos([...relatedVideos, ...videos]), channels, relatedVideos };
}

function recommendationVideoQueries(profile) {
  const queries = [];
  const primaryGenres = profile.genres.slice(0, 3);
  const primaryTerms = profile.terms.filter((term) => !primaryGenres.includes(term)).slice(0, 4);
  const primaryCreators = profile.creators.slice(0, 3);

  for (const genre of primaryGenres) {
    queries.push(`${genre} music videos`);
    queries.push(`new ${genre} songs official audio`);
  }
  if (primaryTerms.length) queries.push(`${primaryTerms.slice(0, 3).join(" ")} music videos`);
  for (const creator of primaryCreators) {
    const name = cleanRecommendationPhrase(creator.title);
    if (!name) continue;
    const genre = primaryGenres[0] || "music";
    queries.push(`artists like ${name} ${genre} music`);
    queries.push(`similar to ${name} music videos`);
  }
  queries.push("new music videos official audio");
  return uniqueStrings(queries.map(limitDiscoveryQuery));
}

function recommendationChannelQueries(profile) {
  const queries = [];
  const primaryGenres = profile.genres.slice(0, 3);
  const primaryCreators = profile.creators.slice(0, 3);
  for (const genre of primaryGenres) {
    queries.push(`${genre} music channels`);
    queries.push(`${genre} artists YouTube channels`);
  }
  for (const creator of primaryCreators) {
    const name = cleanRecommendationPhrase(creator.title);
    if (name) queries.push(`channels like ${name} music`);
  }
  if (profile.terms.length) queries.push(`${profile.terms.slice(0, 3).join(" ")} music channels`);
  return uniqueStrings(queries.map(limitDiscoveryQuery));
}

async function discoverRelatedChannelHits(profile, channels) {
  if (isFileMode() || isOffline()) return [];
  const relatedChannels = rankRecommendedChannels(channels, [])
    .filter((channel) => !isFollowing(channel.id))
    .slice(0, RECOMMENDATION_RELATED_CHANNEL_LIMIT);
  const relatedVideos = [];
  for (const channel of relatedChannels) {
    try {
      relatedVideos.push(...await discoverPopularChannelVideos(channel, profile));
    } catch {
      // Related-channel discovery is best-effort; one channel should not block the recommendation list.
    }
    await yieldToBrowser();
  }
  return rankPopularRecommendationVideos(relatedVideos).slice(0, RECOMMENDATION_RELATED_VIDEO_LIMIT);
}

async function discoverPopularChannelVideos(channel, profile) {
  const existing = sortChannelVideos(channelVideos(channel.id)).filter(isRecommendationVideo);
  const queries = popularChannelQueries(channel, profile).slice(0, 2);
  const results = await Promise.allSettled(
    queries.map((query) => discoverVideos(query, { limit: 8, enforceIntent: false }))
  );
  const discovered = results.flatMap((result) => result.status === "fulfilled" ? result.value : [])
    .filter((video) => isLikelyMusicVideo(video) && trustedChannelVideo(video, channel))
    .map((video) => ({ ...video, channelId: channel.id, channelTitle: channel.title || video.channelTitle }));
  if (discovered.length) {
    cacheChannel(channel, "related-recommendations", false);
    cacheChannelVideos(channel.id, discovered, false, { markFetched: false });
  }
  return uniqueVideos([...discovered, ...existing]).filter(isRecommendationVideo);
}

function popularChannelQueries(channel, profile) {
  const title = cleanRecommendationPhrase(channel.title);
  const genre = profile.genres[0] || profile.terms.find((term) => queryGenreTerms(term).length) || "music";
  return uniqueStrings([
    `${title} most viewed music videos`,
    `${title} popular ${genre} music videos`,
    `${title} official music videos`
  ].filter((query) => title && query).map(limitDiscoveryQuery));
}

function buildRecommendationPlaylists(profile, discoveredVideos = [], relatedVideos = []) {
  const pool = uniqueVideos([
    ...relatedVideos,
    ...discoveredVideos,
    ...Object.values(state.videoCache),
    ...state.searchResults.videos,
    ...demoVideos
  ]);
  const ranked = rankRecommendationVideos(pool);
  const discoveredRanked = rankRecommendationVideos(discoveredVideos).filter(isNewCreatorRecommendationVideo);
  const relatedRanked = rankPopularRecommendationVideos(relatedVideos).filter(isNewCreatorRecommendationVideo);
  const newCreatorVideos = ranked.filter(isNewCreatorRecommendationVideo);
  const likedSeedVideos = Object.values(state.likedVideos);
  const likedRelated = rankRecommendationVideos(newCreatorVideos.filter((video) => {
    if (!likedSeedVideos.length) return true;
    return likedSeedVideos.some((liked) => video.channelId === liked.channelId || sharedRecommendationTerms(video, liked) >= 2);
  }));
  const onePerCreator = oneVideoPerChannel(newCreatorVideos);
  const theme = profile.title || "your follows";
  const used = new Set();
  return [
    { id: "related-channel-hits", title: "Related Channel Hits", query: "Popular videos from channels like your follows", videoIds: takeRecommendationIds(relatedRanked, used, 12) },
    { id: "ai-discovery", title: "AI Discovery", query: `New creators related to ${theme}`, videoIds: takeRecommendationIds(uniqueVideos([...discoveredRanked, ...newCreatorVideos]), used, 14) },
    { id: "new-creator-radio", title: "New Creator Radio", query: "Unwatched videos from creators you do not follow", videoIds: takeRecommendationIds(onePerCreator, used, 14) },
    { id: "liked-radio", title: "Liked Radio", query: "Related music from new creators", videoIds: takeRecommendationIds(likedRelated.length ? likedRelated : newCreatorVideos, used, 14) }
  ].map((playlist) => ({ ...playlist, videoIds: uniqueStrings(playlist.videoIds).filter((id) => state.videoCache[id] && isNewCreatorRecommendationVideo(state.videoCache[id])) }))
    .filter((playlist) => playlist.videoIds.length);
}

function takeRecommendationIds(videos, used, limit) {
  const ids = [];
  for (const video of videos || []) {
    if (!isNewCreatorRecommendationVideo(video) || used.has(video.id)) continue;
    ids.push(video.id);
    used.add(video.id);
    if (ids.length >= limit) break;
  }
  return ids;
}

function oneVideoPerChannel(videos) {
  const channels = new Set();
  const firstPass = [];
  const leftovers = [];
  for (const video of videos || []) {
    if (!video?.channelId || channels.has(video.channelId)) {
      leftovers.push(video);
      continue;
    }
    channels.add(video.channelId);
    firstPass.push(video);
  }
  return uniqueVideos([...firstPass, ...leftovers]);
}

function getRenderedRecommendedChannels() {
  const playlistVideos = getRenderedDailyPlaylists().flatMap((playlist) => playlist.videos);
  const channels = uniqueChannels([
    ...(state.recommendedChannels || []),
    ...deriveChannelsFromVideos([...state.recommendations, ...playlistVideos], "")
  ]);
  return rankRecommendedChannels(channels, playlistVideos).slice(0, 12);
}

function rankRecommendedChannels(channels, videos = []) {
  const matrix = getMetadataMatrix();
  const videosByChannel = new Map();
  for (const video of videos || []) {
    if (!video?.channelId) continue;
    videosByChannel.set(video.channelId, (videosByChannel.get(video.channelId) || 0) + 1);
  }
  return uniqueChannels(channels)
    .filter((channel) => channel?.id && !isFollowing(channel.id) && !String(channel.id).startsWith("demo-"))
    .map((channel) => {
      const row = matrix.channelById.get(channel.id);
      const profileScore = row ? dotVectors(row.vector, matrix.profileVector) * 100 : 0;
      const videoBoost = Math.min(40, (videosByChannel.get(channel.id) || channelVideos(channel.id).length) * 8);
      const genreBoost = recommendationGenreTerms([], [searchable(channel)]).length ? 12 : 0;
      return { channel, score: profileScore + videoBoost + genreBoost + queryMatchScore(channel, channel.title || "") };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.channel);
}

function rankRecommendationVideos(videos) {
  return rankVideos(videos).filter(isRecommendationVideo);
}

function rankPopularRecommendationVideos(videos) {
  return sortVideosByPopularity(uniqueVideos(videos).filter(isRecommendationVideo));
}

function isRecommendationVideo(video) {
  return Boolean(video?.id) && isPlayableVideo(video) && isLikelyMusicVideo(video) && !isWatched(video.id) && !isLiked(video.id);
}

function isNewCreatorRecommendationVideo(video) {
  return isRecommendationVideo(video) && !isFollowing(video.channelId);
}

function recommendationGenreTerms(videos, extraTexts = []) {
  const weights = new Map();
  for (const video of videos || []) {
    const text = searchable(video);
    for (const term of allGenreTerms()) {
      if (tokenInText(term, text)) weights.set(term, (weights.get(term) || 0) + 2);
    }
  }
  for (const text of extraTexts || []) {
    for (const term of allGenreTerms()) {
      if (tokenInText(term, text)) weights.set(term, (weights.get(term) || 0) + 1);
    }
  }
  return [...weights.entries()].sort((a, b) => b[1] - a[1]).map(([term]) => term);
}

function sharedRecommendationTerms(a, b) {
  const aTerms = new Set(tokenize(`${a.title || ""} ${a.channelTitle || ""} ${(a.tags || []).join(" ")}`));
  const bTerms = new Set(tokenize(`${b.title || ""} ${b.channelTitle || ""} ${(b.tags || []).join(" ")}`));
  let shared = 0;
  for (const term of aTerms) if (bTerms.has(term)) shared += 1;
  return shared;
}

function isUsefulRecommendationTerm(term) {
  const value = String(term || "").toLowerCase();
  if (value.length < 3 || value.includes(":")) return false;
  return ![
    "youtube", "creator", "official", "video", "music", "song", "audio", "channel",
    "rss", "oembed", "shorts", "watch", "com", "www"
  ].includes(value);
}

function cleanRecommendationPhrase(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\w\s@.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function limitDiscoveryQuery(query) {
  return cleanRecommendationPhrase(query).slice(0, 110).trim();
}

function getRenderedDailyPlaylists() {
  const playlists = state.dailyPlaylists.playlists || [];
  if (playlists.length) {
    return playlists
      .map((playlist) => ({
        ...playlist,
        videos: (playlist.videoIds || []).map((id) => state.videoCache[id]).filter(isNewCreatorRecommendationVideo)
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
        const deepen = shouldDeepenChannel(channel.id);
        if (!force && !shouldRefreshChannel(channel.id) && !shouldDiscoverChannel(channel.id) && !deepen) continue;
        await refreshChannelLibrary(channel.id, { force, quiet: !force, deepen });
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
  const { force = false, quiet = false, throwOnError = false, deepen = false } = options;
  let feedResult = null;
  if (isRssChannelId(channelId)) {
    feedResult = await refreshChannelFeed(channelId, { force, quiet, throwOnError });
  }
  if (force || deepen || shouldDiscoverChannel(channelId)) {
    await expandChannelDiscovery(channelId, force || deepen);
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
    state.recommendedChannels = [];
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

function isOffline() {
  return navigator.onLine === false;
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

function shouldDeepenChannel(channelId) {
  if (!channelId || channelId.startsWith("demo-")) return false;
  const cachedCount = channelVideos(channelId).filter(isLikelyMusicVideo).length;
  if (cachedCount >= CHANNEL_DISCOVERY_TARGET_VIDEO_COUNT) return false;
  const fetchedAt = Number(state.channelDiscoveryFetchedAt[channelId] || 0);
  return !fetchedAt || Date.now() - fetchedAt > CHANNEL_DEEP_DISCOVERY_RETRY_MS;
}

function channelDiscoveryQuery(channel) {
  const handle = channelHandle(channel);
  return uniqueStrings([channel.title, handle].map(cleanRecommendationPhrase).filter((item) => item && item !== "YouTube creator"))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim() || channel.id;
}

function channelDiscoveryQueries(channel) {
  const base = channelDiscoveryQuery(channel);
  const title = cleanRecommendationPhrase(channel?.title || base);
  const handle = channelHandle(channel);
  const channelId = isRssChannelId(channel?.id) ? channel.id : "";
  return uniqueStrings([
    base,
    channelId ? `${title || "YouTube creator"} ${channelId} music videos` : "",
    channelId ? `${channelId} latest music videos` : "",
    title ? `${title} music videos` : "",
    title ? `${title} official music videos` : "",
    title ? `${title} most viewed music videos` : "",
    title ? `${title} latest music videos` : "",
    title ? `${title} shorts music` : "",
    handle ? `${handle} music videos` : ""
  ].filter(Boolean).map(limitDiscoveryQuery)).slice(0, CHANNEL_DISCOVERY_QUERY_LIMIT);
}

function channelHandle(channel) {
  const source = `${channel?.url || ""} ${channel?.description || ""}`;
  const handleMatch = source.match(/youtube\.com\/@([^/?#\s]+)/i) || source.match(/(^|\s)@([A-Za-z0-9._-]+)/);
  return (handleMatch?.[2] || handleMatch?.[1] || "").replace(/^@/, "");
}

function videoBelongsToChannel(video, channel) {
  return Boolean(channelMatchKind(video, channel));
}

function channelMatchKind(video, channel) {
  if (!video || !channel) return "";
  if (isRssChannelId(video.channelId) && video.channelId === channel.id) return "id";
  if (video.sourceChannelVerified && video.sourceChannelId === channel.id) return "id";
  if (video.channelId === channel.id && !isAmbiguousChannelDiscoveryVideo(video, channel)) return isRssChannelId(channel.id) ? "id" : "pseudo-id";
  if (isRssChannelId(channel.id)) return "";
  if (isRssChannelId(video.channelId)) return "";
  const handle = normalizeCreatorKey(channelHandle(channel));
  const videoChannelKey = normalizeCreatorKey(video.channelId);
  const videoChannelUrl = normalizeCreatorKey(channelUrlFromVideo(video));
  const channelUrl = normalizeCreatorKey(channel.url || channel.authorUrl || "");
  if (handle && videoChannelKey && videoChannelKey === handle) return "handle";
  if (channelUrl && videoChannelUrl && channelUrl === videoChannelUrl) return "url";
  if (exactCreatorTitleMatches(video, channel)) return "title";
  return "";
}

function trustedChannelVideo(video, channel) {
  return Boolean(video && channel && !isAmbiguousChannelDiscoveryVideo(video, channel) && channelMatchKind(video, channel));
}

function annotateChannelMatch(video, channel) {
  const matchKind = channelMatchKind(video, channel);
  if (!matchKind) return null;
  return {
    ...video,
    channelId: channel.id,
    channelTitle: exactCreatorTitleMatches(video, channel) ? video.channelTitle : channel.title || video.channelTitle,
    channelMatchKind: matchKind,
    sourceChannelId: video.sourceChannelVerified ? video.sourceChannelId : video.sourceChannelId || "",
    sourceChannelVerified: Boolean(video.sourceChannelVerified)
  };
}

function exactCreatorTitleMatches(video, channel) {
  const videoTitle = normalizeCreatorKey(video?.channelTitle);
  const channelTitle = normalizeCreatorKey(channel?.title);
  return Boolean(videoTitle && channelTitle && videoTitle === channelTitle);
}

function channelUrlFromVideo(video) {
  return video?.authorUrl || video?.channelUrl || video?.url || "";
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

async function cachedSearch(query, filter, requestId = activeSearchRequestId) {
  let matchedVideos = [];
  if (filter !== "channels") {
    const priorityVideos = uniqueVideos([
      ...videosFromFollowedChannels(query),
      ...videosFromCreatorIndex(query),
      ...Object.values(state.likedVideos)
    ]);
    matchedVideos = await topSearchVideosByChunks([
      ...priorityVideos,
      ...Object.values(state.videoCache)
    ], query, SEARCH_CACHE_VIDEO_RESULT_LIMIT, requestId);
  }

  if (!isActiveSearchRequest(requestId)) return { videos: [], channels: [] };

  const shouldIncludeChannels = filter !== "videos" || !matchedVideos.length;
  let matchedChannels = [];
  if (shouldIncludeChannels) {
    matchedChannels = await topSearchChannelsByChunks([
      ...channelsFromCreatorIndex(query),
      ...Object.values(state.followedChannels),
      ...Object.values(state.cachedChannels),
      ...deriveChannelsFromVideos(matchedVideos, query)
    ], query, matchedVideos, SEARCH_CACHE_CHANNEL_RESULT_LIMIT, requestId);
  }

  return {
    videos: filter !== "channels" ? matchedVideos : [],
    channels: shouldIncludeChannels ? matchedChannels : []
  };
}

async function topSearchVideosByChunks(videos, query, limit, requestId) {
  const scored = [];
  const seen = new Set();
  const candidates = uniqueVideos(videos);
  for (let index = 0; index < candidates.length; index += 1) {
    if (!isActiveSearchRequest(requestId)) return [];
    const video = candidates[index];
    if (!video?.id || seen.has(video.id)) continue;
    seen.add(video.id);
    if (isPlayableVideo(video) && isLikelyMusicVideo(video) && matchesSearchIntent(video, query)) {
      scored.push({ video, score: searchVideoScore(video, query) });
      trimScoredItems(scored, limit * 2);
    }
    if (index > 0 && index % SEARCH_CACHE_SCAN_BATCH_SIZE === 0) await yieldToBrowser();
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.video);
}

async function topSearchChannelsByChunks(channels, query, videos, limit, requestId) {
  const videoChannelIds = new Set((videos || []).map((video) => video.channelId).filter(Boolean));
  const scored = [];
  const seen = new Set();
  const candidates = uniqueChannels(channels);
  for (let index = 0; index < candidates.length; index += 1) {
    if (!isActiveSearchRequest(requestId)) return [];
    const channel = candidates[index];
    if (!channel?.id || seen.has(channel.id)) continue;
    seen.add(channel.id);
    if (videoChannelIds.has(channel.id) || matchesSearchIntent(channel, query)) {
      scored.push({ channel, score: (videoChannelIds.has(channel.id) ? 40 : 0) + queryMatchScore(channel, query) });
      trimScoredItems(scored, limit * 2);
    }
    if (index > 0 && index % SEARCH_CACHE_SCAN_BATCH_SIZE === 0) await yieldToBrowser();
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.channel);
}

function trimScoredItems(items, limit) {
  if (items.length <= limit * 2) return;
  items.sort((a, b) => b.score - a.score);
  items.length = limit;
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

function writeSearchCache(query, filter, results, options = {}) {
  state.searchCache[searchCacheKey(query, filter)] = {
    query,
    filter,
    videoIds: (results.videos || []).map((video) => video.id).filter(Boolean),
    channelIds: (results.channels || []).map((channel) => channel.id).filter(Boolean),
    fetchedAt: Date.now()
  };
  if (options.deferPersist) schedulePersist();
  else persist();
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
  const channel = state.cachedChannels[channelId] || state.channelCache[channelId]?.channel || null;
  return (state.channelVideoIds[channelId] || [])
    .map((id) => state.videoCache[id])
    .filter((video) => video && (!channel || trustedChannelVideo(video, channel)));
}

function normalizeCreatorKey(value) {
  return String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function primeCache() {
  cacheChannels(demoChannels, "demo", false);
  cacheVideos(demoVideos, "demo", false);
  cacheChannels(Object.values(state.followedChannels), "saved", false);
  cacheChannels(state.recommendedChannels, "saved", false);
  cacheVideos(Object.values(state.likedVideos), "saved", false);
  cacheVideos(Object.keys(state.recordings || {}).map(videoFromRecordingMetadata).filter(Boolean), "recording", false);
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
    if (!hasRecording(id) && !isLikelyMusicVideo(video)) {
      delete state.videoCache[id];
      delete state.likedVideos[id];
      changed = true;
    }
  }

  for (const [id, video] of Object.entries(state.likedVideos)) {
    if (!hasRecording(id) && !isLikelyMusicVideo(video)) {
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

  if (state.currentVideo && !hasRecording(state.currentVideo.id) && !state.videoCache[state.currentVideo.id] && !isLikelyMusicVideo(state.currentVideo)) {
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

function pruneAmbiguousChannelDiscoveryCache() {
  let changed = false;
  const channelIds = new Set([
    ...Object.keys(state.channelVideoIds || {}),
    ...Object.keys(state.channelCache || {})
  ]);

  for (const channelId of channelIds) {
    const channel = state.cachedChannels[channelId] || state.channelCache[channelId]?.channel || findChannel(channelId);
    if (!channel) continue;

    const ids = state.channelVideoIds[channelId] || [];
    if (ids.length) {
      const filteredIds = ids.filter((id) => {
        const video = state.videoCache[id];
        return trustedChannelVideo(video, channel);
      });
      if (filteredIds.length !== ids.length) {
        state.channelVideoIds[channelId] = filteredIds;
        delete state.channelDiscoveryFetchedAt[channelId];
        changed = true;
      }
    }

    const cache = state.channelCache[channelId];
    if (cache?.videos?.length) {
      const allowedIds = new Set(state.channelVideoIds[channelId] || []);
      const filteredVideos = cache.videos.filter((video) => {
        if (!video) return false;
        if (allowedIds.has(video.id)) return true;
        return trustedChannelVideo(video, channel);
      });
      if (filteredVideos.length !== cache.videos.length) {
        cache.videos = filteredVideos;
        cache.loading = false;
        delete state.channelDiscoveryFetchedAt[channelId];
        changed = true;
      }
    }
  }

  if (changed) {
    state.searchCache = {};
    state.recommendations = [];
    state.recommendedChannels = [];
    state.dailyPlaylists = { date: "", playlists: [] };
    metadataMatrix = null;
  }
  return changed;
}

function isAmbiguousChannelDiscoveryVideo(video, channel) {
  if (!video || !channel?.id || channel.id.startsWith("demo-")) return false;
  if (video.sourceChannelVerified && video.sourceChannelId === channel.id) return false;
  if (video.channelMatchKind && exactCreatorTitleMatches(video, channel)) return false;
  if ((video.tags || []).includes("rss") && isRssChannelId(video.channelId) && video.channelId === channel.id) return false;
  const sources = video.sources || [];
  if (sources.includes("channel-discovery") && !video.sourceChannelId) return true;
  if (sources.includes("channel-discovery") && !video.sourceChannelVerified && !video.channelMatchKind) return true;
  if (!sources.length && video.channelId === channel.id && !isRssChannelId(channel.id)) return true;
  return false;
}

function cacheVideos(videos, source = "seen", shouldPersist = true) {
  for (const video of videos || []) cacheVideo(video, source, false);
  if (shouldPersist) persist();
}

function cacheVideo(video, source = "seen", shouldPersist = true) {
  if (!video?.id) return;
  if (source !== "demo" && source !== "recording" && !isLikelyMusicVideo(video)) return;
  if (video.channelId) cacheChannel(channelFromVideo(video), source, false);
  const existing = state.videoCache[video.id] || {};
  const compacted = compactVideo(video);
  const sources = new Set([...(existing.sources || []), ...(video.sources || []), source]);
  state.videoCache[video.id] = {
    ...existing,
    ...compacted,
    embeddable: video.embeddable !== false,
    viewCount: bestViewCount(compacted.viewCount, existing.viewCount),
    sources: [...sources],
    firstSeenAt: existing.firstSeenAt || new Date().toISOString(),
    lastSeenAt: new Date().toISOString()
  };
  if (shouldPersist) persist();
}

function compactVideo(video) {
  return {
    id: video.id,
    source: video.source || "",
    spotifyId: video.spotifyId || "",
    spotifyUri: video.spotifyUri || "",
    spotifyUrl: video.spotifyUrl || "",
    title: video.title || "Untitled music video",
    channelId: video.channelId || "",
    channelTitle: video.channelTitle || "YouTube creator",
    sourceChannelId: video.sourceChannelId || "",
    sourceChannelVerified: Boolean(video.sourceChannelVerified),
    channelMatchKind: video.channelMatchKind || "",
    authorUrl: video.authorUrl || "",
    channelUrl: video.channelUrl || "",
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
  const channel = state.cachedChannels[channelId] || state.channelCache[channelId]?.channel || findChannel(channelId);
  const acceptedVideos = channel ? (videos || []).filter((video) => trustedChannelVideo(video, channel)) : (videos || []);
  cacheVideos(acceptedVideos, "channel", false);
  const existing = state.channelVideoIds[channelId] || [];
  const seen = new Set(existing);
  for (const video of acceptedVideos) {
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

  if (isSpotifyVideo(video)) {
    await playSpotifyTrack(video);
    return;
  }

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
  const removedRecommendation = markWatched(video, false);
  persist();
  if (removedRecommendation && state.route === "recommended") render();
  else renderPlayer();

  if (hasRecording(video.id)) {
    await playLocalRecording(video);
    return;
  }

  if (getLocalPlayer()) resetPlayerElement();
  ensurePlayer();

  if (ytPlayer && playerReady) {
    ytPlayer.loadVideoById(video.id);
  }
}

function ensurePlayer() {
  if (!state.currentVideo || ytPlayer || getLocalPlayer() || localRecordingLoading) return;
  if (isSpotifyVideo(state.currentVideo)) return;
  if (hasRecording(state.currentVideo.id)) {
    playLocalRecording(state.currentVideo).catch(() => {
      handleOfflinePlayer();
    });
    return;
  }
  if (isOffline()) {
    handleOfflinePlayer();
    return;
  }
  if (!ytReady) return;
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
          handlePlayerEnded();
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

async function playLocalRecording(video) {
  if (!video?.id) return;
  localRecordingLoading = true;
  try {
    const recording = await readRecordingBlob(video.id);
    if (!recording?.blob) {
      delete state.recordings[video.id];
      persist();
      render();
      handleOfflinePlayer();
      showToast("That recording is missing from browser storage.");
      return;
    }

    destroyYouTubePlayer();
    resetPlayerElement();
    const localPlayer = document.createElement("video");
    localRecordingUrl = URL.createObjectURL(recording.blob);
    localPlayer.id = "local-player";
    localPlayer.controls = true;
    localPlayer.autoplay = true;
    localPlayer.playsInline = true;
    localPlayer.src = localRecordingUrl;
    localPlayer.addEventListener("play", () => {
      state.isPlaying = true;
      renderPlayer();
    });
    localPlayer.addEventListener("pause", () => {
      state.isPlaying = false;
      renderPlayer();
    });
    localPlayer.addEventListener("ended", () => {
      state.isPlaying = false;
      handlePlayerEnded();
      renderPlayer();
    });
    localPlayer.addEventListener("error", () => {
      state.isPlaying = false;
      playerBlocked = true;
      resetPlayerElement();
      setPlayerFallback("Recording cannot play", "Try replacing this saved recording with a different video file.", 0);
      renderPlayer();
    });

    playerReady = true;
    playerBlocked = false;
    els.emptyPlayer.before(localPlayer);
    els.emptyPlayer.classList.add("hidden");
    try {
      await localPlayer.play();
      state.isPlaying = true;
    } catch {
      state.isPlaying = false;
    }
    renderPlayer();
  } finally {
    localRecordingLoading = false;
  }
}

function getLocalPlayer() {
  return document.getElementById("local-player");
}

function destroyYouTubePlayer() {
  if (ytPlayer && typeof ytPlayer.destroy === "function") {
    try {
      ytPlayer.destroy();
    } catch {}
  }
  ytPlayer = null;
}

async function playSpotifyTrack(video) {
  if (!canUseSpotifyPlayback()) {
    await playSpotifyFallback(video, state.spotify.premiumBlocked
      ? "Spotify needs Premium, so Melodify is using YouTube only."
      : "Using YouTube unless Spotify Premium is connected.");
    return;
  }

  playerBlocked = false;
  state.currentVideo = video;
  state.queue = uniqueVideos(Array.isArray(state.queue) && state.queue.length ? state.queue : [video]);
  state.queueIndex = Math.max(0, state.queue.findIndex((item) => item.id === video.id));
  const removedRecommendation = markWatched(video, false);
  persist();
  if (removedRecommendation && state.route === "recommended") render();
  else renderPlayer();

  destroyYouTubePlayer();
  resetPlayerElement();
  setSpotifyPlayerFrame(video, "Starting Spotify");

  const ready = await connectSpotifyPlayer();
  if (!ready) {
    await playSpotifyFallback(video, state.spotify.error || "Spotify playback is unavailable, so Melodify is using YouTube.");
    return;
  }

  const response = await spotifyApi(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(state.spotify.deviceId)}`, {
    method: "PUT",
    body: JSON.stringify({ uris: [video.spotifyUri] })
  });
  if (!response?.ok) {
    const premiumRequired = response?.status === 403;
    const message = premiumRequired
      ? "Spotify Premium is required for playback in Melodify."
      : "Spotify could not start this track.";
    if (premiumRequired) markSpotifyPremiumBlocked(message);
    state.spotify.error = message;
    await playSpotifyFallback(video, `${message} Using YouTube instead.`);
    return;
  }
  state.isPlaying = true;
  setSpotifyPlayerFrame(video, "Playing from Spotify");
  renderPlayer();
}

async function connectSpotifyPlayer() {
  if (state.spotify.premiumBlocked || !spotifyAccessToken()) return false;
  if (state.spotify.playerReady && state.spotify.deviceId) return true;
  if (!spotifySdkReady) {
    loadSpotifySdk();
    return false;
  }
  if (spotifyPlayerConnecting) return false;
  spotifyPlayerConnecting = true;

  try {
    if (!spotifyPlayer) {
      spotifyPlayer = new window.Spotify.Player({
        name: "Melodify",
        getOAuthToken: (callback) => callback(spotifyAccessToken()),
        volume: 0.7
      });
      spotifyPlayer.addListener("ready", ({ device_id: deviceId }) => {
        state.spotify.deviceId = deviceId;
        state.spotify.playerReady = true;
        state.spotify.error = "";
        renderPlayer();
      });
      spotifyPlayer.addListener("not_ready", () => {
        state.spotify.playerReady = false;
      });
      spotifyPlayer.addListener("player_state_changed", (playerState) => {
        if (!playerState || !isSpotifyVideo(state.currentVideo)) return;
        state.isPlaying = !playerState.paused;
        renderPlayer();
      });
      spotifyPlayer.addListener("initialization_error", ({ message }) => {
        state.spotify.error = message || "Spotify player could not start.";
      });
      spotifyPlayer.addListener("authentication_error", () => {
        state.spotify.error = "Spotify login expired.";
        state.spotify.accessToken = "";
        state.spotify.connected = false;
        saveSpotifyAuth();
        render();
      });
      spotifyPlayer.addListener("account_error", () => {
        markSpotifyPremiumBlocked("Spotify Premium is required, so Melodify will use YouTube only.");
        showToast(state.spotify.error);
      });
      spotifyPlayer.addListener("playback_error", ({ message }) => {
        state.spotify.error = message || "Spotify playback failed.";
        showToast(state.spotify.error);
      });
    }
    await spotifyPlayer.connect();
    if (!state.spotify.playerReady || !state.spotify.deviceId) await waitForSpotifyDevice();
    return Boolean(state.spotify.playerReady && state.spotify.deviceId);
  } catch {
    state.spotify.error = "Spotify player could not connect.";
    return false;
  } finally {
    spotifyPlayerConnecting = false;
  }
}

function canUseSpotifyPlayback() {
  return Boolean(state.spotify.configured && !state.spotify.premiumBlocked && state.spotify.connected && spotifyAccessToken());
}

function shouldShowSpotifyTrackResults() {
  return canUseSpotifyPlayback() && state.spotify.playerReady;
}

function markSpotifyPremiumBlocked(message) {
  state.spotify.premiumBlocked = true;
  state.spotify.connected = false;
  state.spotify.accessToken = "";
  state.spotify.expiresAt = 0;
  state.spotify.playerReady = false;
  state.spotify.deviceId = "";
  state.spotify.error = message || "Spotify Premium is required, so Melodify will use YouTube only.";
  if (spotifyPlayer) {
    try {
      spotifyPlayer.disconnect();
    } catch {}
  }
  spotifyPlayer = null;
  saveSpotifyAuth();
}

async function playSpotifyFallback(video, message) {
  if (message) showToast(message);
  setSpotifyPlayerFrame(video, "Finding a YouTube version");
  const fallback = await findYoutubeFallbackForSpotify(video);
  if (fallback) {
    const queue = uniqueVideos([
      fallback,
      ...(state.queue || []).filter((item) => item.id !== video.id && !isSpotifyVideo(item))
    ]);
    await playVideo(fallback, queue);
    return true;
  }

  state.currentVideo = video;
  state.isPlaying = false;
  renderPlayer();
  setPlayerFallback(
    "Using YouTube only",
    "Melodify could not find a YouTube version for this Spotify track yet.",
    0
  );
  return false;
}

async function findYoutubeFallbackForSpotify(video) {
  const query = spotifyFallbackQuery(video);
  const cached = rankSearchVideos(Object.values(state.videoCache).filter((item) => !isSpotifyVideo(item)), query)[0];
  if (cached) return cached;
  if (isOffline() || isFileMode()) return null;
  try {
    const discovered = await discoverVideos(query, { limit: 8, enforceIntent: true });
    return rankSearchVideos(discovered.filter((item) => !isSpotifyVideo(item)), query)[0] || discovered.find((item) => !isSpotifyVideo(item)) || null;
  } catch {
    return null;
  }
}

function spotifyFallbackQuery(video) {
  const artist = String(video?.channelTitle || "").trim();
  let title = String(video?.title || "").trim();
  if (artist) {
    title = title.replace(new RegExp(`^${escapeRegExp(artist)}\\s*-\\s*`, "i"), "").trim();
  }
  return uniqueStrings([artist, title, "official audio"]).join(" ").replace(/\s+/g, " ").trim();
}

function waitForSpotifyDevice() {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const check = () => {
      if (state.spotify.playerReady && state.spotify.deviceId) {
        resolve(true);
        return;
      }
      if (Date.now() - startedAt > 5000) {
        resolve(false);
        return;
      }
      window.setTimeout(check, 120);
    };
    check();
  });
}

async function spotifyApi(url, options = {}) {
  const token = spotifyAccessToken();
  if (!token) return null;
  return await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {})
    }
  });
}

function setSpotifyPlayerFrame(video, status) {
  playerBlocked = false;
  els.emptyPlayer.className = "empty-player spotify-player-frame";
  els.emptyPlayer.hidden = false;
  els.emptyPlayer.innerHTML = `
    <div class="spotify-frame-copy">
      ${video.thumbnail ? `<img src="${escapeAttr(video.thumbnail)}" alt="">` : `<span data-icon="music" aria-hidden="true"></span>`}
      <div>
        <p class="eyebrow">Spotify</p>
        <h3>${escapeHtml(video.title)}</h3>
        <p>${escapeHtml(status || "Spotify playback")}</p>
      </div>
    </div>
  `;
  installIcons(els.emptyPlayer);
}

function handleOfflinePlayer() {
  playerBlocked = true;
  resetPlayerElement();
  setPlayerFallback(
    "No saved recording for this video",
    "Open Recorded to play saved files offline, or add a local recording to this video while you have the file.",
    0
  );
  showToast("This YouTube item needs Wi-Fi unless you add a recording.");
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
  const localPlayer = getLocalPlayer();
  if (localPlayer) localPlayer.remove();
  if (localRecordingUrl) {
    URL.revokeObjectURL(localRecordingUrl);
    localRecordingUrl = "";
  }
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
  destroyYouTubePlayer();
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

  if (isSpotifyVideo(state.currentVideo)) {
    if (!canUseSpotifyPlayback() || !spotifyPlayer) {
      playSpotifyTrack(state.currentVideo).catch(() => {});
      return;
    }
    spotifyPlayer.togglePlay().catch(() => {
      showToast("Spotify playback needs a connected Premium account.");
    });
    return;
  }

  ensurePlayer();
  const localPlayer = getLocalPlayer();
  if (localPlayer) {
    if (localPlayer.paused) {
      localPlayer.play().catch(() => {});
    } else {
      localPlayer.pause();
    }
    return;
  }
  if (!ytPlayer || !playerReady) return;
  if (state.isPlaying) {
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
}

function handlePlayerEnded() {
  const localPlayer = getLocalPlayer();
  if (state.loop) {
    if (localPlayer) {
      localPlayer.currentTime = 0;
      localPlayer.play().catch(() => {});
    } else if (ytPlayer) {
      ytPlayer.seekTo(0);
      ytPlayer.playVideo();
    }
    return;
  }
  if (playAdjacent(1, { silent: true })) return;
  const fallbackQueue = fallbackPlaybackQueue();
  const currentId = state.currentVideo?.id || "";
  const currentIndex = fallbackQueue.findIndex((video) => video.id === currentId);
  const next = currentIndex >= 0
    ? fallbackQueue.slice(currentIndex + 1).find(isPlayableVideo) || fallbackQueue.find((video) => video.id !== currentId && isPlayableVideo(video))
    : fallbackQueue.find((video) => video.id !== currentId && isPlayableVideo(video));
  if (next) playVideo(next, fallbackQueue);
}

function playAdjacent(direction, options = {}) {
  const silent = options === true || Boolean(options.silent);
  if (!state.queue.length) return false;
  const nextIndex = findNextPlayableIndex(direction);
  if (nextIndex < 0) {
    if (!silent) showToast("No playable videos left in this queue.");
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

async function playVisibleVideos(shuffle) {
  const queue = shuffle ? shuffleVideos(playableListVideos(lastVisibleVideos)) : playableListVideos(lastVisibleVideos);
  if (!queue.length) {
    showToast("No playable music videos here yet.");
    return;
  }
  await playVideo(queue[0], queue);
  showToast(shuffle && queue.length > 1 ? "Shuffling this list." : "Playing this list.");
}

function playableListVideos(videos) {
  return uniqueVideos(videos || []).filter((video) => isPlayableVideo(video) && (hasRecording(video.id) || isLikelyMusicVideo(video)));
}

function shuffleVideos(videos) {
  const copy = [...videos];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function fallbackPlaybackQueue() {
  const routeVideos = state.route === "search"
    ? state.searchResults.videos
    : state.route === "recommended"
      ? state.recommendations
    : state.route === "liked"
      ? Object.values(state.likedVideos)
      : state.route === "channel"
        ? channelVideos(state.activeChannelId)
        : state.route === "recorded"
          ? getRecordedVideos()
          : [];
  return uniqueVideos([
    ...state.queue,
    ...lastVisibleVideos,
    ...routeVideos,
    ...demoVideos
  ]).filter((video) => isPlayableVideo(video) && (hasRecording(video.id) || isLikelyMusicVideo(video)));
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
  state.recommendedChannels = [];
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
  state.recommendedChannels = [];
  state.dailyPlaylists = { date: "", playlists: [] };
  persist();
  render();
}

function channelFromVideo(video) {
  return {
    id: video.channelId,
    title: video.channelTitle,
    description: video.authorUrl || video.channelUrl || "YouTube creator",
    thumbnail: video.thumbnail,
    url: video.authorUrl || video.channelUrl || "",
    uploadsPlaylistId: uploadsPlaylistIdFromChannelId(video.channelId)
  };
}

function hasRecording(videoId) {
  return Boolean(videoId && state.recordings?.[videoId]);
}

function isSpotifyVideo(video) {
  return Boolean(video?.source === "spotify" || video?.spotifyUri || String(video?.id || "").startsWith("spotify:"));
}

function getRecordedVideos() {
  return Object.keys(state.recordings || {})
    .map((id) => findVideo(id) || videoFromRecordingMetadata(id))
    .filter(Boolean)
    .sort((a, b) => recordingSortValue(b.id) - recordingSortValue(a.id));
}

function recordingSortValue(videoId) {
  return Date.parse(state.recordings?.[videoId]?.savedAt || state.watchedVideos?.[videoId]?.watchedAt || 0) || 0;
}

function videoFromRecordingMetadata(id) {
  const recording = state.recordings?.[id];
  if (!recording) return null;
  return {
    id,
    title: recording.title || recording.fileName || "Recorded video",
    channelId: recording.channelId || "",
    channelTitle: recording.channelTitle || "Recorded",
    thumbnail: recording.thumbnail || "",
    publishedAt: recording.publishedAt || "",
    duration: recording.duration || "",
    durationSeconds: Number(recording.durationSeconds || 0),
    embeddable: true,
    isShort: Boolean(recording.isShort),
    categoryId: recording.categoryId || MUSIC_CATEGORY_ID,
    tags: uniqueStrings([...(recording.tags || []), "recorded", "music video"]),
    watchUrl: recording.watchUrl || `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`
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
    videoFromRecordingMetadata(id) ||
    null
  );
}

function findChannel(id) {
  if (!id) return null;
  return (
    state.searchResults.channels.find((channel) => channel.id === id) ||
    state.cachedChannels[id] ||
    state.recommendedChannels.find((channel) => channel.id === id) ||
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

function isWatched(videoId) {
  return Boolean(state.watchedVideos[videoId]);
}

function markWatched(video, shouldPersist = true) {
  if (!video?.id) return false;
  state.watchedVideos[video.id] = {
    id: video.id,
    title: video.title || "",
    channelId: video.channelId || "",
    watchedAt: new Date().toISOString()
  };
  state.watchedVideos = compactWatchedVideos(state.watchedVideos);
  const changed = removeVideoFromRecommendations(video.id);
  if (changed) metadataMatrix = null;
  if (shouldPersist) persist();
  return changed;
}

function compactWatchedVideos(watched = {}) {
  return Object.fromEntries(
    Object.entries(watched || {})
      .filter(([id]) => id)
      .sort((a, b) => Date.parse(b[1]?.watchedAt || 0) - Date.parse(a[1]?.watchedAt || 0))
      .slice(0, WATCH_HISTORY_LIMIT)
  );
}

function removeVideoFromRecommendations(videoId) {
  if (!videoId) return false;
  let changed = false;
  const beforeRecommendations = state.recommendations.length;
  state.recommendations = state.recommendations.filter((video) => video?.id !== videoId);
  changed = changed || state.recommendations.length !== beforeRecommendations;

  const playlists = (state.dailyPlaylists.playlists || []).map((playlist) => {
    const videoIds = (playlist.videoIds || []).filter((id) => id !== videoId);
    if (videoIds.length !== (playlist.videoIds || []).length) changed = true;
    return { ...playlist, videoIds };
  }).filter((playlist) => playlist.videoIds.length);
  if (playlists.length !== (state.dailyPlaylists.playlists || []).length) changed = true;
  state.dailyPlaylists = { ...state.dailyPlaylists, playlists };
  return changed;
}

function isFollowing(channelId) {
  return Boolean(state.followedChannels[channelId]);
}

function isUnavailable(videoId) {
  return Boolean(state.sessionBlockedVideos[videoId]);
}

function isPlayableVideo(video) {
  if (isSpotifyVideo(video)) return canUseSpotifyPlayback();
  return Boolean(video?.id) && (hasRecording(video.id) || !isUnavailable(video.id));
}

function getLocalRecommendations() {
  const pool = uniqueVideos([...demoVideos, ...Object.values(state.videoCache), ...Object.values(state.likedVideos), ...state.searchResults.videos]);
  const ranked = rankRecommendationVideos(pool).filter(isNewCreatorRecommendationVideo);
  const fallback = demoVideos.filter(isNewCreatorRecommendationVideo);
  return ranked.length ? ranked : fallback;
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
  return matrixScore + followBoost + likedPenalty + recencyBoost + Math.min(4, parseViewCount(video.viewCount) / 100000000);
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

function openQueueModal() {
  const queue = orderedQueueVideos();
  const currentId = state.currentVideo?.id || "";
  const rows = queue.length
    ? queue.map((video, index) => renderQueueRow(video, index, video.id === currentId)).join("")
    : `<p class="empty-copy">Play a music video and Melodify will build an Up Next queue from the current list.</p>`;
  els.modalRoot.innerHTML = `
    <section class="modal queue-modal" role="dialog" aria-modal="true" aria-label="Up Next">
      <header class="modal-header">
        <h2>Up Next</h2>
        <button class="mini-action" type="button" data-action="close-modal" aria-label="Close">
          <span data-icon="close" aria-hidden="true"></span>
        </button>
      </header>
      <div class="modal-body">
        <div class="queue-list">${rows}</div>
      </div>
      <footer class="modal-actions">
        <p class="meta">${queue.length ? `${queue.length} videos in queue` : "Queue is empty"}</p>
        <button class="secondary-button" type="button" data-action="clear-queue" ${queue.length ? "" : "disabled"}>
          <span data-icon="close" aria-hidden="true"></span>
          <span>Clear queue</span>
        </button>
      </footer>
    </section>
  `;
  els.modalRoot.hidden = false;
  installIcons(els.modalRoot);
}

function orderedQueueVideos() {
  const queue = uniqueVideos(state.queue?.length ? state.queue : state.currentVideo ? [state.currentVideo] : []);
  const currentId = state.currentVideo?.id || "";
  const currentIndex = queue.findIndex((video) => video.id === currentId);
  if (currentIndex <= 0) return queue;
  return [queue[currentIndex], ...queue.slice(currentIndex + 1), ...queue.slice(0, currentIndex)];
}

function renderQueueRow(video, index, current) {
  return `
    <button class="queue-row ${current ? "active" : ""}" type="button" data-action="play-queue-video" data-video-id="${escapeAttr(video.id)}">
      <span class="queue-index">${current ? icon("play") : index + 1}</span>
      <span class="queue-thumb" style="background-image: url('${escapeAttr(video.thumbnail || "")}')"></span>
      <span class="queue-copy">
        <strong>${escapeHtml(video.title || "Untitled")}</strong>
        <span>${escapeHtml(video.channelTitle || "Music video")}</span>
      </span>
    </button>
  `;
}

function clearQueue() {
  if (state.currentVideo) {
    state.queue = [state.currentVideo];
    state.queueIndex = 0;
  } else {
    state.queue = [];
    state.queueIndex = -1;
  }
  persist();
  showToast("Queue cleared.");
}

function closeModal() {
  els.modalRoot.hidden = true;
  els.modalRoot.innerHTML = "";
}

function handleKeyboardShortcut(event) {
  const key = event.key;
  const typing = isTypingTarget(event.target);
  const mod = event.ctrlKey || event.metaKey;

  if (mod && key.toLowerCase() === "k") {
    event.preventDefault();
    focusSearch();
    return;
  }

  if (key === "Escape") {
    if (!els.modalRoot.hidden) {
      event.preventDefault();
      closeModal();
      return;
    }
    if (typing) event.target.blur();
    return;
  }

  if (typing) return;

  if (key === "/") {
    event.preventDefault();
    focusSearch();
    return;
  }

  if (key === " " || event.code === "Space") {
    event.preventDefault();
    togglePlayback();
    return;
  }

  if (key === "ArrowLeft") {
    event.preventDefault();
    playAdjacent(-1);
    return;
  }

  if (key === "ArrowRight") {
    event.preventDefault();
    playAdjacent(1);
  }
}

function isTypingTarget(target) {
  const tag = target?.tagName?.toLowerCase();
  return Boolean(target?.isContentEditable || tag === "input" || tag === "textarea" || tag === "select");
}

function focusSearch() {
  els.searchInput.focus();
  els.searchInput.select();
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
    .map((video) => ({ video, score: searchVideoScore(video, query) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.video);
}

function searchVideoScore(video, query) {
  return queryMatchScore(video, query) * 100 + searchPriorityBoost(video, query) + searchRecencyBoost(video);
}

function searchRecencyBoost(video) {
  const publishedAt = video?.publishedAt ? Date.parse(video.publishedAt) : 0;
  if (!publishedAt) return 0;
  return Math.max(0, 40 - (Date.now() - publishedAt) / (30 * 24 * 60 * 60 * 1000));
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
  if (isSpotifyVideo(video)) return true;
  if (String(video.channelId || "").startsWith("demo-")) return true;

  const text = searchable(video);
  const titleText = String(video.title || "").toLowerCase();
  const visibleText = `${video.title || ""} ${video.channelTitle || ""} ${video.description || ""}`.toLowerCase();
  const queryText = String(query || "").toLowerCase();
  const hasGameTitleSignal = hasTermSignal(titleText, GAME_TITLE_SIGNAL_TERMS);
  const hasTitleGameplayContext = hasTermSignal(titleText, TITLE_GAMEPLAY_CONTEXT_TERMS);
  const hasTitleMusicSignal = hasTermSignal(titleText, STRONG_MUSIC_SIGNAL_TERMS) || hasGenreSignal(titleText);
  if (hasGameTitleSignal && hasTitleGameplayContext && !hasTitleMusicSignal) return false;

  const hasStrongMusicSignal = hasTermSignal(visibleText, STRONG_MUSIC_SIGNAL_TERMS) || hasGenreSignal(visibleText);
  const hasHardNonMusicSignal = hasTermSignal(visibleText, HARD_NON_MUSIC_SIGNAL_TERMS);
  if (hasHardNonMusicSignal && !hasStrongMusicSignal) return false;

  const hasMusicSignal = hasTermSignal(text, MUSIC_SIGNAL_TERMS) || hasGenreSignal(text);
  const hasNonMusicSignal = hasTermSignal(visibleText, NON_MUSIC_SIGNAL_TERMS);
  if (hasNonMusicSignal && !hasStrongMusicSignal) return false;
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

function sortChannelVideos(videos) {
  return sortVideosByPopularity(videos);
}

function sortVideosByPopularity(videos) {
  return [...uniqueVideos(videos)]
    .sort((a, b) => {
      const viewDiff = parseViewCount(b.viewCount) - parseViewCount(a.viewCount);
      if (viewDiff) return viewDiff;
      const bPublished = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      const aPublished = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      if (bPublished !== aPublished) return bPublished - aPublished;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });
}

function bestViewCount(a, b) {
  const parsedA = parseViewCount(a);
  const parsedB = parseViewCount(b);
  return parsedA >= parsedB ? parsedA || a || "" : parsedB || b || "";
}

function parseViewCount(value) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  const text = String(value || "").replace(/,/g, "").trim();
  if (!text || /^no\s+views?$/i.test(text)) return 0;
  const match = text.match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return 0;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return 0;
  const suffix = String(match[2] || "").toUpperCase();
  const multiplier = suffix === "B" ? 1000000000 : suffix === "M" ? 1000000 : suffix === "K" ? 1000 : 1;
  return Math.max(0, Math.round(amount * multiplier));
}

function formatViewCount(value) {
  const count = parseViewCount(value);
  if (!count) return "";
  if (count >= 1000000000) return `${trimViewNumber(count / 1000000000)}B`;
  if (count >= 1000000) return `${trimViewNumber(count / 1000000)}M`;
  if (count >= 1000) return `${trimViewNumber(count / 1000)}K`;
  return String(count);
}

function trimViewNumber(value) {
  return value >= 10 ? String(Math.round(value)) : value.toFixed(1).replace(/\.0$/, "");
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

function startChannelBackgroundDiscoveryWatcher() {
  if (isFileMode()) return;
  const refresh = () => {
    runChannelBackgroundDiscovery().catch(() => {});
  };

  window.setTimeout(refresh, 25000);
  window.setInterval(refresh, CHANNEL_BACKGROUND_DISCOVERY_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
  });
}

async function runChannelBackgroundDiscovery() {
  if (channelBackgroundDiscoveryInFlight || isOffline()) return;
  const candidates = backgroundDiscoveryChannelIds()
    .filter((channelId) => channelId && !state.channelCache[channelId]?.loading)
    .filter((channelId) => shouldRefreshChannel(channelId) || shouldDiscoverChannel(channelId) || shouldDeepenChannel(channelId))
    .slice(0, CHANNEL_BACKGROUND_DISCOVERY_BATCH_SIZE);
  if (!candidates.length) return;

  channelBackgroundDiscoveryInFlight = true;
  try {
    for (const channelId of candidates) {
      const deepen = shouldDeepenChannel(channelId);
      await refreshChannelLibrary(channelId, { force: false, quiet: true, deepen });
      await yieldToBrowser();
    }
    if (state.route === "channel" || state.route === "following" || state.route === "recommended") render();
  } finally {
    channelBackgroundDiscoveryInFlight = false;
  }
}

function backgroundDiscoveryChannelIds() {
  return uniqueStrings([
    state.route === "channel" ? state.activeChannelId : "",
    ...Object.keys(state.followedChannels),
    ...(state.recommendedChannels || []).map((channel) => channel.id)
  ]);
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
