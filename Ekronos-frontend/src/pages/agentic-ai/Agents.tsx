import { useMemo, useRef, useState } from "react";
import { FiPlay, FiRefreshCcw, FiPower } from "react-icons/fi";
import "./styles.css";

type AgentName = "smart_program" | "frontend" | "server" | "indexer" | "economy";
type AgentStatus = "idle" | "queued" | "running" | "done" | "error";

type AgentViewState = {
  status: AgentStatus;
  summary?: string;
  error?: string;
  result?: unknown;
  startedAt?: number;
  finishedAt?: number;
  liveElapsedS?: number;
};

type RouterUpdateEvent = {
  type: "router_update";
  trace_id: string;
  message: string;
  goal_preview?: string;
  targets?: AgentName[];
};

type HeartbeatEvent = { type: "heartbeat"; trace_id: string; ts: number };

type ProgressTickEvent = {
  type: "progress_tick";
  trace_id: string;
  elapsed_s: number;
  message?: string;
  agents: Record<
    string,
    {
      status: "queued" | "running" | "done" | "error";
      elapsed_s: number | null;
    }
  >;
};

type SSEEvent =
  | { type: "agent_start"; trace_id: string; agent: AgentName }
  | { type: "agent_done"; trace_id: string; agent: AgentName; summary?: string; result?: unknown }
  | { type: "agent_error"; trace_id: string; agent: AgentName; error: string }
  | { type: "done"; trace_id: string }
  | RouterUpdateEvent
  | HeartbeatEvent
  | ProgressTickEvent;

type PRDraft = {
  title: string;
  body: string;
};

const DEV_AGENTS: AgentName[] = ["smart_program", "frontend", "server", "indexer"];
const ECON_AGENT: AgentName = "economy";
const ALL_AGENTS: AgentName[] = [...DEV_AGENTS, ECON_AGENT];
const DEFAULT_ORDER: AgentName[] = ["smart_program", "frontend", "server", "indexer", "economy"];

const TITLES: Record<AgentName, string> = {
  smart_program: "Smart Program",
  frontend: "Frontend",
  server: "Server",
  indexer: "Indexer",
  economy: "Economy (Cost / Efficiency)",
};

function prettyJSON(v: unknown) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function Badge({ status }: { status: AgentStatus }) {
  const cls =
    status === "running"
      ? "badge badge-running"
      : status === "done"
        ? "badge badge-done"
        : status === "error"
          ? "badge badge-error"
          : status === "queued"
            ? "badge badge-queued"
            : "badge badge-idle";

  const label =
    status === "running"
      ? "Running"
      : status === "done"
        ? "Done"
        : status === "error"
          ? "Error"
          : status === "queued"
            ? "Queued"
            : "Idle";

  return <span className={cls}>{label}</span>;
}

function arrayMove<T>(arr: T[], from: number, to: number) {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function extractRustCodeFromBody(body: string): string | null {
  const m = body.match(/```rust([\s\S]*?)```/i);
  if (!m) return null;
  const code = (m[1] ?? "").trim();
  return code ? code + "\n" : null;
}


export type ProjectForm = {
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
  economyResult?: unknown;
  agenticResult?: unknown;
  tokenDeployResult?: unknown;
  poolResult?: unknown;
};

function buildGoalFromPayload(payload: GenerationPayload) {
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
    ``,
    `Deliverables:`,
    `1) Smart program(s) for Vara (Rust),`,
    `2) Frontend UI (React),`,
    `3) Server/API (FastAPI),`,
    `4) Optional indexer,`,
    `5) Economy analysis (cost/efficiency + tokenomics suggestions).`,
  ].join("\n");
}

/* ---------- UI helpers ---------- */

function WorkingBar({ label = "Working…" }: { label?: string }) {
  return (
    <div className="workbar" aria-label="Working">
      <div className="workbar__top">
        <span className="workbar__label">{label}</span>
        <span className="workbar__hint">Live</span>
      </div>
      <div className="workbar__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={50}>
        <div className="workbar__fill" />
        <div className="workbar__glow" />
      </div>
    </div>
  );
}

type AgentWidgetProps = {
  agent: AgentName;
  state: AgentViewState;
  maximized: boolean;
  onMaximize: () => void;
  onClose: () => void;

  draggable: boolean;
  onDragStart: (agent: AgentName) => void;
  onDragOver: (over: AgentName) => void;
  onDrop: (over: AgentName) => void;

  prDraft: PRDraft | null;
  creatingPR: boolean;
  onCreatePR: () => void;
  prStatus: string;
};

