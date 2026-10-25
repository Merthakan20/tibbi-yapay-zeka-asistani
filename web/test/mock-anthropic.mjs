// Yerel test için sahte Anthropic Messages API: akışlı (SSE) cevap verir, gelen isteği kaydeder.
// Gerçek API'ye istek gitmez, kredi harcanmaz.
import http from "node:http";
import { writeFileSync } from "node:fs";

const PORT = Number(process.argv[2] || 8799);
const LOG = process.argv[3] || new URL("./.istekler.json", import.meta.url).pathname;
const requests = [];

const sse = (res, type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);

http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => { body += c; });
  req.on("end", () => {
    if (req.method !== "POST" || !req.url.startsWith("/v1/messages")) { res.writeHead(404).end(); return; }
    const json = JSON.parse(body);
    requests.push({ url: req.url, beta: req.headers["anthropic-beta"] || null, key: req.headers["x-api-key"] || null, auth: req.headers["authorization"] || null, headers: Object.keys(req.headers), body: json });
    writeFileSync(LOG, JSON.stringify(requests, null, 1));
    const last = json.messages.at(-1);
    const lastText = typeof last.content === "string" ? last.content : last.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const imageCount = typeof last.content === "string" ? 0 : last.content.filter((b) => b.type === "image").length;
    let text = "ACİLİYET: evde\nBÖLÜM: Aile Hekimliği\n\nBu bir **sahte** test cevabıdır [1]. Bol su için ve dinlenin.";
    if (imageCount) text = `Görsel sayısı: ${imageCount}`;
    if (/YALNIZCA bir JSON dizisi/.test(lastText)) text = '[{"tarih":"2026-01-20","test":"Hemoglobin","anahtar":"hemoglobin","deger":13.1,"birim":"g/dL","alt":12,"ust":16}]';
    const refuse = /REDDET/.test(lastText);
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", "request-id": "req_sahte" });
    sse(res, "message_start", { message: { id: "msg_sahte", type: "message", role: "assistant", model: json.model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } });
    sse(res, "content_block_start", { index: 0, content_block: { type: "text", text: "" } });
    const parts = refuse ? [] : text.match(/.{1,12}/gs);
    let i = 0;
    const tick = setInterval(() => {
      if (i < parts.length) { sse(res, "content_block_delta", { index: 0, delta: { type: "text_delta", text: parts[i++] } }); return; }
      clearInterval(tick);
      sse(res, "content_block_stop", { index: 0 });
      sse(res, "message_delta", { delta: { stop_reason: refuse ? "refusal" : "end_turn", stop_sequence: null }, usage: { output_tokens: 20 } });
      sse(res, "message_stop", {});
      res.end();
    }, 15);
  });
}).listen(PORT, "127.0.0.1", () => console.log(`sahte Anthropic: http://127.0.0.1:${PORT}`));
