import requests
from fastapi import APIRouter, Query

router = APIRouter()

COINBASE_URL = "https://api.exchange.coinbase.com"

@router.get("/ohlc")
def get_ohlc(
    market: str = Query("BTC-USD"),
    tf: str = Query("60")  # seconds
):
    """
    Coinbase candle sizes:
    60, 300, 900, 3600, 21600, 86400
    """

    granularity = int(tf)

    url = f"{COINBASE_URL}/products/{market}/candles"
    params = {"granularity": granularity}

    try:
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()

        candles = [
            {
                "time": c[0],
                "low": c[1],
                "high": c[2],
                "open": c[3],
                "close": c[4],
                "volume": c[5],
            }
            for c in data
        ]

        return {
            "ok": True,
            "source": "coinbase",
            "market": market,
            "tf": granularity,
            "candles": candles
        }

    except Exception as e:
        return {
            "ok": False,
            "error": "coinbase_failed",
            "detail": str(e)
        }
