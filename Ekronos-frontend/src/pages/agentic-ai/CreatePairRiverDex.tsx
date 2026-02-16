import React, { useMemo, useState } from "react";

const LS_KEY = "vara_vft_last_deploy";

type StoredVFT = {
  saved_at: string;
  trace_id?: string;
  program_id?: string;
  token?: {
    name?: string;
    symbol?: string;
    decimals?: number;
  };
  gateway?: {
    programCreated?: {
      address?: string;
    };
  };
};

function loadLastDeployedVFT(): StoredVFT | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredVFT;
  } catch {
    return null;
  }
}

// --- gateway response ---
type CreatePoolResponse = {
  success: boolean;
  message?: string;
  data?: {
    pairAddress?: string;
    token?: string;
    registeredToken?: string | null;
  };
};

// --- helpers ---
function shortHex(addr?: string, left = 8, right = 8) {
  if (!addr) return "—";
  if (addr.length <= left + right + 2) return addr;
  return `${addr.slice(0, left + 2)}…${addr.slice(-right)}`;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function InlineGreenLoader({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      style={{
        marginTop: 14,
        borderRadius: 16,
        border: "1px solid rgba(34,197,94,0.35)",
        background: "linear-gradient(180deg, rgba(16,185,129,0.10), rgba(6,95,70,0.06))",
        padding: 14,
      }}
      aria-live="polite"
      aria-label="Creating your pool on RivrDEX"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "3px solid rgba(34,197,94,0.22)",
            borderTopColor: "rgba(34,197,94,0.98)",
            boxShadow: "0 0 0 6px rgba(34,197,94,0.06)",
            animation: "spin 1s linear infinite",
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, letterSpacing: 0.4, opacity: 0.95, color: "rgba(167, 243, 208, 0.95)" }}>
            Creating your pool on RivrDEX
          </div>
          <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>
            Please keep this page open while we finalize the pair.
          </div>

          <div
            style={{
              marginTop: 10,
              height: 10,
              borderRadius: 999,
              background: "rgba(34,197,94,0.10)",
              overflow: "hidden",
              position: "relative",
            }}
            aria-hidden="true"
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: "translateX(-60%)",
                background:
                  "linear-gradient(90deg, transparent, rgba(34,197,94,0.35), rgba(34,197,94,0.18), transparent)",
                animation: "shimmer 1.2s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { transform: translateX(-70%); }
          100% { transform: translateX(70%); }
        }
      `}</style>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  onCopy,
  copyLabel = "Copy",
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
  copyLabel?: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr auto",
        gap: 10,
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 13, wordBreak: "break-all" }} className={mono ? "mono" : undefined}>
        {value}
      </div>
      {onCopy ? (
        <button className="btn" onClick={onCopy} style={{ padding: "6px 10px" }}>
          {copyLabel}
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        marginTop: 14,
        borderRadius: 14,
        border: "1px solid rgba(239,68,68,0.35)",
        background: "rgba(239,68,68,0.10)",
        padding: 12,
      }}
      className="mono"
    >
      {message}
    </div>
  );
}

function SuccessCard({
  tokenProgramId,
  pairAddress,
  registeredToken,
}: {
  tokenProgramId: string;
  pairAddress: string;
  registeredToken: string | null | undefined;
}) {
  const [copied, setCopied] = useState<string>("");

  async function doCopy(key: string, value: string) {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1200);
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          borderRadius: 18,
          border: "1px solid rgba(34,197,94,0.35)",
          background: "linear-gradient(180deg, rgba(34,197,94,0.10), rgba(11,15,23,0.92))",
          padding: 16,
          boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              aria-hidden="true"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "rgba(34,197,94,0.16)",
                border: "1px solid rgba(34,197,94,0.30)",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                color: "rgba(167, 243, 208, 0.95)",
              }}
            >
              ✓
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Pool created</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Your RivrDEX pair is ready</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              padding: 14,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Pair details</div>

            <InfoRow
              label="Pair Address"
              value={pairAddress}
              mono
              onCopy={() => doCopy("pair", pairAddress)}
              copyLabel={copied === "pair" ? "Copied" : "Copy"}
            />

            <InfoRow
              label="Token Program ID"
              value={tokenProgramId}
              mono
              onCopy={() => doCopy("token", tokenProgramId)}
              copyLabel={copied === "token" ? "Copied" : "Copy"}
            />

            <InfoRow
              label="Registered Token"
              value={registeredToken ?? "null"}
              mono={!!registeredToken}
              onCopy={registeredToken ? () => doCopy("registered", registeredToken) : undefined}
              copyLabel={copied === "registered" ? "Copied" : "Copy"}
            />
          </div>

          <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
            Next: you can seed liquidity in this pair from your dashboard.
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CreatePairRiverDex
 * - Reads deployed token program_id from localStorage (LS_KEY)
 * - POSTs to gateway /api/create-pool-with-registered-token
 * - Shows a professional success UI with pairAddress + token
 */
export default function CreatePairRiverDex() {
  const deployed = useMemo(() => loadLastDeployedVFT(), []);
  const tokenProgramId =
    deployed?.program_id || deployed?.gateway?.programCreated?.address || undefined;

  const tokenLabel = deployed?.token?.symbol
    ? `${deployed.token.symbol}${deployed.token.name ? ` • ${deployed.token.name}` : ""}`
    : deployed?.token?.name || "Your token";

  const GATEWAY_BASE =
    (import.meta as any).env?.VITE_GATEWAY_API_BASE ||
    "https://gatewar-hackaton-5.onrender.com";

  const endpoint = `${GATEWAY_BASE}/api/create-pool-with-registered-token`;

  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [resp, setResp] = useState<CreatePoolResponse | null>(null);

  const canCreate = !!tokenProgramId && confirmed && status !== "sending";

  async function createPool() {
    if (!tokenProgramId) {
      setStatus("error");
      setErrorMsg("No deployed token found in localStorage. Deploy a token first.");
      return;
    }
    if (!confirmed) return;

    setStatus("sending");
    setErrorMsg("");
    setResp(null);

    try {
      const body = {
        token: tokenProgramId,
        registered_token: null as null,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = (await res.json().catch(() => ({}))) as CreatePoolResponse;

      if (!res.ok) {
        const detail = (data as any)?.detail || (data as any)?.error || res.statusText || "Failed to create pool";
        throw new Error(typeof detail === "string" ? detail : "Failed to create pool");
      }

      if (!data?.success) {
        throw new Error(data?.message || "Gateway returned success=false");
      }

      setResp(data);
      setStatus("done");
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message ?? String(e));
    }
  }

  return (
    <section className="card">
      <h2 className="card-title">Create Pair (RivrDEX)</h2>
      <p className="card-desc">Initialize a liquidity pool for your deployed token.</p>

      {/* Token source */}
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            padding: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Token</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{tokenLabel}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Source</div>
              <div className="mono" style={{ fontSize: 12, opacity: 0.9 }}>
                localStorage • {LS_KEY}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <InfoRow label="Token Program ID" value={tokenProgramId ? tokenProgramId : "—"} mono />
            <InfoRow label="Gateway endpoint" value={endpoint} mono />
          </div>

          {!tokenProgramId ? (
            <div className="cnpWarn" style={{ marginTop: 10 }}>
              No deployed token found. Please deploy a token first (Step: Deploy Token).
            </div>
          ) : null}
        </div>
      </div>

      {/* Inline loader */}
      <InlineGreenLoader visible={status === "sending"} />

      {/* Confirm + create */}
      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center", opacity: tokenProgramId ? 1 : 0.6 }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={!tokenProgramId || status === "sending"}
          />
          <span className="mono">I confirm that I want to create a RivrDEX pool for this token.</span>
        </label>

        <button className="btn" onClick={createPool} disabled={!canCreate}>
          {status === "sending" ? "Creating pool…" : "Create pool"}
        </button>
      </div>

      {/* Error */}
      {status === "error" && errorMsg ? <ErrorBanner message={`❌ ${errorMsg}`} /> : null}

      {/* Success */}
      {status === "done" && resp?.data?.pairAddress && tokenProgramId ? (
        <SuccessCard
          tokenProgramId={tokenProgramId}
          pairAddress={resp.data.pairAddress}
          registeredToken={resp.data.registeredToken ?? null}
        />
      ) : null}
    </section>
  );
}
