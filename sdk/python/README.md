# finekot

Python client for the [Finekot API](https://api.finekot.com): 89 pay-per-call services for AI agents (screenshots, web scraping, PDF and document processing, OCR, text-to-speech, speech-to-text, image tools, invoice and contract extraction, sanctions screening, validation, developer utilities).

```bash
pip install finekot
```

```python
from finekot import Finekot

fk = Finekot("fk_live_...")            # or set FINEKOT_API_KEY

shot = fk.call("screenshot", url="https://example.com", full_page=True)
print(shot["url"])                     # signed URL, valid 24 hours
print(fk.cost, fk.balance)             # EUR charged for this call, EUR remaining

text = fk.call("pdf-text", file="invoice.pdf")   # multipart upload
```

- `Finekot.call(service_id, **payload)` — `POST https://api.finekot.com/v1/<service_id>`; keyword arguments are the JSON body, `file=` switches to multipart.
- `Finekot.account()` — key info and balance.
- `Finekot.create_key(email)` — new key with free credit, no auth needed.
- `FinekotError` — raised on non-2xx; errors are not billed.

Service ids, parameters and prices: https://api.finekot.com/llms.txt. OpenAPI: https://api.finekot.com/openapi.json.

MCP server for Claude, Cursor and other agents: `https://api.finekot.com/mcp` (see the [repository README](https://github.com/denyskot1986/finekot-api-mcp)).

MIT license.
