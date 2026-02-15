import { useEffect, useMemo, useState } from "react";
import "./github-login-fork.css";
import { AgentsPage } from "./AgentsPage";
import Agents from "./Agents";

type Me = { login: string };

type ForkResponse = {
  full_name?: string;
  html_url?: string;
  status?: string;
  error?: string;
  detail?: string;
};

export default function GitHubLoginFork() {
  const [me, setMe] = useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [forking, setForking] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const repoOwner = "Vara-Lab";
  const repoName = "dapp";

  const forkTarget = useMemo(
    () => `${repoOwner}/${repoName}`,
    [repoOwner, repoName]
  );

  async function fetchMe() {
    setLoadingMe(true);
    setMsg("");
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) {
        setMe(null);
        return;
      }
      const data = (await res.json()) as Me;
      setMe(data);
    } catch (e: any) {
      setMe(null);
      setMsg(`❌ Unable to fetch /api/me: ${e?.message ?? e}`);
    } finally {
      setLoadingMe(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  function loginWithGitHub() {
    window.location.href = "/api/auth/github/start";
  }

  async function forkRepo() {
    setForking(true);
    setMsg("");
    try {
      const res = await fetch("/api/github/fork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ owner: repoOwner, repo: repoName }),
      });

      const data = (await res.json().catch(() => ({}))) as ForkResponse;

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Fork request failed");
      }

      if (data.html_url) {
        setMsg(`✅ Fork requested: ${data.full_name ?? forkTarget}`);
      } else {
        setMsg("✅ Fork requested. It may take a few seconds to appear on GitHub.");
      }
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? e}`);
    } finally {
      setForking(false);
    }
  }

  function logoutHint() {
    setMsg(
      "ℹ️ To log out, restart the backend (token store is cleared) or implement an /api/logout endpoint."
    );
  }

  const isError = msg.trim().startsWith("❌");
  const isOk = msg.trim().startsWith("✅");

  return (
    <section className="gh">
      <div className="gh__inner">
        {/* Header */}
        <header className="gh__head">
          <div className="gh__kicker">INTEGRATION</div>
          <h2 className="gh__title">GitHub Login & Fork</h2>
          <p className="gh__sub">
            Authenticate with GitHub and request a repository fork through the backend.
          </p>
        </header>

        {/* Card */}
        <div className="gh__card">
          {/* Meta */}
          <div className="gh__meta">
            <div className="gh__row">
              <span className="gh__label">Target repository</span>
              <span className="gh__value">{forkTarget}</span>
            </div>

            <div className="gh__row">
              <span className="gh__label">Status</span>
              {loadingMe ? (
                <span className="gh__value gh__muted">Checking session…</span>
              ) : me ? (
                <span className="gh__value">
                  Logged in as <b>{me.login}</b>
                </span>
              ) : (
                <span className="gh__value gh__muted">No active session</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="gh__actions">
            {!me ? (
              <button
                className="ghBtn ghBtn--primary"
                onClick={loginWithGitHub}
              >
                Sign in with GitHub
              </button>
            ) : (
              <>
                <button
                  className="ghBtn ghBtn--primary"
                  onClick={forkRepo}
                  disabled={forking}
                >
                  {forking ? "Forking…" : `Fork ${forkTarget}`}
                </button>

                <button
                  className="ghBtn ghBtn--ghost"
                  onClick={fetchMe}
                  disabled={loadingMe}
                >
                  {loadingMe ? "Refreshing…" : "Refresh session"}
                </button>

                <button
                  className="ghBtn ghBtn--ghost"
                  onClick={logoutHint}
                >
                  Logout (info)
                </button>
              </>
            )}
          </div>

          {/* Message */}
          {msg && (
            <div
              className={`gh__msg ${isOk ? "is-ok" : isError ? "is-err" : ""}`}
            >
              {msg}
            </div>
          )}

          
        </div>
      </div>
      <Agents/>
    </section>
  );
}
