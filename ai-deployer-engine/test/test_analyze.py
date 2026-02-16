from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_analyze_requires_key():
    r = client.post("/v1/analyze", json={})
    assert r.status_code == 401

def test_analyze_ok_fallback():
    candles = []
    t0 = 1700000000000
    price = 100.0
    for i in range(60):
        candles.append({"time": t0 + i*60000, "open": price, "high": price+1, "low": price-1, "close": price+0.2})
        price += 0.1

    r = client.post(
        "/v1/analyze",
        headers={"X-API-Key": "change-me"},
        json={"symbol": "DOTUSDT", "interval": "1m", "candles": candles, "context": {"side": "LONG"}},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["symbol"] == "DOTUSDT"
    assert "supports" in data and "resistances" in data and "signals" in data
