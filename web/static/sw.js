// Nabız çevrimdışı önbelleği: sayfa ve kütüphane internet yokken de açılır.
// Yollar göreli: site kökte de (Cloudflare) alt yolda da (GitHub Pages) çalışır.
// Sürüm ve açılış dosyaları derleme sırasında (build.mjs) doldurulur; her yayında eski önbellek silinir.
const CACHE = "nabiz-__SURUM__";
const BASE = new URL("./", self.location).href;
const SHELL = __SHELL__.map((p) => new URL(p, BASE).href);

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || !url.href.startsWith(BASE) || url.pathname.includes("/api/")) return;
  // Sayfalar ve kütüphane: önce ağ (güncel kalsın), olmazsa önbellek
  if (e.request.mode === "navigate" || url.pathname.endsWith("/kaynaklar.json")) {
    e.respondWith(fetch(e.request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return r;
    }).catch(async () => (await caches.match(e.request, { ignoreSearch: true })) || caches.match(BASE)));
    return;
  }
  // Diğerleri (3D model, simgeler, betikler): önce önbellek
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return r;
  })));
});
