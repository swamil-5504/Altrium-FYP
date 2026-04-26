"""Security response headers.

Applied as middleware in main.py. Tuned for an API that is consumed from a
separate SPA origin — no inline HTML served, so CSP is kept tight.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.config import settings


_BASE_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
    # This service returns JSON / PDF only; no inline HTML execution needed.
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        self._is_production = settings.ENVIRONMENT.lower() == "production"

    async def dispatch(self, request, call_next):
        response = await call_next(request)
        for key, value in _BASE_HEADERS.items():
            response.headers.setdefault(key, value)
        if self._is_production:
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=63072000; includeSubDomains; preload",
            )
        return response
