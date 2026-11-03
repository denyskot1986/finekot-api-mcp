// Client for the Finekot API (https://api.finekot.com). Node 18+, no dependencies.
//
//   import { Finekot } from "finekot-api";
//   const fk = new Finekot("fk_live_...");
//   const shot = await fk.call("screenshot", { url: "https://example.com", full_page: true });
//   console.log(shot.url, fk.cost, fk.balance);

const BASE_URL = "https://api.finekot.com";
const VERSION = "0.1.0";

export class FinekotError extends Error {
  constructor(status, body) {
    const message = body && typeof body === "object" && body.error ? body.error : String(body);
    super(`HTTP ${status}: ${message}`);
    this.name = "FinekotError";
    this.status = status;
    this.body = body;
  }
}

export class Finekot {
  /**
   * @param {string} [apiKey] key of the form fk_live_...; falls back to FINEKOT_API_KEY
   * @param {{baseUrl?: string, timeout?: number}} [options]
   */
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey || (typeof process !== "undefined" ? process.env.FINEKOT_API_KEY : undefined);
    if (!this.apiKey) throw new Error("apiKey is required (or set FINEKOT_API_KEY)");
    this.baseUrl = (options.baseUrl || BASE_URL).replace(/\/+$/, "");
    this.timeout = options.timeout ?? 120000;
    /** EUR charged for the last call */
    this.cost = null;
    /** EUR remaining on the key after the last call */
    this.balance = null;
  }

  /**
   * Call a service by id, for example "screenshot" or "pdf-text".
   * `payload` becomes the JSON body. Pass `payload.file` as a Blob/File to send multipart.
   */
  async call(serviceId, payload = {}) {
    const url = `${this.baseUrl}/v1/${String(serviceId).replace(/^\/+|\/+$/g, "")}`;
    const { file, ...rest } = payload;
    let body;
    const headers = { Authorization: `Bearer ${this.apiKey}`, "User-Agent": `finekot-node/${VERSION}` };
    if (file === undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(rest);
    } else {
      body = new FormData();
      for (const [k, v] of Object.entries(rest)) body.append(k, typeof v === "boolean" ? String(v) : v);
      body.append("file", file, file.name || "file");
    }
    const resp = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(this.timeout) });
    return this._handle(resp);
  }

  /** Key info and balance: GET /v1/me */
  async account() {
    const resp = await fetch(`${this.baseUrl}/v1/me`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      signal: AbortSignal.timeout(this.timeout),
    });
    return this._handle(resp);
  }

  /** Create a key with free credit: POST /v1/keys. No auth needed. */
  static async createKey(email, baseUrl = BASE_URL) {
    const resp = await fetch(`${baseUrl}/v1/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await readBody(resp);
    if (!resp.ok) throw new FinekotError(resp.status, body);
    return body;
  }

  async _handle(resp) {
    this.cost = toNumber(resp.headers.get("x-cost"));
    this.balance = toNumber(resp.headers.get("x-balance"));
    const body = await readBody(resp);
    if (!resp.ok) throw new FinekotError(resp.status, body);
    return body;
  }
}

async function readBody(resp) {
  const ctype = resp.headers.get("content-type") || "";
  if (ctype.includes("json")) {
    const text = await resp.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  if (ctype.startsWith("text/")) return resp.text();
  return new Uint8Array(await resp.arrayBuffer());
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default Finekot;
