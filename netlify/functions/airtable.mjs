// Setout — Airtable proxy.
// The browser never sees the Airtable token. It sends a passphrase; this
// function checks it, then forwards the call to Airtable with the real
// credentials from environment variables.
//
// Required env vars (Netlify → Site configuration → Environment variables):
//   AIRTABLE_TOKEN  personal access token, scopes data.records:read + data.records:write
//   AIRTABLE_BASE   the base id, e.g. appUk3r8qF6Pe1A0S
//   SETOUT_KEY      passphrase you type into the app once per device

import { timingSafeEqual } from "node:crypto";

const AIRTABLE = "https://api.airtable.com/v0";
const TABLES = new Set(["Tasks", "Categories"]);
const METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);
const RECORD_ID = /^rec[A-Za-z0-9]{14}$/;

const json = (status, message) =>
  new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

// Constant-time compare so the passphrase can't be guessed a character at a time.
function keyMatches(given, expected) {
  if (!given || !expected) return false;
  const a = Buffer.from(String(given), "utf8");
  const b = Buffer.from(String(expected), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });

  const token = process.env.AIRTABLE_TOKEN;
  const base = process.env.AIRTABLE_BASE;
  const secret = process.env.SETOUT_KEY;

  if (!token || !base || !secret) {
    return json(500, "Site is missing AIRTABLE_TOKEN, AIRTABLE_BASE or SETOUT_KEY");
  }
  if (!keyMatches(req.headers.get("x-setout-key"), secret)) {
    return json(401, "Wrong passphrase");
  }
  if (!METHODS.has(req.method)) {
    return json(405, "Method not allowed");
  }

  // Path is /api/airtable/<Table> or /api/airtable/<Table>/<recordId>
  const url = new URL(req.url);
  const marker = "/api/airtable/";
  const at = url.pathname.indexOf(marker);
  const rest = at === -1 ? "" : url.pathname.slice(at + marker.length);
  const parts = rest.split("/").filter(Boolean).map(decodeURIComponent);

  if (parts.length < 1 || parts.length > 2) return json(400, "Bad request path");

  const table = parts[0];
  const recordId = parts[1];

  // Allowlist: even with the passphrase, this proxy can only touch these two
  // tables in this one base. It can't reach the schema API or anything else.
  if (!TABLES.has(table)) return json(403, "That table is not available");
  if (recordId && !RECORD_ID.test(recordId)) return json(400, "Bad record id");

  let target = `${AIRTABLE}/${base}/${encodeURIComponent(table)}`;
  if (recordId) target += `/${recordId}`;
  if (url.search) target += url.search;

  const init = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (req.method === "POST" || req.method === "PATCH") {
    init.body = await req.text();
  }

  try {
    const res = await fetch(target, init);
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (e) {
    return json(502, "Could not reach Airtable: " + (e && e.message ? e.message : "unknown error"));
  }
};

export const config = { path: "/api/airtable/*" };
