// ---------- storage ----------
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem("lumen:" + k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem("lumen:" + k, JSON.stringify(v)); } catch {} },
};
const $ = (s) => document.querySelector(s);
const fav = (u) => `https://www.google.com/s2/favicons?domain=${new URL(u).hostname}&sz=64`;
window.imgFail = (img) => { const d = document.createElement("div"); d.className = "letter"; d.textContent = (img.dataset.n || "?")[0]; img.replaceWith(d); };
const toast = (m) => { const t = document.createElement("div"); t.className = "toast"; t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 2200); };

const ICONS = {
  play: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6 12h4M8 10v4"/><circle cx="15.5" cy="11" r=".6"/><circle cx="17.5" cy="13" r=".6"/></svg>',
  browser: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};

// ---------- data ----------
const DEFAULT_TILES = [
  { name: "Instagram", url: "https://www.instagram.com" },
  { name: "Spotify", url: "https://open.spotify.com" },
  { name: "TikTok", url: "https://www.tiktok.com" },
  { name: "YouTube", url: "https://www.youtube.com" },
  { name: "Play", action: "games", icon: "play" },
  { name: "Browser", action: "browser", icon: "browser" },
  { name: "SoundCloud", url: "https://soundcloud.com" },
  { name: "Discord", url: "https://discord.com/app" },
  { name: "Reddit", url: "https://www.reddit.com" },
];

const GAMES = [
  { name: "Slither.io", url: "https://slither.io", tag: "IO" },
  { name: "Krunker", url: "https://krunker.io", tag: "FPS" },
  { name: "Shell Shockers", url: "https://shellshock.io", tag: "FPS" },
  { name: "Smash Karts", url: "https://smashkarts.io", tag: "Racing" },
  { name: "Agar.io", url: "https://agar.io", tag: "IO" },
  { name: "Diep.io", url: "https://diep.io", tag: "IO" },
  { name: "Bloxd.io", url: "https://bloxd.io", tag: "Sandbox" },
  { name: "Venge.io", url: "https://venge.io", tag: "FPS" },
  { name: "Little Alchemy 2", url: "https://littlealchemy2.com", tag: "Puzzle" },
  { name: "2048", url: "https://play2048.co", tag: "Puzzle" },
  { name: "Chess", url: "https://www.chess.com/play/computer", tag: "Board" },
  { name: "Geoguessr", url: "https://www.geoguessr.com", tag: "Trivia" },
  { name: "Skribbl.io", url: "https://skribbl.io", tag: "Party" },
  { name: "Wordle", url: "https://www.nytimes.com/games/wordle", tag: "Puzzle" },
  { name: "Poki", url: "https://poki.com", tag: "Hub" },
  { name: "CrazyGames", url: "https://www.crazygames.com", tag: "Hub" },
];
const TRENDING = ["Krunker", "Slither.io", "Smash Karts", "Bloxd.io", "Shell Shockers"];

// ---------- proxy setup ----------
const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
  prefix: "/learn/",
  files: { wasm: "/scram/scramjet.wasm.wasm", all: "/scram/scramjet.all.js", sync: "/scram/scramjet.sync.js" },
});
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
const wispUrl = () => store.get("wisp", "") || `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/wisp/`;

let ready = (async () => {
  if (!("serviceWorker" in navigator)) throw new Error("Service workers not supported");
  await scramjet.init();
  await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl() }]);
})().catch((e) => { console.error(e); toast("Proxy failed to start: " + e.message); });

