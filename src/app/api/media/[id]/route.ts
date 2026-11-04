import { row } from "@/lib/db";

// Serves an uploaded audio file. Audio mime types only (enforced at upload), never executed or rendered as HTML.
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const m = await row<{ mime: string; data: ArrayBuffer | Uint8Array; size: number }>("SELECT mime,data,size FROM media WHERE id=?", Number(id) || 0);
  if (!m) return new Response("Not found", { status: 404 });
  const bytes = m.data instanceof Uint8Array ? m.data : new Uint8Array(m.data);
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
  const base = { "content-type": m.mime, "x-content-type-options": "nosniff", "accept-ranges": "bytes", "cache-control": "public, max-age=3600" };
  if (range) { // allow seeking / progressive playback
    const start = range[1] ? Number(range[1]) : 0, end = range[2] ? Math.min(Number(range[2]), bytes.length - 1) : bytes.length - 1;
    if (start > end || start >= bytes.length) return new Response(null, { status: 416, headers: { "content-range": `bytes */${bytes.length}` } });
    return new Response(bytes.slice(start, end + 1) as unknown as BodyInit, { status: 206, headers: { ...base, "content-range": `bytes ${start}-${end}/${bytes.length}`, "content-length": String(end - start + 1) } });
  }
  return new Response(bytes as unknown as BodyInit, { headers: { ...base, "content-length": String(bytes.length) } });
}
