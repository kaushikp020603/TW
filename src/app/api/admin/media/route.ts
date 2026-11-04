import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { row, run, now } from "@/lib/db";

const MAX = 3 * 1024 * 1024; // 3 MB keeps the request under Vercel's 4.5 MB body limit
const ALLOWED = new Set(["audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/webm"]);

// POST multipart/form-data { file } → stores the audio in the database and returns its id.
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let file: File | null = null;
  try { const f = (await req.formData()).get("file"); file = f instanceof File ? f : null; } catch { /* handled below */ }
  if (!file) return NextResponse.json({ error: "Choose an audio file." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: `File is too large (${(file.size / 1048576).toFixed(1)} MB). Maximum is 3 MB. Try a shorter loop or a lower bitrate.` }, { status: 413 });
  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED.has(mime)) return NextResponse.json({ error: "Unsupported format. Use MP3, M4A, AAC, OGG, WAV or WebM audio." }, { status: 415 });
  const buf = new Uint8Array(await file.arrayBuffer());
  const r = await run("INSERT INTO media (name,mime,size,data,created) VALUES (?,?,?,?,?)", file.name.slice(0, 120), mime, buf.length, buf as unknown as string, now());
  await run("INSERT INTO activity (text,created) VALUES (?,?)", `Uploaded music “${file.name.slice(0, 60)}”`, now());
  const meta = await row("SELECT id,name,mime,size FROM media WHERE id=?", r.lastInsertRowid);
  return NextResponse.json({ ok: true, media: meta });
}
