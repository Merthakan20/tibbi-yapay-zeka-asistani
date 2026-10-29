// Düz (flat) insan çizimi: eklem noktalarından kalın, uçları yuvarlak çizgilerle gövde/kol/bacak.
export const SKIN = ["#f2c7a5", "#d9a07a", "#a8714f"];
export const dark = (hex, k = 0.8) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, "0")).join("");
export const line = (pts, w, c) => `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shoe = (f, s) => `<ellipse cx="${f[0]}" cy="${f[1]}" rx="${7 * s}" ry="${4.5 * s}" fill="#2f2f36"/>`;

// p: head, neck, hip, sh (omuz; yoksa neck), l/r kollar {el, ha}, lk/rk dizler, lf/rf ayaklar
// part: "all" | "body" (kollar hariç) | "arms" (yalnızca kollar) | "back" (arka kol+bacak) — katmanlamak için
export function person(p) {
  const s = p.scale || 1, sk = p.skin || SKIN[0], sh = p.shirt || "#4a90d9", pa = p.pants || "#34495e", hr = p.hair || "#4a3020";
  const W = { torso: 25 * s, arm: 9.5 * s, leg: 13 * s, head: 12.5 * s };
  const sho = p.sh || p.neck, part = p.part || "all";
  const arm = (a, front) => line([sho, a.el, a.ha], W.arm, front ? sh : dark(sh)) + `<circle cx="${a.ha[0]}" cy="${a.ha[1]}" r="${5.2 * s}" fill="${front ? sk : dark(sk, 0.92)}"/>`;
  if (part === "arms") return (p.r ? arm(p.r, false) : "") + (p.l ? arm(p.l, true) : "");
  let out = "";
  if (p.rk) out += line([p.hip, p.rk, p.rf], W.leg, dark(pa)) + shoe(p.rf, s);
  if (p.r && part === "all") out += arm(p.r, false);
  if (p.lk) out += line([p.hip, p.lk, p.lf], W.leg, pa) + shoe(p.lf, s);
  out += line([p.neck, p.hip], W.torso, sh);
  out += line([p.neck, p.head], 7 * s, sk);
  const [hx, hy] = p.head, ang = p.hairAng ?? -90, R = W.head + 1.5 * s;
  if (p.longHair) out += `<ellipse cx="${hx}" cy="${hy}" rx="${R + 1}" ry="${R + 6 * s}" fill="${hr}" transform="rotate(${ang + 90} ${hx} ${hy}) translate(0 ${5 * s})"/>`;
  out += `<circle cx="${hx}" cy="${hy}" r="${W.head}" fill="${sk}"/>`;
  const span = p.hairSpan ?? 100, a1 = ((ang - span) * Math.PI) / 180, a2 = ((ang + span) * Math.PI) / 180;
  out += `<path d="M${hx + R * Math.cos(a1)},${hy + R * Math.sin(a1)} A${R},${R} 0 0 1 ${hx + R * Math.cos(a2)},${hy + R * Math.sin(a2)} Z" fill="${hr}"/>`;
  if (p.eye) out += `<circle cx="${p.eye[0]}" cy="${p.eye[1]}" r="${1.5 * s}" fill="#2b2b2b"/>`;
  if (p.closed) out += `<path d="M${p.closed[0] - 3 * s},${p.closed[1]} q${3 * s},${2.2 * s} ${6 * s},0" stroke="#2b2b2b" stroke-width="${1.4 * s}" fill="none" stroke-linecap="round"/>`;
  if (p.mouth) out += `<path d="${p.mouth}" stroke="#7a3a2a" stroke-width="${1.6 * s}" fill="none" stroke-linecap="round"/>`;
  if (p.l && part === "all") out += arm(p.l, true);
  return out;
}
export const T = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-family="Figtree,Segoe UI,sans-serif" font-size="${o.size || 13}" font-weight="${o.bold ? 700 : 500}" fill="${o.c || "#34495e"}"${o.anchor ? ` text-anchor="${o.anchor}"` : ""}>${t}</text>`;
export const arrow = (d, head, c = "#e85d5d") => `<path d="${d}" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="${head}" fill="${c}"/>`;
export const svg = (body, label) => `<svg viewBox="0 0 320 210" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="210" fill="#f3f7fa"/>${body}</svg>`;
export const floor = (y = 180, c = "#e3eaee") => `<rect x="0" y="${y}" width="320" height="${210 - y}" fill="${c}"/>`;
export const NO = (x, y, t) => `<circle cx="${x + 7}" cy="${y - 4}" r="7" fill="#e85d5d"/><path d="M${x + 4},${y - 7} l6,6 M${x + 10},${y - 7} l-6,6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>` + T(x + 19, y, t, { size: 12, c: "#c4302b", bold: true });
