// app/vault/page.js
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

async function readJson(res) {
  const txt = await res.text().catch(() => "");
  try {
    return txt ? JSON.parse(txt) : {};
  } catch {
    return { _raw: txt };
  }
}

async function getJson(url) {
  const res = await fetch(url, { method: "GET", cache: "no-store", headers: { accept: "application/json" } });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

async function delJson(url) {
  const res = await fetch(url, { method: "DELETE", cache: "no-store", headers: { accept: "application/json" } });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

function SafeDoor({ locked, statusText }) {
  return (
    <div style={{ display: "grid", placeItems: "center", padding: 10 }}>
      <div
        style={{
          width: "min(560px, 94vw)",
          borderRadius: 18,
          border: "1px solid rgba(120,255,170,0.22)",
          background:
            "radial-gradient(circle at 50% 35%, rgba(120,255,170,0.10), rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.65))",
          boxShadow: "0 0 28px rgba(0,0,0,.6), inset 0 0 40px rgba(0,0,0,.45)",
          padding: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", letterSpacing: 3, fontSize: 13 }}>
          <span>VAULT SAFE</span>
          <span style={{ opacity: 0.85 }}>{locked ? "LOCKED" : "OPEN"}</span>
        </div>

        <div
          style={{
            marginTop: 10,
            height: 230,
            borderRadius: 16,
            border: "1px solid rgba(120,255,170,0.18)",
            background: "rgba(0,0,0,0.35)",
            display: "grid",
            placeItems: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: "50%",
              border: "1px solid rgba(120,255,170,0.30)",
              background: "rgba(0,0,0,0.35)",
              boxShadow: "0 0 18px rgba(120,255,170,0.18)",
              transform: locked ? "rotate(0deg)" : "rotate(28deg)",
              transition: "transform 600ms ease",
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                border: "1px solid rgba(120,255,170,0.24)",
                background: "rgba(0,0,0,0.35)",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                letterSpacing: 2,
                fontSize: 18,
              }}
            >
              {locked ? "🔒" : "✅"}
            </div>
          </div>

          <div
            className="wrap-anywhere"
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 12,
              borderRadius: 12,
              border: "1px solid rgba(120,255,170,0.18)",
              background: "rgba(0,0,0,0.35)",
              padding: "10px 12px",
              fontSize: 13,
              letterSpacing: 1.3,
              opacity: 0.95,
            }}
          >
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}

function PinPad({ onSubmit, disabled, actionLabel = "UNLOCK" }) {
  const [pin, setPin] = useState("");

  function press(n) {
    if (disabled) return;
    if (pin.length >= 12) return;
    setPin((p) => p + String(n));
  }
  function del() {
    if (disabled) return;
    setPin((p) => p.slice(0, -1));
  }
  function clear() {
    if (disabled) return;
    setPin("");
  }
  async function submit() {
    if (disabled) return;
    await onSubmit(pin);
    setPin("");
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: 12,
          border: "1px solid rgba(120,255,170,0.18)",
          background: "rgba(0,0,0,0.35)",
          padding: "10px 12px",
          letterSpacing: 6,
        }}
      >
        <span>{"•".repeat(pin.length)}</span>
        <button className="pip-link" type="button" onClick={del} disabled={disabled}>
          ⌫
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            type="button"
            className="pip-link"
            onClick={() => press(n)}
            disabled={disabled}
            style={{ padding: "14px 0" }}
          >
            {n}
          </button>
        ))}
        <button type="button" className="pip-link" onClick={clear} disabled={disabled} style={{ padding: "14px 0" }}>
          C
        </button>
        <button type="button" className="pip-link" onClick={() => press(0)} disabled={disabled} style={{ padding: "14px 0" }}>
          0
        </button>
        <button type="button" className="pip-link" onClick={submit} disabled={disabled} style={{ padding: "14px 0" }}>
          ↵
        </button>
      </div>

      <button className="pip-link" type="button" onClick={submit} disabled={disabled}>
        {actionLabel}
      </button>
    </div>
  );
}