function AgentWidget({
  agent,
  state,
  maximized,
  onMaximize,
  onClose,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  prDraft,
  creatingPR,
  onCreatePR,
  prStatus,
}: AgentWidgetProps) {
  const durationMs =
    state.startedAt && state.finishedAt
      ? Math.max(0, state.finishedAt - state.startedAt)
      : state.startedAt
        ? Date.now() - state.startedAt
        : undefined;

  const durationLabel =
    durationMs == null ? "—" : durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`;

  const liveLabel =
    state.status === "running" && state.liveElapsedS != null ? `${state.liveElapsedS.toFixed(1)}s` : undefined;

  const rootCls = ["agent-card", agent === "economy" ? "agent-card-big" : "", maximized ? "agent-card-max" : ""]
    .filter(Boolean)
    .join(" ");

  const showPRButton = agent === "smart_program" && !!prDraft;
  const isWorking = state.status === "queued" || state.status === "running";

  return (
    <section
      className={rootCls}
      draggable={draggable}
      onDragStart={() => onDragStart(agent)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(agent);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(agent);
      }}
      aria-label={`Agent widget ${agent}`}
    >
      <div className="agent-card-head">
        <div className="agent-card-title">
          <span className="agent-name">{TITLES[agent]}</span>
          <Badge status={state.status} />
        </div>

        <div className="agent-toolbar">
          <div className="agent-meta">
            <span className="muted">Time</span>{" "}
            <span className="mono">{state.status === "running" && liveLabel ? liveLabel : durationLabel}</span>
          </div>

          <button className="icon-btn" onClick={onMaximize} title={maximized ? "Restore" : "Maximize"}>
            ⤢
          </button>
          <button className="icon-btn icon-btn-danger" onClick={onClose} title="Hide widget">
            ✕
          </button>
        </div>
      </div>

      {state.summary ? (
        <div className="agent-summary">{state.summary}</div>
      ) : (
        <div className="agent-summary muted">No summary yet.</div>
      )}

      
      {isWorking && <WorkingBar label="Working…" />}

      
      {maximized && showPRButton && (
        <div className="prRow">
          <button className="prBtn" onClick={onCreatePR} disabled={creatingPR} title="Create PR in backend">
            {creatingPR ? "Creating PR…" : "Create PR"}
          </button>
          {prStatus ? <span className="mono prStatus">{prStatus}</span> : null}
        </div>
      )}

    
      {maximized && (
        <>
          {state.error ? (
            <div className="codeblock codeblock-error">
              <div className="codeblock-title">Error</div>
              <pre className="mono">{state.error}</pre>
            </div>
          ) : (
            <div className="codeblock">
              <div className="codeblock-title">Result</div>
              <pre className="mono">
                {state.result ? prettyJSON(state.result) : state.status === "queued" ? "Queued…" : "Waiting for result…"}
              </pre>
            </div>
          )}
        </>
      )}

      <div className="drag-hint muted">Drag to reorder • Drop to swap position</div>
    </section>
  );
}

export default function Agents({ payload }: { payload: GenerationPayload }) {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
  const goal = useMemo(() => buildGoalFromPayload(payload), [payload]);

  const [traceId, setTraceId] = useState<string>("—");
  const [streamStatus, setStreamStatus] = useState<"disconnected" | "connecting" | "connected" | "done" | "error">(
    "disconnected"
  );

  const [statusLine, setStatusLine] = useState<string>("Ready.");
  const [selectedAgents, setSelectedAgents] = useState<AgentName[] | null>(null);
  const [lastUpdateAt, setLastUpdateAt] = useState<number | null>(null);

  const [progressPulse, setProgressPulse] = useState<number>(0);
  const [nextTickIn, setNextTickIn] = useState<number>(0);
  const tickTimerRef = useRef<number | null>(null);

  const [logLines, setLogLines] = useState<string[]>([]);

  const [agents, setAgents] = useState<Record<AgentName, AgentViewState>>(() => {
    const init: Record<AgentName, AgentViewState> = {} as any;
    ALL_AGENTS.forEach((a) => (init[a] = { status: "idle" }));
    return init;
  });

  const [prDraft, setPrDraft] = useState<PRDraft | null>(null);
  const [prStatus, setPrStatus] = useState<string>("");
  const [creatingPR, setCreatingPR] = useState<boolean>(false);

  function extractPRDraft(snapshot: Record<AgentName, AgentViewState>): PRDraft | null {
    const results = Object.values(snapshot).map((a) => a.result).filter(Boolean);
    for (const r of results) {
      if (!r || typeof r !== "object") continue;
      const obj = r as any;
      const ok = obj.ok === true;
      const pr = obj.pr;
      if (ok && pr && typeof pr === "object" && typeof pr.title === "string" && typeof pr.body === "string") {
        return { title: pr.title, body: pr.body };
      }
    }
    return null;
  }

  async function createPR() {
    setPrStatus("");

    const payload = prDraft ?? extractPRDraft(agents);
    if (!payload) {
      setPrStatus("❌ Could not find { ok:true, pr:{title,body} } in agent results.");
      return;
    }

    const rustCode = extractRustCodeFromBody(payload.body);

    setPrDraft(payload);
    setCreatingPR(true);

    try {
      const reqBody: any = { title: payload.title, body: payload.body };
      if (rustCode) reqBody.file_content = rustCode;

      const res = await fetch("/api/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reqBody),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || data?.error || "PR creation failed");

      setPrStatus(`✅ PR created: ${data?.html_url ?? "OK"}`);
    } catch (e: any) {
      setPrStatus(`❌ ${e?.message ?? e}`);
    } finally {
      setCreatingPR(false);
    }
  }

  const [order, setOrder] = useState<AgentName[]>(DEFAULT_ORDER);
  const [hidden, setHidden] = useState<Record<AgentName, boolean>>(() => {
    const init: Record<AgentName, boolean> = {} as any;
    ALL_AGENTS.forEach((a) => (init[a] = false));
    return init;
  });
  const [maxAgent, setMaxAgent] = useState<AgentName | null>(null);

  const draggingRef = useRef<AgentName | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const canRun = useMemo(
    () => goal.trim().length > 0 && streamStatus !== "connecting" && streamStatus !== "connected",
    [goal, streamStatus]
  );

  function clearTickTimer() {
    if (tickTimerRef.current) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }

  function resetUI() {
    setTraceId("—");
    setStatusLine("Ready.");
    setSelectedAgents(null);
    setLastUpdateAt(null);
    setLogLines([]);
    setProgressPulse(0);
    setNextTickIn(0);
    clearTickTimer();

    setAgents(() => {
      const init: Record<AgentName, AgentViewState> = {} as any;
      ALL_AGENTS.forEach((a) => (init[a] = { status: "idle" }));
      return init;
    });

    setPrDraft(null);
    setPrStatus("");
    setCreatingPR(false);
  }

  function disconnect() {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    clearTickTimer();
    if (streamStatus === "connected" || streamStatus === "connecting") setStreamStatus("disconnected");
  }

  function appendLog(line: string) {
    setLogLines((prev) => {
      const next = [...prev, line];
      if (next.length > 200) return next.slice(next.length - 200);
      return next;
    });
  }

  const LOG_HEARTBEAT = false;
  const LOG_PROGRESS = false;

  function handleEvent(evt: SSEEvent) {
    if (
      evt.type === "agent_start" ||
      evt.type === "agent_done" ||
      evt.type === "agent_error" ||
      evt.type === "done" ||
      evt.type === "router_update" ||
      (LOG_HEARTBEAT && evt.type === "heartbeat") ||
      (LOG_PROGRESS && evt.type === "progress_tick")
    ) {
      appendLog(`[${new Date().toLocaleTimeString()}] ${prettyJSON(evt)}`);
    }

    if (evt.type === "router_update") {
      setStatusLine(evt.message);
      setLastUpdateAt(Date.now());
      if (evt.trace_id) setTraceId(evt.trace_id);

      if (evt.targets) {
        setSelectedAgents(evt.targets as AgentName[]);
        setAgents((prev) => {
          const next = { ...prev };
          (evt.targets as AgentName[]).forEach((a) => {
            next[a] = { ...next[a], status: "queued" };
          });
          return next;
        });

        setHidden((prev) => {
          const next = { ...prev };
          (evt.targets as AgentName[]).forEach((a) => (next[a] = false));
          return next;
        });
      }
      return;
    }

    if (evt.type === "heartbeat") {
      setLastUpdateAt(Date.now());
      return;
    }

    if (evt.type === "progress_tick") {
      setLastUpdateAt(Date.now());
      setProgressPulse((p) => p + 1);
      setNextTickIn(5);
      setStatusLine(evt.message ? evt.message : `Working… (elapsed ${evt.elapsed_s}s)`);

      setAgents((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(evt.agents || {})) {
          const agentName = k as AgentName;
          if (!next[agentName]) continue;
          next[agentName] = {
            ...next[agentName],
            status: (v.status as any) ?? next[agentName].status,
            liveElapsedS: typeof v.elapsed_s === "number" ? v.elapsed_s : next[agentName].liveElapsedS,
          };
        }
        return next;
      });
      return;
    }

    if (evt.type === "agent_start") {
      setLastUpdateAt(Date.now());
      setStatusLine(`Running ${evt.agent.replace("_", " ")}…`);
      setAgents((prev) => ({
        ...prev,
        [evt.agent]: {
          ...prev[evt.agent],
          status: "running",
          startedAt: Date.now(),
          finishedAt: undefined,
          error: undefined,
        },
      }));
      return;
    }

    if (evt.type === "agent_done") {
      setLastUpdateAt(Date.now());
      setStatusLine(`${evt.agent.replace("_", " ")} completed.`);
      setAgents((prev) => {
        const next = {
          ...prev,
          [evt.agent]: {
            ...prev[evt.agent],
            status: "done",
            summary: evt.summary,
            result: evt.result,
            finishedAt: Date.now(),
            liveElapsedS: undefined,
          },
        };

        const found = extractPRDraft(next);
        if (found) setPrDraft(found);

        return next;
      });
      return;
    }

    if (evt.type === "agent_error") {
      setLastUpdateAt(Date.now());
      setStatusLine(`${evt.agent.replace("_", " ")} failed.`);
      setAgents((prev) => ({
        ...prev,
        [evt.agent]: {
          ...prev[evt.agent],
          status: "error",
          error: evt.error,
          finishedAt: Date.now(),
          liveElapsedS: undefined,
        },
      }));
      return;
    }

    if (evt.type === "done") {
      setTraceId(evt.trace_id);
      setStreamStatus("done");
      setStatusLine("All agents finished.");
      setLastUpdateAt(Date.now());
      disconnect();
      return;
    }
  }

  function startStream() {
    resetUI();
    disconnect();

    setStreamStatus("connecting");
    setStatusLine("Connecting…");

    const url = new URL(`${API_BASE}/agents/stream`);
    url.searchParams.set("goal", goal);

    const es = new EventSource(url.toString());
    esRef.current = es;

    es.onopen = () => {
      setStreamStatus("connected");
      setStatusLine("Connected. Routing…");
      setLastUpdateAt(Date.now());

      setNextTickIn(5);
      clearTickTimer();
      tickTimerRef.current = window.setInterval(() => {
        setNextTickIn((v) => (v > 0 ? v - 1 : 0));
      }, 1000);
    };

    es.onmessage = (m) => {
      try {
        const data = JSON.parse(m.data) as SSEEvent;
        handleEvent(data);
      } catch (e) {
        appendLog(`[${new Date().toLocaleTimeString()}] Failed to parse SSE: ${String(e)} | raw=${m.data}`);
      }
    };

    es.onerror = () => {
      setStreamStatus("error");
      setStatusLine("SSE error. Check backend/CORS.");
      appendLog(`[${new Date().toLocaleTimeString()}] SSE error. Check API base / CORS / backend logs.`);
      disconnect();
    };
  }

  function onDragStart(agent: AgentName) {
    draggingRef.current = agent;
  }
  function onDragOver(_: AgentName) { }
  function onDrop(over: AgentName) {
    const from = draggingRef.current;
    if (!from) return;
    draggingRef.current = null;

    if (from === over) return;
    if (hidden[over]) return;

    const fromIdx = order.indexOf(from);
    const toIdx = order.indexOf(over);
    if (fromIdx === -1 || toIdx === -1) return;

    setOrder(arrayMove(order, fromIdx, toIdx));
  }

  function hideWidget(a: AgentName) {
    setHidden((prev) => ({ ...prev, [a]: true }));
    if (maxAgent === a) setMaxAgent(null);
  }

  function showWidget(a: AgentName) {
    setHidden((prev) => ({ ...prev, [a]: false }));
  }

  function toggleMax(a: AgentName) {
    setMaxAgent((cur) => (cur === a ? null : a));
  }

  const lastUpdateLabel = lastUpdateAt ? new Date(lastUpdateAt).toLocaleTimeString() : "—";
  const visibleOrder = order.filter((a) => !hidden[a]);
  const widgetsToRender = maxAgent ? [maxAgent] : visibleOrder;

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-dot" />
          <div>
            <div className="brand-title">Agentic Orchestrator</div>
            <div className="brand-sub muted">Auto-filled from your project configuration</div>
          </div>
        </div>

        <div className="meta">
          <div className="meta-pill">
            <span className="muted">Trace</span> <span className="mono">{traceId}</span>
          </div>
          <div className="meta-pill">
            <span className="muted">Stream</span> <span className="mono">{streamStatus}</span>
          </div>
          <div className="meta-pill">
            <span className="muted">Last update</span> <span className="mono">{lastUpdateLabel}</span>
          </div>
        </div>
      </header>

      <main className="layout layout-senior">
        {/* LEFT */}
        <section className="card left-rail">
          <h2 className="card-title">Orchestrator input</h2>
          <p className="card-desc">Derived from the project prompt + token configuration.</p>

          <div className="status-bar">
            <div className={progressPulse % 2 === 0 ? "status-dot" : "status-dot status-dot-pulse"} />
            <div className="status-text">
              {statusLine}
              {streamStatus === "connected" && <span className="status-next muted"> • next update in {nextTickIn}s</span>}
            </div>
          </div>

          {selectedAgents?.length ? (
            <div className="selected-agents">
              <span className="muted">Selected:</span> <span className="mono">{selectedAgents.join(", ")}</span>
            </div>
          ) : (
            <div className="selected-agents muted">Selected: —</div>
          )}

          <div className="codeblock" style={{ marginTop: 10 }}>
            <div className="codeblock-title">Goal (auto-generated)</div>
            <pre className="mono" style={{ whiteSpace: "pre-wrap" }}>
              {goal}
            </pre>
          </div>

          {/* ✅ Protagonist Run button */}
          <div className="actions-row actions-row-hero">
            <button
              className="runPrimary"
              disabled={!canRun}
              onClick={startStream}
              aria-label="Start agent pipeline"
            >
              <span className="runPrimary__icon">
                ▶
              </span>

              <span className="runPrimary__text">
                Run Agents
              </span>
            </button>

            <div className="actions-row-secondary">
              <button
                className="btn btn-icon"
                onClick={resetUI}
                disabled={streamStatus === "connected" || streamStatus === "connecting"}
                title="Reset"
              >
                <FiRefreshCcw />
              </button>
              <button
                className="btn btn-icon btn-danger"
                onClick={disconnect}
                disabled={streamStatus !== "connected" && streamStatus !== "connecting"}
                title="Disconnect"
              >
                <FiPower />
              </button>
            </div>
          </div>

          <div className="help">
            <div className="help-title">Backend</div>
            <div className="help-text mono">{API_BASE}</div>
            <div className="help-text muted">SSE: GET /agents/stream?goal=...</div>
          </div>

          {prDraft && (
            <div className="codeblock" style={{ marginTop: 12 }}>
              <div className="codeblock-title">PR Draft detected</div>
              <pre className="mono">{prettyJSON({ ok: true, pr: prDraft })}</pre>
            </div>
          )}

          <div className="hidden-drawer">
            <div className="hidden-drawer-title">Hidden widgets</div>
            <div className="hidden-drawer-list">
              {ALL_AGENTS.filter((a) => hidden[a]).length === 0 ? (
                <div className="muted">None</div>
              ) : (
                ALL_AGENTS.filter((a) => hidden[a]).map((a) => (
                  <button key={a} className="chip" onClick={() => showWidget(a)}>
                    + {TITLES[a]}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="mini-logs">
            <div className="mini-logs-title">Key events</div>
            <pre className="mono mini-logs-pre">
              {logLines.length ? logLines.slice(-60).join("\n") : "No events yet. Click “Run”."}
            </pre>
          </div>
        </section>

        {/* RIGHT */}
        <section className={maxAgent ? "right-panels right-panels-max" : "right-panels"}>
          <div className={maxAgent ? "widget-grid widget-grid-max" : "widget-grid"}>
            {widgetsToRender.map((agent) => (
              <AgentWidget
                key={agent}
                agent={agent}
                state={agents[agent]}
                maximized={maxAgent === agent}
                onMaximize={() => toggleMax(agent)}
                onClose={() => hideWidget(agent)}
                draggable={!maxAgent}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                prDraft={prDraft}
                creatingPR={creatingPR}
                onCreatePR={createPR}
                prStatus={prStatus}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
