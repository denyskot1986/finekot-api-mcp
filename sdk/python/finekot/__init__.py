"""Client for the Finekot API (https://api.finekot.com).

    from finekot import Finekot
    fk = Finekot("fk_live_...")
    result = fk.call("screenshot", url="https://example.com", full_page=True)
    print(result["url"], fk.cost, fk.balance)
"""

from __future__ import annotations

import os
from typing import Any, Optional

import requests

__all__ = ["Finekot", "FinekotError"]
__version__ = "0.1.0"

BASE_URL = "https://api.finekot.com"


class FinekotError(Exception):
    """Raised when the API returns a non-2xx status. Errors are not billed."""

    def __init__(self, status: int, body: Any):
        self.status = status
        self.body = body
        message = body.get("error") if isinstance(body, dict) else body
        super().__init__(f"HTTP {status}: {message}")


class Finekot:
    """Thin client over ``POST /v1/<service>``.

    Every successful call updates ``cost`` (EUR charged for the last call)
    and ``balance`` (EUR remaining on the key) from the response headers.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = BASE_URL,
        timeout: float = 120.0,
    ):
        self.api_key = api_key or os.environ.get("FINEKOT_API_KEY")
        if not self.api_key:
            raise ValueError("api_key is required (or set FINEKOT_API_KEY)")
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.cost: Optional[float] = None
        self.balance: Optional[float] = None
        self._session = requests.Session()
        self._session.headers["Authorization"] = f"Bearer {self.api_key}"
        self._session.headers["User-Agent"] = f"finekot-python/{__version__}"

    def call(self, service_id: str, **payload: Any) -> Any:
        """Call a service by id (for example ``"screenshot"`` or ``"pdf-text"``).

        Keyword arguments become the JSON body. Pass ``file=`` with a path or a
        file object to send multipart instead of JSON. Returns the decoded JSON
        body (or raw bytes for binary responses).
        """
        url = f"{self.base_url}/v1/{service_id.strip('/')}"
        file = payload.pop("file", None)
        if file is None:
            resp = self._session.post(url, json=payload, timeout=self.timeout)
        else:
            close = False
            if isinstance(file, (str, os.PathLike)):
                file = open(file, "rb")
                close = True
            try:
                data = {k: _form_value(v) for k, v in payload.items()}
                resp = self._session.post(
                    url, data=data, files={"file": file}, timeout=self.timeout
                )
            finally:
                if close:
                    file.close()
        return self._handle(resp)

    def account(self) -> Any:
        """Key info and balance: ``GET /v1/me``."""
        return self._handle(self._session.get(f"{self.base_url}/v1/me", timeout=self.timeout))

    @staticmethod
    def create_key(email: str, base_url: str = BASE_URL) -> Any:
        """Create a key with free credit: ``POST /v1/keys``. No auth needed."""
        resp = requests.post(f"{base_url}/v1/keys", json={"email": email}, timeout=30)
        if not resp.ok:
            raise FinekotError(resp.status_code, _body(resp))
        return _body(resp)

    def _handle(self, resp: requests.Response) -> Any:
        self.cost = _float(resp.headers.get("X-Cost"))
        self.balance = _float(resp.headers.get("X-Balance"))
        body = _body(resp)
        if not resp.ok:
            raise FinekotError(resp.status_code, body)
        return body


def _body(resp: requests.Response) -> Any:
    ctype = resp.headers.get("Content-Type", "")
    if "json" in ctype:
        try:
            return resp.json()
        except ValueError:
            return resp.text
    if ctype.startswith("text/"):
        return resp.text
    return resp.content


def _float(value: Optional[str]) -> Optional[float]:
    try:
        return float(value) if value not in (None, "") else None
    except ValueError:
        return None


def _form_value(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)