export default function VaultPage() {
  const [status, setStatus] = useState("Vault ready.");
  const [busy, setBusy] = useState(false);

  const [vaultEnabled, setVaultEnabled] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [ttlSec, setTtlSec] = useState(300);

  const [showPin, setShowPin] = useState(true);

  // key form
  const [exchange, setExchange] = useState("BINANCE");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [keysList, setKeysList] = useState([]);

  const subtitle = useMemo(() => {
    return `Vault · Mode: PAPER (live locked) · ${unlocked ? "OPEN" : "LOCKED"}`;
  }, [unlocked]);

  async function refreshStatus() {
    const s = await getJson("/api/proxy/vault/status");
    setVaultEnabled(!!s?.enabled);
    setPinSet(!!s?.pin_set);
    setUnlocked(!!s?.unlocked);
    setTtlSec(Number(s?.ttl_sec || 300));
    return s;
  }

  async function refreshKeys() {
    const out = await getJson("/api/proxy/vault/keys");
    setKeysList(out?.keys || []);
  }

  useEffect(() => {
    (async () => {
      try {
        setStatus("Checking vault...");
        const s = await refreshStatus();
        if (s?.enabled && s?.unlocked) await refreshKeys();
        setStatus(
          s?.enabled
            ? (s?.unlocked ? "Vault is open." : (s?.pin_set ? "Vault locked. Enter PIN." : "No PIN set. Create one."))
            : "Vault disabled: VAULT_MASTER_KEY not set on backend."
        );
      } catch (e) {
        setStatus(`Vault error: ${String(e?.message || e)}`);
      }
    })();
  }, []);

  async function setPin(pin) {
    setBusy(true);
    try {
      const out = await postJson("/api/proxy/vault/pin/set", { pin });
      setStatus(`PIN set. Vault unlocked for ${out?.ttl_sec || ttlSec}s.`);
      await refreshStatus();
      await refreshKeys();
    } catch (e) {
      setStatus(`Set PIN failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function unlockWithPin(pin) {
    setBusy(true);
    try {
      const out = await postJson("/api/proxy/vault/unlock", { pin });
      setStatus(`Unlocked for ${out?.ttl_sec || ttlSec}s.`);
      await refreshStatus();
      await refreshKeys();
    } catch (e) {
      setStatus(`Unlock failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function lockNow() {
    setBusy(true);
    try {
      await postJson("/api/proxy/vault/lock", {});
      await refreshStatus();
      setKeysList([]);
      setStatus("Vault locked.");
    } catch (e) {
      setStatus(`Lock failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function saveKeys() {
    setBusy(true);
    try {
      if (!unlocked) throw new Error("Vault locked.");
      if (!apiKey.trim() || !apiSecret.trim()) throw new Error("API key + secret required.");

      await postJson("/api/proxy/vault/keys/add", {
        exchange,
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        passphrase: passphrase.trim(),
      });

      setStatus("Saved (encrypted).");
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      await refreshKeys();
    } catch (e) {
      setStatus(`Save failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteKey(id) {
    setBusy(true);
    try {
      if (!unlocked) throw new Error("Vault locked.");
      await delJson(`/api/proxy/vault/keys/delete/${id}`);
      setStatus("Deleted.");
      await refreshKeys();
    } catch (e) {
      setStatus(`Delete failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pip-crt">
      <div className="pip-shell">
        <div className="pip-topbar">
          <div className="pip-topbar-left">
            <div className="pip-title">PIP-TRADE 3000</div>
            <div className="pip-sub wrap-anywhere" title={subtitle}>
              {subtitle}
            </div>
          </div>
          <div className="pip-topbar-right">
            <div className="pip-badge">{unlocked ? "SAFE OPEN" : "SAFE LOCKED"}</div>
          </div>
        </div>

        <div className="pip-links">
          <Link className="pip-link" href="/">HOME</Link>
          <Link className="pip-link" href="/candles">CANDLES</Link>
          <Link className="pip-link" href="/crypto">CRYPTO</Link>
          <Link className="pip-link active" href="/vault">VAULT</Link>
        </div>

        <div className="pip-content">
          <div className="pip-panel">
            <div className="pip-heading">VAULT SAFE</div>

            <SafeDoor locked={!unlocked} statusText={status} />

            <div className="pip-muted wrap-anywhere" style={{ marginTop: 10 }}>
              enabled: {String(vaultEnabled)} • pin_set: {String(pinSet)} • ttl: {String(ttlSec)}s
            </div>

            <div className="pip-links" style={{ marginTop: 10 }}>
              <button
                className="pip-link"
                type="button"
                onClick={() => setShowPin((s) => !s)}
                disabled={busy || !vaultEnabled}
              >
                {showPin ? "HIDE PIN PAD" : "SHOW PIN PAD"}
              </button>

              <button className="pip-link" type="button" onClick={lockNow} disabled={busy || !vaultEnabled}>
                LOCK
              </button>

              <button
                className="pip-link"
                type="button"
                onClick={async () => {
                  try {
                    setBusy(true);
                    await refreshStatus();
                    if (vaultEnabled && unlocked) await refreshKeys();
                    setStatus("Status refreshed.");
                  } catch (e) {
                    setStatus(`Refresh failed: ${String(e?.message || e)}`);
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
              >
                REFRESH
              </button>
            </div>

            {!vaultEnabled && (
              <div className="pip-muted pip-footnote wrap-anywhere" style={{ marginTop: 12 }}>
                Vault is disabled because the backend (Render) does not have <b>VAULT_MASTER_KEY</b> set (or it’s invalid).
                Set it on Render, redeploy, then refresh this page.
              </div>
            )}

            {vaultEnabled && showPin && (
              <div style={{ marginTop: 14 }}>
                <div className="pip-muted" style={{ marginBottom: 8 }}>
                  {pinSet ? "ENTER PIN TO UNLOCK" : "SET A NEW PIN (4–12 digits)"}
                </div>

                <PinPad onSubmit={pinSet ? unlockWithPin : setPin} disabled={busy} actionLabel={pinSet ? "UNLOCK" : "SET PIN"} />

                <div className="pip-muted pip-footnote" style={{ marginTop: 12 }}>
                  Keys are stored encrypted on the server. Do NOT enable withdrawal permissions.
                  Withdrawals remain only inside the exchange app.
                </div>
              </div>
            )}
          </div>

          <div className="pip-panel" style={{ marginTop: 14 }}>
            <div className="pip-heading">KEY VAULT</div>

            {!unlocked ? (
              <div className="pip-muted">Unlock the safe to add/manage keys.</div>
            ) : (
              <>
                <div className="pip-row" style={{ borderBottom: "none" }}>
                  <div className="pip-k">EXCHANGE</div>
                  <select
                    value={exchange}
                    onChange={(e) => setExchange(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(120,255,170,0.25)",
                      background: "rgba(0,0,0,0.35)",
                      color: "rgba(180,255,210,0.95)",
                      outline: "none",
                    }}
                  >
                    <option value="BINANCE">BINANCE</option>
                    <option value="BYBIT">BYBIT</option>
                    <option value="KRAKEN">KRAKEN</option>
                  </select>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  <input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="API KEY"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(120,255,170,0.25)",
                      background: "rgba(0,0,0,0.35)",
                      color: "rgba(180,255,210,0.95)",
                      outline: "none",
                    }}
                  />
                  <input
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="API SECRET"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(120,255,170,0.25)",
                      background: "rgba(0,0,0,0.35)",
                      color: "rgba(180,255,210,0.95)",
                      outline: "none",
                    }}
                  />
                  <input
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="PASSPHRASE (optional)"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(120,255,170,0.25)",
                      background: "rgba(0,0,0,0.35)",
                      color: "rgba(180,255,210,0.95)",
                      outline: "none",
                    }}
                  />

                  <button className="pip-link" type="button" onClick={saveKeys} disabled={busy}>
                    SAVE (ENCRYPT)
                  </button>
                </div>

                <div className="pip-heading" style={{ marginTop: 18 }}>
                  STORED KEYS (MASKED)
                </div>

                {keysList.length === 0 ? (
                  <div className="pip-muted">No keys stored yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {keysList.map((k) => (
                      <div
                        key={k.id}
                        style={{
                          borderRadius: 12,
                          border: "1px solid rgba(120,255,170,0.18)",
                          background: "rgba(0,0,0,0.25)",
                          padding: 10,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div className="wrap-anywhere" style={{ fontWeight: 800, letterSpacing: 2 }}>
                            {(k.exchange || "").toUpperCase()} • {k.api_key_masked || "****"}
                          </div>
                          <div className="pip-muted wrap-anywhere" style={{ fontSize: 12 }}>
                            {k.created || ""}
                          </div>
                        </div>

                        <div className="pip-links" style={{ marginTop: 8 }}>
                          <button className="pip-link" type="button" onClick={() => deleteKey(k.id)} disabled={busy}>
                            DELETE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
