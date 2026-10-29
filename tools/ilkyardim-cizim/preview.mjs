import { writeFileSync } from "node:fs";
const S = (await import("./scenes.mjs?" + Date.now())).default;
writeFileSync(process.argv[2], `<!doctype html><meta charset=utf-8><body style="margin:0;background:#ddd;display:flex;flex-wrap:wrap;gap:10px;padding:10px">${Object.entries(S).map(([k, v]) => `<div style="width:420px;background:#fff"><div style="font:12px sans-serif">${k}</div>${v.replace("<svg", '<svg width="420"')}</div>`).join("")}</body>`);
