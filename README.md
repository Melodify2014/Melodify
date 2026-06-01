# Melodify

Melodify is an installable static web app for playing YouTube music videos in a Spotify-style interface. It has search, app-level likes, app-level channel subscriptions, followed-channel pages, a bottom player bar, loop controls, and profile-based recommendations.

Melodify keeps a browser cache of video and channel metadata it has seen. Cached videos power search, recommendations, channel pages, and followed-channel browsing even when a feed cannot refresh later.

This version does not use a YouTube Data API key. Searches check the local cache first, then the launcher can run no-key music-focused public web discovery, fall back to unauthenticated Piped/Invidious search mirrors when result pages are empty, import matching YouTube videos through oEmbed metadata, and cache only results that look like music. Creator searches can also find a YouTube `/channel/UC...` URL, refresh that channel's public RSS feed, and cache its videos. Daily recommendation playlists are built from cached metadata.

Melodify also builds an in-memory local metadata matrix from cached titles, creators, tags, dates, duration hints, likes, and followed channels. The matrix improves cache search and recommendations without saving another large index to browser storage.

Discovered creators are saved in a local creator index even when you do not follow them, so creator search still works after reopening Melodify. Channel pages also run extra no-key discovery for normal videos and Shorts to expand beyond the small RSS feed window when Google can find more public results.

## Run or deploy

For a Windows app-style window, double-click `Connect This Laptop.bat` once, then use the `Melodify` shortcut it creates on the Desktop or Start Menu. That shortcut starts Melodify's local helper first, then opens the app at a fixed local app address (`http://127.0.0.1:8788/`).

For a taskbar app that does not need local helper files, deploy Melodify to Render and install the Render URL as the Edge app. The Render version runs `server.js`, which serves the app plus the `/yt/discover`, `/yt/oembed`, and `/yt/feed` helper routes online. Render uses `package.json` and `render.yaml` for the Node web service.

If you want a separate Melodify taskbar icon, double-click `Install Melodify.bat`. It opens Melodify in a normal Edge window so the menu is visible. In Edge, choose `Settings and more > Apps > Install this site as an app`, then pin the installed Melodify app to the taskbar. A pinned browser app is still powered by the browser, but Windows gives it its own Melodify app entry and icon.

After installing the Edge app, double-click `Connect This Laptop.bat` once. It points this laptop at the OneDrive-synced Melodify folder, creates Desktop and Start Menu shortcuts that launch the helper first, replaces any old startup helper that was serving a copied folder, and starts Melodify's local helper minimized. `Start Melodify on Login.bat` does the same setup without opening the browser. `Stop Melodify on Login.bat` removes that startup helper later.

For local use, use the `Melodify` Desktop or Start Menu shortcut. `Open Melodify.bat` is still available inside the folder, but the shortcut is easier and avoids opening `index.html` directly.

Melodify does not copy itself into a separate install folder. Keep this folder in OneDrive and the code updates across devices through OneDrive. On each Windows laptop, open the OneDrive-synced `Melodify` folder and double-click `Connect This Laptop.bat` once. After that, use the `Melodify` Desktop or Start Menu shortcut on each device.

Norton may block automatic shortcut installers that use PowerShell to create Start Menu entries, hide launcher windows, or pin taskbar icons. Melodify no longer uses that automatic installer path; the app files are plain HTML, CSS, JavaScript, and a local PowerShell launcher.

You can also upload the folder to any static host such as GitHub Pages, Netlify, Vercel, or Cloudflare Pages. For reliable YouTube playback, deploy it over HTTPS so the embedded YouTube player receives a proper referrer. The app also registers as a PWA when served over HTTP/HTTPS.

To use Render:

1. Put this folder in a GitHub repository.
2. In Render, create a new web service from that repository.
3. Use the included `render.yaml`, or set the build command to `npm install` and the start command to `npm start`.
4. After Render gives you an `https://...onrender.com` URL, open that URL in Edge.
5. In Edge, choose `Settings and more > Apps > Install this site as an app`, then pin the installed Melodify app to the taskbar.

Opening `index.html` directly still works for browsing, likes, following, and cached search, but embedded YouTube playback is blocked by YouTube from `file://` pages. If the helper is already running, Melodify automatically switches from the file page to the local app address. If it is not running, use the `Melodify` Desktop or Start Menu shortcut.

When Melodify is served through the launcher, the app shell checks for updates in the background and uses a network-first cache. If OneDrive syncs newer app files while Melodify is open, the running app refreshes itself automatically so you do not have to close and reopen it.

## Find creators

Use the top search bar for creator names or video names. Melodify searches its saved cache first; when launched with the `Melodify` Desktop or Start Menu shortcut, it also searches public web results for YouTube watch links, caches matching videos, and saves discovered creators so they still show up after reopening the app.

Multi-word searches are treated as disambiguation. For example, `naomi phonk` prefers results that match both `naomi` and `phonk`, instead of mixing in unrelated Naomi artists or unrelated phonk videos.

Search discovery asks for both normal videos and Shorts. Channel pages automatically refresh both normal videos and Shorts when opened and merge every music result Melodify can discover into the local channel cache, so there is no separate expand step.

You can also paste any of these:

- A YouTube video URL such as `https://www.youtube.com/watch?v=...`
- A raw channel ID such as `UC...`
- A YouTube channel URL like `https://www.youtube.com/channel/UC...`

When Melodify is opened with the local launcher, it exposes `GET /yt/discover?type=videos&q=...`, `GET /yt/discover?type=channels&q=...`, `GET /yt/oembed?url=...`, and `GET /yt/feed?channelId=UC...`. If you open `index.html` directly and the helper is not running, cached browsing still works, but discovery and feed refreshes ask you to use the `Melodify` Desktop or Start Menu shortcut.

## Platform limits

Melodify uses YouTube's supported RSS feed and embedded player. It does not scrape YouTube HTML pages. YouTube does not allow apps to bypass private, deleted, geo-blocked, embed-disabled, or otherwise unavailable videos. YouTube also does not allow separating the audio stream from the video stream or playing YouTube content in a hidden background player, so Melodify keeps a visible YouTube player in the bottom bar.

If a video fails with a YouTube playback error during autoplay, Melodify skips it for the current session and keeps the cached video available for later retry instead of permanently poisoning the cache.

Channel pages include `All`, `Videos`, and `Shorts` filters. Shorts are detected from cached duration metadata when it is available. RSS does not include reliable duration, so unknown-duration feed entries appear under `All` and `Videos`.

Useful YouTube references:

- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/required-minimum-functionality
