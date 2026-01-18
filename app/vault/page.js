// app/vault/page.js
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// ---------- helpers ----------
async function getJson(url, token) {
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      accept: "application/json",
      ...(token ? { "X-Vault-Token": token } : {}),
    },
  });

  const txt = await res.text().catch(() => "");
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    data = { raw: txt };
  }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

async function sendJson(url, method, body, token) {
  const res = await fetch(url, {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      ...(token ? { "X-Vault-Token": token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const txt = await res.text().catch(() => "");
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    data = { raw: txt };
  }
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
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", letterSpacing: 3, fontSize: 13, gap: 10 }}>
          <span>VAULT SAFE</span>
          <span style={{ opacity: 0.85, whiteSpace: "nowrap" }}>{locked ? "LOCKED" : "OPEN"}</span>
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
              fontSize: 12,
              letterSpacing: 1.1,
              opacity: 0.95,
              overflow: "hidden",
            }}
          >
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}

function PinPad({ onSubmit, disabled, title = "ENTER PIN" }) {
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
    if (!pin) return;
    await onSubmit(pin);
    setPin("");
  }

  // keyboard support
  useEffect(() => {
    function onKey(e) {
      if (disabled) return;
      if (e.key >= "0" && e.key <= "9") press(e.key);
      if (e.key === "Backspace") del();
      if (e.key === "Escape") clear();
      if (e.key === "Enter") submit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, pin]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="pip-muted" style={{ letterSpacing: "0.14em" }}>
        {title}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: 12,
          border: "1px solid rgba(120,255,170,0.18)",
          background: "rgba(0,0,0,0.35)",
          padding: "10px 12px",
          gap: 10,
        }}
      >
        <div style={{ letterSpacing: 4, fontSize: 16, minHeight: 18, whiteSpace: "nowrap" }}>
          {"•".repeat(pin.length)}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button className="pip-link" type="button" onClick={del} disabled={disabled}>
            ⌫
          </button>
          <button className="pip-link" type="button" onClick={clear} disabled={disabled}>
            CLEAR
          </button>
        </div>
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
        <button type="button" className="pip-link" onClick={() => press(0)} disabled={disabled} style={{ padding: "14px 0" }}>
          0
        </button>
        <button type="button" className="pip-link" onClick={submit} disabled={disabled} style={{ padding: "14px 0" }}>
          ENTER
        </button>
        <button type="button" className="pip-link" onClick={clear} disabled={disabled} style={{ padding: "14px 0" }}>
          RESET
        </button>
      </div>

      <div className="pip-muted" style={{ fontSize: 12 }}>
        Tip: you can type the PIN on your keyboard and press Enter.
      </div>
    </div>
  );
}

