import { HexString } from "@gear-js/api";
import { useAccount } from "@gear-js/react-hooks";
import { Wallet } from "@gear-js/wallet-connect";
import { useMemo, useState } from "react";

type ProjectForm = {
    description: string;
    projectType: string;
    launchStyle: string;
    supplyModel: string;
    liquidityBudget: string;
    governanceEnabled: boolean;
};

export type GenerationPayload = {
    createdAt: number;
    form: ProjectForm;
};

// ---------- prompt builder ----------
function buildGoalFromPayload(payload: GenerationPayload, wallet?: HexString) {
    const f = payload.form;
    return [
        `Project goal (user prompt):`,
        f.description.trim(),
        ``,
        `Token / Launch configuration:`,
        `- Project type: ${f.projectType}`,
        `- Launch style: ${f.launchStyle}`,
        `- Supply model: ${f.supplyModel}`,
        `- Liquidity budget (USD): ${f.liquidityBudget}`,
        `- Governance module: ${f.governanceEnabled ? "Enabled" : "Disabled"}`,
        `- Mint wallet: ${wallet ? wallet : "NOT_CONNECTED"}`,
        ``,
        `Deliverables:`,
        `1) Smart program(s) for Vara (Rust),`,
        `2) Frontend UI (React),`,
        `3) Server/API (FastAPI),`,
        `4) Risk analysis (trends + chart-ready JSON),`,
        `5) Tokenomics (distribution + chart-ready JSON).`,
    ].join("\n");
}

// ---------- helpers ----------
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

function formatUnitsDecimalString(raw: string, decimals: number) {
    if (!raw || !/^\d+$/.test(raw)) return raw || "0";
    if (decimals <= 0) return raw;

    raw = raw.replace(/^0+(?=\d)/, "");
    if (raw.length <= decimals) {
        const padded = raw.padStart(decimals + 1, "0");
        const intPart = padded.slice(0, padded.length - decimals);
        const fracPart = padded.slice(padded.length - decimals).replace(/0+$/, "");
        return fracPart ? `${intPart}.${fracPart}` : intPart;
    }

    const intPart = raw.slice(0, raw.length - decimals);
    const fracPart = raw.slice(raw.length - decimals).replace(/0+$/, "");
    return fracPart ? `${intPart}.${fracPart}` : intPart;
}

// ---------- response typing (loose, based on your example) ----------
type GatewayProgramCreated = {
    id?: number;
    address?: string;
    init_config?: {
        name?: string;
        symbol?: string;
        decimals?: number;
        admins?: string[];
        mint_amount?: string; // gateway returns hex string for init_config
        mint_to?: string;
    };
};

type RunAndSendResponse = {
    trace_id?: string;
    started_at?: string;
    finished_at?: string;
    artifacts?: {
        vft_deployer?: {
            vft?: {
                admins: string[];
                name: string;
                symbol: string;
                decimals: number;
                mint_amount: string; // base10 string
                mint_to: string;
            };
        };
        gateway?: {
            ok?: boolean;
            response?: {
                success?: boolean;
                message?: string;
                data?: {
                    programCreated?: GatewayProgramCreated;
                };
            };
        };
    };
};

// ---------- localStorage model ----------
const LS_KEY = "vara_vft_last_deploy";

type StoredVFT = {
    saved_at: string; // ISO
    trace_id?: string;
    program_id?: string;
    token: {
        name?: string;
        symbol?: string;
        decimals?: number;
        admins?: string[];
        mint_to?: string;
        mint_amount_base10?: string; // from vft_deployer
        mint_amount_human?: string;
    };
    gateway?: {
        programCreated?: GatewayProgramCreated;
    };
};

// Optional helper you can import/copy to other components:
export function loadLastDeployedVFT(): StoredVFT | null {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as StoredVFT;
    } catch {
        return null;
    }
}