// ---------- url helpers ----------
const ENGINES = { ddg: "https://duckduckgo.com/?q=%s", google: "https://www.google.com/search?q=%s", bing: "https://www.bing.com/search?q=%s" };
function toUrl(input) {
  input = input.trim();
  if (/^https?:\/\//i.test(input)) return input;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(input)) return "https://" + input;
  return ENGINES[store.get("engine", "ddg")].replace("%s", encodeURIComponent(input));
}
function decode(src) {
  try { const p = new URL(src).pathname; return p.startsWith("/learn/") ? decodeURIComponent(p.slice(7)) + new URL(src).search : src; } catch { return src; }
}

// ---------- views ----------
function show(view) {
  $("#home").classList.toggle("hidden", view !== "home");
  $("#games").classList.toggle("hidden", view !== "games");
  $("#browser").classList.toggle("hidden", view !== "browser");
  document.body.classList.toggle("in-browser", view === "browser");
}
document.querySelectorAll("[data-home]").forEach((b) => (b.onclick = () => show("home")));

// ---------- home grid ----------
const tiles = () => store.get("tiles", DEFAULT_TILES);
function renderGrid() {
  const g = $("#grid");
  g.innerHTML = "";
  tiles().forEach((t, i) => {
    const el = document.createElement("button");
    el.className = "tile";
    el.innerHTML = (t.icon ? ICONS[t.icon] : `<img src="${fav(t.url)}" data-n="${t.name}" onerror="imgFail(this)" alt="">`) + `<span>${t.name}</span>`;
    if (t.custom) {
      const rm = document.createElement("div");
      rm.className = "rm"; rm.innerHTML = ICONS.x;
      rm.onclick = (e) => { e.stopPropagation(); const all = tiles(); all.splice(i, 1); store.set("tiles", all); renderGrid(); };
      el.append(rm);
    }
    el.onclick = () => (t.action === "games" ? openGames() : t.action === "browser" ? openBrowser() : openBrowser(t.url));
    g.append(el);
  });
  const add = document.createElement("button");
  add.className = "tile add";
  add.innerHTML = ICONS.plus + "<span>Add bookmark</span>";
  add.onclick = addBookmark;
  g.append(add);
}
function addBookmark() {
  modal(`<h3>Add bookmark</h3>
    <label class="field">Name<input id="bmName" placeholder="Twitch"></label>
    <label class="field">URL<input id="bmUrl" placeholder="twitch.tv"></label>
    <button class="btn primary" id="bmSave">Add</button>`);
  $("#bmSave").onclick = () => {
    const name = $("#bmName").value.trim(), raw = $("#bmUrl").value.trim();
    if (!name || !raw) return;
    store.set("tiles", [...tiles(), { name, url: toUrl(raw), custom: true }]);
    closeModal(); renderGrid();
  };
}
$("#search").onsubmit = (e) => { e.preventDefault(); const v = $("#q").value; if (v.trim()) { openBrowser(toUrl(v)); $("#q").value = ""; } };

// ---------- games ----------
function openGames() { show("games"); renderGames(""); $("#gameSearch").value = ""; }
function renderGames(f) {
  const list = [...GAMES, ...store.get("customGames", [])].filter((g) => g.name.toLowerCase().includes(f.toLowerCase()));
  $("#gameGrid").innerHTML = "";
  for (const g of list) {
    const el = document.createElement("button");
    el.className = "game";
    el.innerHTML = `<div class="thumb"><img src="${fav(g.url)}" data-n="${g.name}" onerror="imgFail(this)" alt=""></div><div class="meta"><b>${g.name}</b><small>${g.tag || ""}</small></div>`;
    el.onclick = () => openBrowser(g.url);
    $("#gameGrid").append(el);
  }
}
$("#gameSearch").oninput = (e) => renderGames(e.target.value);

// ---------- browser / tabs ----------
let tabList = [], active = null, uid = 0;
async function openBrowser(url) {
  show("browser");
  if (url) await newTab(url);
  else if (!tabList.length) await newTab(toUrl("https://duckduckgo.com"));
}
async function newTab(url) {
  await ready;
  const iframe = document.createElement("iframe");
  iframe.setAttribute("allow", "fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture");
  $("#frames").append(iframe);
  const frame = scramjet.createFrame(iframe);
  const tab = { id: ++uid, iframe, frame, title: "Loading…", url };
  tabList.push(tab);
  iframe.addEventListener("load", () => {
    try { tab.title = iframe.contentDocument.title || tab.title; } catch {}
    try { tab.url = decode(iframe.contentWindow.location.href); } catch {}
    renderTabs(); if (tab === active) $("#url").value = tab.url;
  });
  frame.addEventListener?.("urlchange", (e) => { tab.url = e.url; if (tab === active) $("#url").value = e.url; renderTabs(); });
  frame.go(url);
  select(tab);
}
function select(tab) {
  active = tab;
  tabList.forEach((t) => t.iframe.classList.toggle("active", t === tab));
  $("#url").value = tab.url || "";
  renderTabs();
}
function closeTab(tab) {
  tab.iframe.remove();
  tabList = tabList.filter((t) => t !== tab);
  if (!tabList.length) { active = null; show("home"); renderTabs(); return; }
  if (active === tab) select(tabList[tabList.length - 1]); else renderTabs();
}
function renderTabs() {
  const box = $("#tabs");
  box.innerHTML = "";
  for (const t of tabList) {
    const el = document.createElement("div");
    el.className = "tab" + (t === active ? " active" : "");
    let icon = ""; try { icon = `<img src="${fav(t.url)}" alt="">`; } catch {}
    el.innerHTML = `${icon}<span class="t"></span><button class="x">${ICONS.x}</button>`;
    el.querySelector(".t").textContent = t.title;
    el.onclick = () => select(t);
    el.querySelector(".x").onclick = (e) => { e.stopPropagation(); closeTab(t); };
    box.append(el);
  }
}
$("#newTab").onclick = () => newTab(toUrl("https://duckduckgo.com"));
$("#urlForm").onsubmit = (e) => { e.preventDefault(); const u = toUrl($("#url").value); active ? active.frame.go(u) : newTab(u); };
$("#bBack").onclick = () => active?.frame.back?.() ?? active?.iframe.contentWindow.history.back();
$("#bFwd").onclick = () => active?.frame.forward?.() ?? active?.iframe.contentWindow.history.forward();
$("#bReload").onclick = () => active?.frame.reload?.() ?? active?.iframe.contentWindow.location.reload();
$("#bFull").onclick = () => active?.iframe.requestFullscreen();
$("#openTabs").onclick = () => (tabList.length ? show("browser") : toast("No open tabs"));

// ---------- modals ----------
function modal(html) { $("#modalBody").innerHTML = html; $("#modal").classList.remove("hidden"); }
function closeModal() { $("#modal").classList.add("hidden"); }
$("#modalClose").onclick = closeModal;
$("#modal").onclick = (e) => e.target.id === "modal" && closeModal();

$("#trendingBtn").onclick = () => {
  const items = GAMES.filter((g) => TRENDING.includes(g.name));
  modal(`<h3>Trending</h3><div class="list">${items.map((g) => `<a href="#" data-u="${g.url}"><img src="${fav(g.url)}">${g.name}</a>`).join("")}</div>`);
  bindLinks();
};
document.querySelector('[data-modal="links"]').onclick = () => {
  const links = [
    ["YouTube", "https://www.youtube.com"], ["TikTok", "https://www.tiktok.com"], ["Instagram", "https://www.instagram.com"],
    ["Spotify", "https://open.spotify.com"], ["Twitch", "https://www.twitch.tv"], ["X", "https://x.com"], ["Pinterest", "https://www.pinterest.com"],
  ];
  modal(`<h3>Links</h3><div class="list">${links.map(([n, u]) => `<a href="#" data-u="${u}"><img src="${fav(u)}">${n}</a>`).join("")}</div>`);
  bindLinks();
};
function bindLinks() {
  document.querySelectorAll("[data-u]").forEach((a) => (a.onclick = (e) => { e.preventDefault(); closeModal(); openBrowser(a.dataset.u); }));
}

// ---------- settings (tab cloak, panic key, engine) ----------
const CLOAKS = {
  none: { title: "Home", icon: "data:," },
  classroom: { title: "Home", icon: "https://ssl.gstatic.com/classroom/favicon.png" },
  docs: { title: "Google Docs", icon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico" },
  drive: { title: "My Drive - Google Drive", icon: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png" },
  canvas: { title: "Dashboard", icon: "https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico" },
};
function applyCloak() {
  const c = CLOAKS[store.get("cloak", "none")] || CLOAKS.none;
  document.title = c.title; $("#favicon").href = c.icon;
}
document.querySelector('[data-modal="settings"]').onclick = () => {
  modal(`<h3>Settings</h3>
    <label class="field">Tab cloak<select id="sCloak">${Object.keys(CLOAKS).map((k) => `<option value="${k}">${k[0].toUpperCase() + k.slice(1)}</option>`).join("")}</select></label>
    <label class="field">Search engine<select id="sEngine"><option value="ddg">DuckDuckGo</option><option value="google">Google</option><option value="bing">Bing</option></select></label>
    <label class="field">Panic key (press to leave instantly)<input id="sPanicKey" maxlength="1" placeholder="\`"></label>
    <label class="field">Panic redirect<input id="sPanicUrl" placeholder="https://classroom.google.com"></label>
    <label class="field">Custom Wisp server (optional)<input id="sWisp" placeholder="wss://your-server/wisp/"></label>
    <div class="row"><button class="btn primary" id="sSave">Save</button><button class="btn" id="sBlank">Open in about:blank</button></div>`);
  $("#sCloak").value = store.get("cloak", "none");
  $("#sEngine").value = store.get("engine", "ddg");
  $("#sPanicKey").value = store.get("panicKey", "`");
  $("#sPanicUrl").value = store.get("panicUrl", "https://classroom.google.com");
  $("#sWisp").value = store.get("wisp", "");
  $("#sSave").onclick = async () => {
    store.set("cloak", $("#sCloak").value); store.set("engine", $("#sEngine").value);
    store.set("panicKey", $("#sPanicKey").value); store.set("panicUrl", $("#sPanicUrl").value);
    const wispChanged = store.get("wisp", "") !== $("#sWisp").value.trim();
    store.set("wisp", $("#sWisp").value.trim());
    if (wispChanged) await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl() }]);
    applyCloak(); closeModal(); toast("Saved");
  };
  $("#sBlank").onclick = openAboutBlank;
};
function openAboutBlank() {
  const w = window.open("about:blank", "_blank");
  if (!w) return toast("Allow popups to use about:blank");
  w.document.title = document.title;
  const f = w.document.createElement("iframe");
  f.src = location.href;
  f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0";
  w.document.body.style.margin = "0";
  w.document.body.append(f);
  location.replace(store.get("panicUrl", "https://classroom.google.com"));
}
addEventListener("keydown", (e) => {
  const k = store.get("panicKey", "`");
  if (k && e.key === k && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName))
    location.replace(store.get("panicUrl", "https://classroom.google.com"));
});
$("#resetLocal").onclick = () => {
  if (!confirm("Reset bookmarks and settings?")) return;
  Object.keys(localStorage).filter((k) => k.startsWith("lumen:")).forEach((k) => localStorage.removeItem(k));
  applyCloak(); renderGrid(); toast("Reset");
};

// ---------- starfield ----------
(function stars() {
  const c = $("#stars"), ctx = c.getContext("2d");
  let pts = [];
  const resize = () => {
    c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
    pts = Array.from({ length: 60 }, () => ({ x: Math.random() * c.width, y: Math.random() * c.height, r: Math.random() * 1.1 + 0.3, a: Math.random(), s: Math.random() * 0.004 + 0.001, v: Math.random() * 0.05 + 0.01 }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of pts) {
      p.a += p.s; p.y -= p.v; if (p.y < 0) p.y = c.height;
      ctx.globalAlpha = 0.25 + Math.abs(Math.sin(p.a)) * 0.45;
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * devicePixelRatio, 0, 7); ctx.fill();
    }
    requestAnimationFrame(draw);
  };
  addEventListener("resize", resize); resize(); draw();
})();

applyCloak();
renderGrid();