export default function VaultPage() {
  const [status, setStatus] = useState("Checking vault...");
  const [busy, setBusy] = useState(false);

  const [vaultEnabled, setVaultEnabled] = useState(false);
  const [locked, setLocked] = useState(true);
  const [pinSet, setPinSet] = useState(false);
  const [expires, setExpires] = useState(null);

  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const [showPinSet, setShowPinSet] = useState(false);

  // Memory-only token (NOT localStorage)
  const [vaultToken, setVaultToken] = useState("");

  // key form
  const [exchange, setExchange] = useState("BINANCE");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");

  // list
  const [keysList, setKeysList] = useState([]);

  const subtitle = useMemo(() => {
    const e = expires ? ` · expires ${new Date(expires * 1000).toLocaleTimeString()}` : "";
    return `Vault · Mode: PAPER (live locked) · ${locked ? "LOCKED" : "OPEN"}${e}`;
  }, [locked, expires]);

  async function refreshStatus() {
    setBusy(true);
    try {
      const st = await getJson("/api/proxy/vault/status", "");
      setVaultEnabled(!!st?.enabled);
      setPinSet(!!st?.pin_set);
      const isUnlocked = !!st?.unlocked;
      setLocked(!isUnlocked);
      setExpires(st?.expires ?? null);

      if (!st?.enabled) {
        setStatus(
          "Vault disabled on backend. Set VAULT_MASTER_KEY on Render (32-byte base64) then redeploy Render."
        );
      } else if (!st?.pin_set) {
        setStatus("No PIN set yet. Use SET PIN first.");
      } else if (isUnlocked) {
        setStatus("Vault is OPEN.");
      } else {
        setStatus("Vault is LOCKED. Use PIN to unlock.");
      }
    } catch (e) {
      setStatus(`Vault status error: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function refreshKeys(token) {
    const t = token || vaultToken;
    if (!t) return;

    // backend uses GET /vault/keys (masked list)
    const out = await getJson("/api/proxy/vault/keys", t);
    setKeysList(out?.keys || []);
  }

  async function setPin(pin) {
    setBusy(true);
    try {
      // backend: POST /vault/pin/set
      await sendJson("/api/proxy/vault/pin/set", "POST", { pin }, "");
      setStatus("PIN set. Now unlock with PIN.");
      setShowPinSet(false);
      await refreshStatus();
    } catch (e) {
      setStatus(`Set PIN failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function unlockWithPin(pin) {
    setBusy(true);
    try {
      // backend: POST /vault/unlock   (NOT /vault/pin/unlock)
      const out = await sendJson("/api/proxy/vault/unlock", "POST", { pin }, "");
      if (!out?.ok) throw new Error(out?.error || "Unlock failed");
      setVaultToken("local-unlocked"); // token not used by this backend; kept for future
      setLocked(false);
      setStatus("Vault unlocked.");
      setShowPinUnlock(false);
      await refreshStatus();
      await refreshKeys("local-unlocked");
    } catch (e) {
      setStatus(`PIN unlock failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function lockNow() {
    setBusy(true);
    try {
      await sendJson("/api/proxy/vault/lock", "POST", {}, "");
      setVaultToken("");
      setLocked(true);
      setStatus("Vault locked.");
      await refreshStatus();
      setKeysList([]);
    } catch (e) {
      setStatus(`Lock failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function saveKeys() {
    setBusy(true);
    try {
      if (locked) throw new Error("Vault locked. Unlock first.");
      if (!apiKey.trim() || !apiSecret.trim()) throw new Error("API Key + Secret required.");

      // backend: POST /vault/keys/add
      const out = await sendJson(
        "/api/proxy/vault/keys/add",
        "POST",
        {
          exchange,
          api_key: apiKey.trim(),
          api_secret: apiSecret.trim(),
          passphrase: passphrase.trim(),
        },
        ""
      );

      setStatus(out?.ok ? "Saved (encrypted)." : "Saved.");
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      await refreshKeys("local-unlocked");
    } catch (e) {
      setStatus(`Save failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function deleteKey(id) {
    setBusy(true);
    try {
      if (locked) throw new Error("Vault locked.");

      // backend: DELETE /vault/keys/delete/<id>
      await sendJson(`/api/proxy/vault/keys/delete/${id}`, "DELETE", null, "");
      setStatus("Deleted.");
      await refreshKeys("local-unlocked");
    } catch (e) {
      setStatus(`Delete failed: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  // initial load
  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doorLabel = !vaultEnabled ? "DISABLED" : locked ? "LOCKED" : "OPEN";

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
            <div className="pip-badge">{doorLabel === "OPEN" ? "SAFE OPEN" : doorLabel}</div>
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

            <SafeDoor
              locked={doorLabel !== "OPEN"}
              statusText={`${status}  |  endpoint: /api/proxy/vault/status`}
            />

            <div className="pip-links" style={{ marginTop: 10 }}>
              <button
                className="pip-link"
                type="button"
                onClick={() => setStatus("Biometrics will be enabled in Brain v2 (Passkeys). For now use PIN.")}
                disabled={busy}
              >
                UNLOCK (BIOMETRICS)
              </button>

              <button
                className="pip-link"
                type="button"
                onClick={() => setShowPinUnlock((s) => !s)}
                disabled={busy || !vaultEnabled || !pinSet}
              >
                {showPinUnlock ? "HIDE PIN" : "USE PIN"}
              </button>

              <button
                className="pip-link"
                type="button"
                onClick={() => setShowPinSet((s) => !s)}
                disabled={busy || !vaultEnabled}
              >
                {showPinSet ? "CANCEL SET PIN" : pinSet ? "CHANGE PIN" : "SET PIN"}
              </button>

              <button className="pip-link" type="button" onClick={lockNow} disabled={busy || !vaultEnabled}>
                LOCK
              </button>

              <button className="pip-link" type="button" onClick={refreshStatus} disabled={busy}>
                REFRESH
              </button>
            </div>

            {showPinSet && (
              <div style={{ marginTop: 14 }}>
                <PinPad onSubmit={setPin} disabled={busy} title={pinSet ? "SET NEW PIN" : "SET FIRST PIN"} />
                <div className="pip-muted pip-footnote">
                  After setting PIN, press REFRESH, then USE PIN to unlock.
                </div>
              </div>
            )}

            {showPinUnlock && (
              <div style={{ marginTop: 14 }}>
                <PinPad onSubmit={unlockWithPin} disabled={busy} title="ENTER PIN TO UNLOCK" />
              </div>
            )}

            <div className="pip-muted pip-footnote" style={{ marginTop: 12 }}>
              Keys are stored encrypted on the server. Do NOT enable withdrawal permissions.
              Withdrawals remain only inside the exchange app.
            </div>
          </div>

          <div className="pip-panel" style={{ marginTop: 14 }}>
            <div className="pip-heading">KEY VAULT</div>

            {!vaultEnabled ? (
              <div className="pip-muted">
                Vault is disabled on backend.
                <br />
                ✅ Fix: set <b>VAULT_MASTER_KEY</b> on <b>Render</b> (not Vercel), then redeploy Render.
                <br />
                Your Render <code>/vault/status</code> must show <code>"enabled": true</code>.
              </div>
            ) : locked ? (
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
                      maxWidth: "100%",
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
                      width: "100%",
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
                      width: "100%",
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
                      width: "100%",
                    }}
                  />

                  <button className="pip-link" type="button" onClick={saveKeys} disabled={busy}>
                    SAVE (ENCRYPT)
                  </button>

                  <button className="pip-link" type="button" onClick={() => refreshKeys("local-unlocked")} disabled={busy}>
                    REFRESH KEYS
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
                          overflow: "hidden",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ fontWeight: 800, letterSpacing: 2 }} className="wrap-anywhere">
                            {k.exchange} • {k.api_key_masked || "****"}
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
