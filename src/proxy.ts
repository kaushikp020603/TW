import { NextResponse, type NextRequest } from "next/server";
import { MAJOR_ARCANA } from "@/data/tarot";
import { cardSlug } from "@/data/cardSeo";

const VALID = new Set(MAJOR_ARCANA.map((c) => cardSlug(c.name)));

// Unknown card addresses get a genuine HTTP 404 (streamed pages can't change their status after the shell is sent).
export function proxy(req: NextRequest) {
  const m = req.nextUrl.pathname.match(/^\/cards\/([^/]+)\/?$/);
  if (m && !VALID.has(decodeURIComponent(m[1]))) return NextResponse.rewrite(new URL("/__not-found__", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/cards/:slug"] };
