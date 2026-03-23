# session_manager.py
import os, json, time, uuid, threading
from functools import lru_cache
from typing import Optional, Dict, Any
from sqlalchemy import create_engine, text
import redis

_DEFAULT_TTL = int(os.getenv("SESSION_TTL_SECONDS", "3600"))
_REDIS_URL   = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")

class SessionManager:
    _use_redis = True
    _r = redis.from_url(_REDIS_URL) if _use_redis else None

    # per-process engine cache to avoid reconnect churn
    _engine_cache: Dict[str, Any] = {}
    _engine_lock = threading.Lock()

    @staticmethod
    def _key(session_id: str) -> str:
        return f"sess:{session_id}"

    @classmethod
    def create_session(
        cls,
        *,
        # ✅ Make conn_str optional and accept legacy kwargs (e.g., engine=...)
        user_id: str,
        schema_catalog: dict,
        conn_str: str | None = None,
        extra: dict | None = None,
        **legacy_kwargs,
    ) -> str:
        """Store only serializable data; NOT engine objects.
        Backward-compatible:
          - Prefer conn_str
          - If only engine (legacy) is provided, derive DSN from engine.url
          - Ignore unknown legacy kwargs
        """
        # 🔁 Legacy support: if conn_str not provided, try to extract from engine=
        if conn_str is None:
            eng = legacy_kwargs.get("engine")
            if eng is not None:
                try:
                    # SQLAlchemy engine.url is a URL object; str(...) yields DSN
                    conn_str = str(getattr(eng, "url", "")) or None
                except Exception:
                    conn_str = None

        if not conn_str:
            raise TypeError("create_session requires conn_str (or legacy engine)")

        sid = str(uuid.uuid4())
        payload = {
            "session_id": sid,
            "user_id": user_id,
            "conn_str": conn_str,
            "schema_catalog": schema_catalog,
            "created_at": int(time.time()),
            "extra": extra or {},
        }
        if cls._use_redis:
            cls._r.setex(cls._key(sid), _DEFAULT_TTL, json.dumps(payload))
        else:
            # If you keep a memory fallback for dev, implement it here
            raise RuntimeError("Enable Redis for sessions in production")
        return sid

    @classmethod
    def get_session(cls, session_id: str) -> Optional[dict]:
        if cls._use_redis:
            raw = cls._r.get(cls._key(session_id))
            if not raw:
                return None
            # simple sliding TTL refresh (optional)
            cls._r.expire(cls._key(session_id), _DEFAULT_TTL)
            return json.loads(raw)
        return None

    @classmethod
    def get_engine(cls, session_id: str):
        s = cls.get_session(session_id)
        if not s:
            return None
        dsn = s["conn_str"]
        with cls._engine_lock:
            eng = cls._engine_cache.get(dsn)
            if eng is None:
                eng = create_engine(
                    dsn,
                    pool_pre_ping=True,
                    pool_recycle=1800,
                    connect_args={"connect_timeout": 8},
                    future=True,
                )
                cls._engine_cache[dsn] = eng
        return eng

    @classmethod
    def get_conversation_history(cls, session_id: str) -> list[dict]:
        # If you also store history in Redis, read/update it here.
        # For now return empty; your existing code probably keeps it elsewhere.
        return []
