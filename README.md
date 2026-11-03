# Finekot API — MCP server

Remote MCP server and REST API with 89 pay-per-call services for AI agents: screenshots, web scraping, PDF and document processing, OCR, text-to-speech, speech-to-text, image tools, invoice and contract extraction, sanctions screening, validation and developer utilities.

- MCP endpoint (Streamable HTTP): `https://api.finekot.com/mcp`
- Server card: https://api.finekot.com/.well-known/mcp.json
- OpenAPI: https://api.finekot.com/openapi.json
- Agent docs: https://api.finekot.com/llms.txt
- Pricing and service list: https://api.finekot.com

This repository holds the registry manifest (`server.json`), the client SDKs and the publishing workflows. The server itself is hosted; there is nothing to install or run locally.

## Billing

- One key, flat price per call. Prices start at €0.0002 per call and are listed per service at https://api.finekot.com.
- Charged only on HTTP 200. Errors are free.
- Every response carries `X-Cost` and `X-Balance` headers.
- Agents without a key can pay per call with x402 (USDC on Base): `POST https://api.finekot.com/x/v1/<service>`.
- Playground without a key: `POST https://api.finekot.com/v1/try/<service>`, 10 calls per day per IP.
- Files are processed in memory on EU servers and returned as a signed URL valid for 24 hours.

## Get a key

```bash
curl -X POST https://api.finekot.com/v1/keys \
  -H 'Content-Type: application/json' \
  -d '{"email": "you@example.com"}'
```

The response contains a key of the form `fk_live_…` with €1 of free credit. Balance top-up is at https://api.finekot.com.

## Connect

The MCP server authenticates with a bearer header. Replace `fk_live_…` with your key.

### Claude Desktop

Settings → Developer → Edit Config, then add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "finekot": {
      "url": "https://api.finekot.com/mcp",
      "headers": {
        "Authorization": "Bearer fk_live_…"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add --transport http finekot https://api.finekot.com/mcp \
  --header "Authorization: Bearer fk_live_…"
```

Or in `.mcp.json` at the project root:

```json
{
  "mcpServers": {
    "finekot": {
      "type": "http",
      "url": "https://api.finekot.com/mcp",
      "headers": {
        "Authorization": "Bearer fk_live_…"
      }
    }
  }
}
```

### Cursor

Settings → Tools & Integrations → New MCP Server, or `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "finekot": {
      "url": "https://api.finekot.com/mcp",
      "headers": {
        "Authorization": "Bearer fk_live_…"
      }
    }
  }
}
```

### Any other MCP client

Transport `streamable-http`, URL `https://api.finekot.com/mcp`, header `Authorization: Bearer fk_live_…`. Each tool returns its cost and the remaining balance.

## REST

Every service is also a plain HTTP endpoint: `POST https://api.finekot.com/v1/<service>` with a JSON body (or multipart for file upload).

```bash
curl -X POST https://api.finekot.com/v1/screenshot \
  -H 'Authorization: Bearer fk_live_…' \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com", "full_page": true}'
```

Parameters, prices and examples for all 89 services: https://api.finekot.com/llms.txt and https://api.finekot.com/openapi.json.

## Services

89 live services, listed below by REST service id. MCP tool names differ for some services (for example `remove-bg` is the tool `remove_background`, `scrape-md` is `url_to_markdown`); the full tool list is in the [server card](https://api.finekot.com/.well-known/mcp.json) and in `tools/list`.

- **Web** — `screenshot`, `scrape-md`, `web-answer`, `news-brief`, `llms-txt`, `web-search`, `seo-audit`, `seo-meta`, `change-monitor`, `link-preview`, `browser`, `uptime`, `domain-health`, `url-safety`
- **Images** — `remove-bg`, `compress`, `watermark`, `qr`, `barcode`, `og-image`, `color-palette`, `exif-strip`, `ocr`, `image-moderate`, `caption`, `chart-render`, `diagram-render`
- **Documents and PDF** — `html-pdf`, `pdf-tools`, `pdf-text`, `table-extract`, `doc-convert`, `csv-convert`, `md-convert`, `docx-gen`, `pdf-sign`, `file-type-detect`, `text-diff`
- **Audio and video** — `tts`, `stt`, `denoise`, `subtitles`, `video-clip`
- **Text and LLM** — `summarize`, `translate`, `extract-json`, `classify`, `rewrite`, `detect-lang`, `embed`, `semantic-search`, `doc-redact`, `readability-score`, `profanity-filter`, `entity-extract`, `prompt-guard`, `memory`, `lib-docs`, `paper-search`
- **Finance and compliance** — `invoice-parse`, `e-invoice`, `bank-statement-parse`, `purchase-order-extract`, `invoice-3way-match`, `contract-clause-extract`, `resume-parse`, `sanctions-screen`, `company-verify`, `vat-check`, `iban-validate`, `fx`
- **Validation and lookups** — `email-verify`, `phone-validate`, `ip-geo`, `vin-decode`, `weather`, `holidays`
- **Developer utilities** — `sql-lint`, `regex-test`, `hash`, `uuid`, `base64`, `jwt-tools`, `cron-explain`, `math-eval`, `unit-convert`, `tz-convert`, `webhook-relay`, `mcp-host`

## SDKs

Thin clients over the REST API. Both live in this repository.

### Python — `finekot`

```bash
pip install finekot
```

```python
from finekot import Finekot

fk = Finekot("fk_live_…")
result = fk.call("screenshot", url="https://example.com", full_page=True)
print(result["url"], fk.cost, fk.balance)
```

Source: [sdk/python](sdk/python).

### Node — `finekot-api`

```bash
npm install finekot-api
```

```js
import { Finekot } from "finekot-api";

const fk = new Finekot("fk_live_…");
const result = await fk.call("screenshot", { url: "https://example.com", full_page: true });
console.log(result.url, fk.cost, fk.balance);
```

Source: [sdk/node](sdk/node).

## Registry

`server.json` follows the official MCP Registry schema (`2025-12-11`). The `publish-mcp.yml` workflow publishes it to https://registry.modelcontextprotocol.io on every `v*` tag using GitHub OIDC.

## License

MIT. See [LICENSE](LICENSE). The hosted service is subject to the terms at https://api.finekot.com.
