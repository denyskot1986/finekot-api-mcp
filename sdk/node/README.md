# finekot-api

Node client for the [Finekot API](https://api.finekot.com): 89 pay-per-call services for AI agents (screenshots, web scraping, PDF and document processing, OCR, text-to-speech, speech-to-text, image tools, invoice and contract extraction, sanctions screening, validation, developer utilities). Node 18+, no dependencies.

```bash
npm install finekot-api
```

```js
import { Finekot } from "finekot-api";

const fk = new Finekot("fk_live_...");          // or set FINEKOT_API_KEY

const shot = await fk.call("screenshot", { url: "https://example.com", full_page: true });
console.log(shot.url);                          // signed URL, valid 24 hours
console.log(fk.cost, fk.balance);               // EUR charged for this call, EUR remaining

import { openAsBlob } from "node:fs";
const text = await fk.call("pdf-text", { file: await openAsBlob("invoice.pdf") });  // multipart upload
```

- `fk.call(serviceId, payload)` — `POST https://api.finekot.com/v1/<serviceId>`; `payload` is the JSON body, `payload.file` (Blob/File) switches to multipart.
- `fk.account()` — key info and balance.
- `Finekot.createKey(email)` — new key with free credit, no auth needed.
- `FinekotError` — thrown on non-2xx; errors are not billed.

Service ids, parameters and prices: https://api.finekot.com/llms.txt. OpenAPI: https://api.finekot.com/openapi.json.

MCP server for Claude, Cursor and other agents: `https://api.finekot.com/mcp` (see the [repository README](https://github.com/denyskot1986/finekot-api-mcp)).

MIT license.
