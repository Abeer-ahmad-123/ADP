import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = "https://rxkulniazayfp0ib.private.blob.vercel-storage.com/site/hero-flag/1788212241124-whatsapp-image-2026-08-29-at-10-40-58-pm.jpeg";
const cacheError = "cache=0 is only available for private stores\n";

function setup(responses, token = "test-token") {
  const calls = [];
  const modules = new Map();
  function load(path) {
    if (modules.has(path)) return modules.get(path);
    const exports = {};
    modules.set(path, exports);
    const { outputText } = ts.transpileModule(readFileSync(`${path}.ts`, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    runInNewContext(outputText, {
      exports, URL, Headers, Request, Response,
      crypto: { randomUUID },
      process: { env: { BLOB_READ_WRITE_TOKEN: token } },
      require: (name) => load(name.replace("@/", "src/")),
      fetch: async (url, options) => {
        calls.push({ url: new URL(url), options });
        const response = responses.shift();
        assert.ok(response, "Unexpected upstream request");
        if (response instanceof Error) throw response;
        return response;
      },
    });
    return exports;
  }
  return { calls, route: load("src/app/api/media/route") };
}

function request(method = "GET", headers) {
  return new Request(`https://example.com/api/media?url=${encodeURIComponent(source)}`, { method, headers });
}

function assertNoStore(response, calls) {
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal(response.headers.get("vercel-cdn-cache-control"), "no-store");
  for (const call of calls) {
    assert.equal(call.options.cache, "no-store");
    assert.equal(call.options.redirect, "error");
    assert.equal(call.options.headers.get("Authorization"), "Bearer test-token");
  }
}

test("private image streams directly with cache=0 and no-store", async () => {
  const { route, calls } = setup([new Response("jpeg", { headers: { "Content-Type": "image/jpeg", "Content-Length": "4" } })]);
  const response = await route.GET(request());
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "jpeg");
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.searchParams.get("cache"), "0");
  assertNoStore(response, calls);
});

test("supplied legacy image retries only the public-store cache rejection", async () => {
  const { route, calls } = setup([
    new Response(cacheError, { status: 400 }),
    new Response("jpeg", { headers: { "Content-Type": "image/jpeg" } }),
  ]);
  const response = await route.GET(request());
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "jpeg");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url.searchParams.has("cache"), false);
  assert.ok(calls[1].url.searchParams.get("_uncached"));
  assert.equal(calls[1].url.hostname, new URL(source).hostname);
  assert.equal(calls[1].url.pathname, new URL(source).pathname);
  assertNoStore(response, calls);
});

test("legacy video range survives the retry and returns partial content", async () => {
  const { route, calls } = setup([
    new Response(cacheError, { status: 400 }),
    new Response("part", { status: 206, headers: { "Content-Range": "bytes 0-3/100", "Accept-Ranges": "bytes", "Content-Type": "video/mp4" } }),
  ]);
  const response = await route.GET(request("GET", { Range: "bytes=0-3" }));
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), "bytes 0-3/100");
  assert.equal(await response.text(), "part");
  assert.ok(calls.every((call) => call.options.headers.get("range") === "bytes=0-3"));
  assertNoStore(response, calls);
});

test("HEAD identifies legacy error with a bounded probe and retries HEAD", async () => {
  const { route, calls } = setup([
    new Response(null, { status: 400 }),
    new Response(cacheError, { status: 400 }),
    new Response(null, { headers: { "Content-Type": "image/jpeg", "Content-Length": "300721" } }),
  ]);
  const response = await route.HEAD(request("HEAD"));
  assert.equal(response.status, 200);
  assert.equal(response.body, null);
  assert.equal(response.headers.get("content-length"), "300721");
  assert.deepEqual(calls.map((call) => call.options.method), ["HEAD", "GET", "HEAD"]);
  assert.equal(calls[1].options.headers.get("range"), "bytes=0-0");
  assert.equal(calls[2].options.headers.has("range"), false);
  assertNoStore(response, calls);
});

test("HEAD for genuine private files requires one upstream request", async () => {
  const { route, calls } = setup([new Response(null)]);
  const response = await route.HEAD(request("HEAD"));
  assert.equal(response.status, 200);
  assert.equal(response.body, null);
  assert.equal(calls.length, 1);
});

for (const [status, body] of [[400, "Invalid range"], [401, "Unauthorized"], [403, "Forbidden"], [404, "Not found"]]) {
  test(`unrelated ${status} errors pass through without fallback`, async () => {
    const { route, calls } = setup([new Response(body, { status })]);
    const response = await route.GET(request());
    assert.equal(response.status, status);
    assert.equal(await response.text(), body);
    assert.equal(calls.length, 1);
    assertNoStore(response, calls);
  });
}

test("HEAD leaves unrelated errors unchanged", async () => {
  const { route, calls } = setup([new Response(null, { status: 400 }), new Response("Invalid request", { status: 400 })]);
  assert.equal((await route.HEAD(request("HEAD"))).status, 400);
  assert.equal(calls.length, 2);
});

test("invalid and explicitly public URLs are rejected before fetch", async () => {
  const { route, calls } = setup([]);
  for (const [url, status] of [["https://example.com/image.jpg", 400], [source.replace(".private.", ".public."), 409]]) {
    const response = await route.GET(new Request(`https://example.com/api/media?url=${encodeURIComponent(url)}`));
    assert.equal(response.status, status);
  }
  assert.equal(calls.length, 0);
});

test("missing token returns 503 without fetching", async () => {
  const { route, calls } = setup([], "");
  assert.equal((await route.GET(request())).status, 503);
  assert.equal(calls.length, 0);
});

test("network failure returns a no-store 502", async () => {
  const { route, calls } = setup([new Error("Network unavailable")]);
  const response = await route.GET(request());
  assert.equal(response.status, 502);
  assertNoStore(response, calls);
});