// ---------- inline loader (NOT modal) ----------
function InlineDeployLoader({ visible }: { visible: boolean }) {
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
            aria-label="Deploying your VFT on Vara Network"
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
                        Deploying your VFT on Vara Network
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>
                        This can take a moment. Please keep this page open.
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

// ---------- pretty UI ----------
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

function SuccessScreen({
    traceId,
    startedAt,
    finishedAt,
    programId,
    token,
    mintAmountHuman,
}: {
    traceId?: string;
    startedAt?: string;
    finishedAt?: string;
    programId?: string;
    token: {
        name?: string;
        symbol?: string;
        decimals?: number;
        mintTo?: string;
        admins?: string[];
        mintAmountBase10?: string;
    };
    mintAmountHuman?: string;
}) {
    const [copiedField, setCopiedField] = useState<string>("");

    async function doCopy(field: string, value?: string) {
        if (!value) return;
        const ok = await copyToClipboard(value);
        if (ok) {
            setCopiedField(field);
            window.setTimeout(() => setCopiedField(""), 1200);
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
                            <div style={{ fontSize: 12, opacity: 0.8 }}>Deployment successful</div>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>Your token is live on Vara</div>
                        </div>
                    </div>

                    <span className="mono muted" style={{ fontSize: 12 }}>
                        Trace: {traceId ? shortHex(traceId, 6, 6) : "—"}
                    </span>
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                    <div
                        style={{
                            borderRadius: 16,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.04)",
                            padding: 14,
                        }}
                    >
                        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Program</div>

                        <InfoRow
                            label="Program ID"
                            value={programId ? programId : "—"}
                            mono
                            onCopy={programId ? () => doCopy("programId", programId) : undefined}
                            copyLabel={copiedField === "programId" ? "Copied" : "Copy"}
                        />

                        <InfoRow label="Started" value={startedAt ? new Date(startedAt).toLocaleString() : "—"} />
                        <InfoRow label="Finished" value={finishedAt ? new Date(finishedAt).toLocaleString() : "—"} />
                    </div>

                    <div
                        style={{
                            borderRadius: 16,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.04)",
                            padding: 14,
                        }}
                    >
                        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Token details</div>

                        <InfoRow label="Name" value={token.name || "—"} />
                        <InfoRow label="Symbol" value={token.symbol || "—"} />
                        <InfoRow label="Decimals" value={String(token.decimals ?? "—")} />

                        <InfoRow
                            label="Mint to"
                            value={token.mintTo || "—"}
                            mono
                            onCopy={token.mintTo ? () => doCopy("mintTo", token.mintTo) : undefined}
                            copyLabel={copiedField === "mintTo" ? "Copied" : "Copy"}
                        />

                        <InfoRow
                            label="Admins"
                            value={token.admins && token.admins.length ? token.admins.join(", ") : "—"}
                            mono
                            onCopy={token.admins?.[0] ? () => doCopy("admin0", token.admins![0]) : undefined}
                            copyLabel={copiedField === "admin0" ? "Copied" : "Copy #1"}
                        />

                        <InfoRow
                            label="Mint amount (raw)"
                            value={token.mintAmountBase10 || "—"}
                            mono
                            onCopy={token.mintAmountBase10 ? () => doCopy("mintRaw", token.mintAmountBase10) : undefined}
                            copyLabel={copiedField === "mintRaw" ? "Copied" : "Copy"}
                        />

                        <InfoRow
                            label="Mint amount (human)"
                            value={mintAmountHuman || "—"}
                            mono
                            onCopy={mintAmountHuman ? () => doCopy("mintHuman", mintAmountHuman) : undefined}
                            copyLabel={copiedField === "mintHuman" ? "Copied" : "Copy"}
                        />
                    </div>
                </div>
            </div>
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

// ---------- component ----------
export default function DeployToken({ payload }: { payload: GenerationPayload }) {
    const { account } = useAccount();
    const address = account?.decodedAddress as HexString | undefined;

    const SECONDARY_API_BASE = import.meta.env.VITE_SECONDARY_API_BASE || "http://127.0.0.1:8001";

    const goal = useMemo(() => buildGoalFromPayload(payload, address), [payload, address]);

    const [confirmed, setConfirmed] = useState(false);
    const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const [result, setResult] = useState<RunAndSendResponse | null>(null);

    // ✅ hide prompt after deploy button click
    const [hidePrompt, setHidePrompt] = useState(false);

    const walletConnected = !!address;
    const canPublish = walletConnected && confirmed && status !== "sending";

    const vft = result?.artifacts?.vft_deployer?.vft;
    const programId = result?.artifacts?.gateway?.response?.data?.programCreated?.address;

    const mintAmountHuman =
        vft?.mint_amount && typeof vft.decimals === "number" ? formatUnitsDecimalString(vft.mint_amount, vft.decimals) : undefined;

    function persistToLocalStorage(data: RunAndSendResponse) {
        const v = data?.artifacts?.vft_deployer?.vft;
        const pId = data?.artifacts?.gateway?.response?.data?.programCreated?.address;
        const programCreated = data?.artifacts?.gateway?.response?.data?.programCreated;

        if (!v || !pId) return; // only persist successful full deploy

        const stored: StoredVFT = {
            saved_at: new Date().toISOString(),
            trace_id: data.trace_id,
            program_id: pId,
            token: {
                name: v.name,
                symbol: v.symbol,
                decimals: v.decimals,
                admins: v.admins,
                mint_to: v.mint_to,
                mint_amount_base10: v.mint_amount,
                mint_amount_human: v.mint_amount && typeof v.decimals === "number" ? formatUnitsDecimalString(v.mint_amount, v.decimals) : undefined,
            },
            gateway: {
                programCreated,
            },
        };

        try {
            localStorage.setItem(LS_KEY, JSON.stringify(stored));
        } catch {
            // ignore localStorage errors (private mode, quota, etc.)
        }
    }

    async function publishTokenContract() {
        if (!walletConnected) {
            setStatus("error");
            setErrorMsg("Wallet not connected. Please connect your wallet first.");
            return;
        }
        if (!confirmed) return;

        // ✅ hide prompt once user starts deploying
        setHidePrompt(true);

        setStatus("sending");
        setErrorMsg("");
        setResult(null);

        try {
            const res = await fetch(`${SECONDARY_API_BASE}/agents/run-and-send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ goal, wallet: address }),
            });

            const data = (await res.json().catch(() => ({}))) as RunAndSendResponse;

            if (!res.ok) {
                const detail = (data as any)?.detail || (data as any)?.error || "Publish token contract failed";
                throw new Error(typeof detail === "string" ? detail : "Publish token contract failed");
            }

            setResult(data);
            setStatus("done");

            // ✅ persist only when success exists (programId + vft)
            persistToLocalStorage(data);
        } catch (e: any) {
            setStatus("error");
            setErrorMsg(e?.message ?? String(e));
            
            setHidePrompt(false);
        }
    }

    return (
        <section className="card">


            {/* Wallet */}
            <div style={{ marginTop: 10 }}>
                <Wallet />
                <div className="muted" style={{ marginTop: 8 }}>
                    Wallet status: <span className="mono">{walletConnected ? `CONNECTED • ${shortHex(address)}` : "NOT CONNECTED"}</span>
                </div>

                {!walletConnected ? (
                    <div className="cnpWarn" style={{ marginTop: 10 }}>
                        Connect your wallet to continue.
                    </div>
                ) : null}
            </div>

            {/* Inline loader */}
            <InlineDeployLoader visible={status === "sending"} />

            {/* Prompt preview (HIDDEN after deploy click and after success) */}
            {!hidePrompt && status !== "done" ? (
                <div className="codeblock" style={{ marginTop: 12 }}>
                    <div className="codeblock-title">Deployment prompt (sent to deployer)</div>
                    <pre className="mono" style={{ whiteSpace: "pre-wrap", maxHeight: 220, overflow: "auto" }}>
                        {goal}
                    </pre>
                </div>
            ) : null}

            {/* Confirm + publish */}
            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center", opacity: walletConnected ? 1 : 0.6 }}>
                    <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        disabled={!walletConnected || status === "sending"}
                    />
                    <span className="mono">I confirm that I want to publish the token contract.</span>
                </label>

                <button className="btn" onClick={publishTokenContract} disabled={!canPublish}>
                    {status === "sending" ? "Deploying…" : "Publish token contract"}
                </button>

                <span className="mono muted">Endpoint: {SECONDARY_API_BASE}/agents/run-and-send</span>
            </div>

            {/* Error */}
            {status === "error" && errorMsg ? <ErrorBanner message={`❌ ${errorMsg}`} /> : null}

            {/* Success (no JSON) */}
            {status === "done" && result && vft ? (
                <SuccessScreen
                    traceId={result.trace_id}
                    startedAt={result.started_at}
                    finishedAt={result.finished_at}
                    programId={programId}
                    token={{
                        name: vft.name,
                        symbol: vft.symbol,
                        decimals: vft.decimals,
                        admins: vft.admins,
                        mintTo: vft.mint_to,
                        mintAmountBase10: vft.mint_amount,
                    }}
                    mintAmountHuman={mintAmountHuman}
                />
            ) : null}

            {status === "done" && programId ? (
                <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
                    Saved to localStorage: <span className="mono">{LS_KEY}</span>
                </div>
            ) : null}
        </section>
    );
}
