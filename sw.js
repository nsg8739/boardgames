// 보드게임 모음 서비스워커 — 설치형(PWA) + 오프라인 폴백.
// 전략: 같은 출처 GET은 네트워크 우선(항상 최신) → 실패 시 캐시. 외부(중계 서버·도블 iframe)는 건드리지 않음.
const CACHE = "boardgames-v5";
const SHELL = [
  "./", "./index.html",
  "./davinci.html", "./baseball.html", "./loveletter.html", "./gridgames.html", "./oncard.html", "./battleship.html", "./nothanks.html", "./themind.html", "./sixnimmt.html", "./sudoku.html", "./setgame.html", "./incangold.html", "./hanabi.html", "./pointsalad.html", "./dobble.html", "./versus.html", "./pong.html",
  "./manifest.json", "./icon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return;  // 외부 리소스는 그대로 네트워크로
  // 페이지(HTML) 탐색 요청은 브라우저 캐시를 우회해 항상 최신본을 받아온다(오래된 버전 표시 방지)
  const doc = req.mode === "navigate";
  e.respondWith(
    fetch(doc ? new Request(req, { cache: "no-cache" }) : req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
  );
});
