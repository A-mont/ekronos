import React, { useMemo, useState } from "react";
import "./create-new-project.css";
import {
  FiZap,
  FiChevronDown,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiCpu,
  FiBox,
  FiDroplet,
  FiFlag,
} from "react-icons/fi";

import Agents from "../agentic-ai/Agents";
import DeployToken from "../agentic-ai/DeployToken"; 
import CreatePairRiverDex from "../agentic-ai/CreatePairRiverDex";

type StepId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type ProjectForm = {
  description: string;
  projectType: string;
  launchStyle: string;
  supplyModel: string;
  liquidityBudget: string;
  governanceEnabled: boolean;
};

type GenerationPayload = {
  createdAt: number;
  form: ProjectForm;
  economyResult?: unknown;
  agenticResult?: unknown;
  tokenDeployResult?: unknown;
  poolResult?: unknown;
};

const steps = [
  { title: "Describe", subtitle: "Define the vision", icon: <span>1</span> },
  { title: "Configure", subtitle: "Set parameters", icon: <span>2</span> },
  { title: "Review", subtitle: "Confirm details", icon: <span>3</span> },
  { title: "AI Vara Agentic System", subtitle: "Orchestrate generation", icon: <FiCpu /> },
  { title: "Deploy Token", subtitle: "Publish token contract", icon: <FiBox /> },
  { title: "Create Pool (RivrDEX)", subtitle: "Initialize liquidity pool", icon: <FiDroplet /> },
  { title: "Completed", subtitle: "Everything is ready", icon: <FiFlag /> },
] as const;

export const CreateNewProject = () => {
  const [step, setStep] = useState<StepId>(0);

  const [form, setForm] = useState<ProjectForm>({
    description: "",
    projectType: "DeFi",
    launchStyle: "Fair Launch",
    supplyModel: "Fixed",
    liquidityBudget: "50000",
    governanceEnabled: false,
  });

  const [generationPayload, setGenerationPayload] = useState<GenerationPayload | null>(null);

  const canContinueStep0 = useMemo(() => form.description.trim().length > 0, [form.description]);
  const canContinueStep1 = useMemo(() => form.liquidityBudget.trim().length > 0, [form.liquidityBudget]);

  const canNext = useMemo(() => {
    if (step === 0) return canContinueStep0;
    if (step === 1) return canContinueStep1;
    if (step === 2) return form.description.trim().length > 0;
    return true;
  }, [step, canContinueStep0, canContinueStep1, form.description]);

  const progressPct = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  function next() {
    if (!canNext) return;
    setStep((s) => (s < 6 ? ((s + 1) as StepId) : s));
  }

  function back() {
    setStep((s) => (s > 0 ? ((s - 1) as StepId) : s));
  }

  function generateEconomyAndGoToStep4() {
    const payload: GenerationPayload = {
      createdAt: Date.now(),
      form: { ...form },
    };

    setGenerationPayload(payload);
    setStep(3);
  }

  function resetAll() {
    setStep(0);
    setGenerationPayload(null);
    setForm({
      description: "",
      projectType: "DeFi",
      launchStyle: "Fair Launch",
      supplyModel: "Fixed",
      liquidityBudget: "50000",
      governanceEnabled: false,
    });
  }

  return (
    <section className="cnp">
      {/* Page header */}
      <header className="cnp__head">
        <div className="cnp__kicker">CREATOR STUDIO</div>
        <h1 className="cnp__title">Create New Project</h1>
        <p className="cnp__sub">
          Build an economy end-to-end: configure, generate, deploy, and launch liquidity — all in one guided flow.
        </p>
      </header>

      {/* Stepper */}
      <div className="cnpStepper" aria-label="Project creation steps">
        <div className="cnpStepper__bar">
          <div className="cnpStepper__barFill" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="cnpStepper__row cnpStepper__row--7">
          {steps.map((s, idx) => {
            const state = idx < step ? "complete" : idx === step ? "active" : "upcoming";
            return (
              <div
                key={s.title}
                className={`cnpStep cnpStep--${state}`}
                aria-current={idx === step ? "step" : undefined}
              >
                <div className="cnpStep__dot" aria-hidden="true">
                  {idx < step ? <FiCheckCircle /> : s.icon}
                </div>
                <div className="cnpStep__txt">
                  <div className="cnpStep__title">{s.title}</div>
                  <div className="cnpStep__sub">{s.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main card */}
      <div className="cnpCard">
        <div className="cnpCard__top">
          <div>
            <h2 className="cnpCard__title">{steps[step].title}</h2>
            <p className="cnpCard__desc">{steps[step].subtitle}</p>
          </div>

          <div className="cnpCard__meta">
            <span className="cnpPill">
              Step <b>{step + 1}</b> / {steps.length}
            </span>
          </div>
        </div>

        {/* STEP 1: Describe */}
        {step === 0 && (
          <div className="cnpSection">
            <div className="cnpField">
              <label className="cnpLabel" htmlFor="desc">
                Describe your project
              </label>
              <div className="cnpTextareaWrap">
                <textarea
                  id="desc"
                  className="cnpTextarea"
                  value={form.description}
                  placeholder="Example: Create a DeFi protocol that rewards community participation with a fair launch model and staking rewards..."
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={7}
                />
              </div>
              <div className="cnpHint">Tip: include target users, core utility, and how the economy sustains value.</div>
            </div>
          </div>
        )}

        {/* STEP 2: Configure */}
        {step === 1 && (
          <div className="cnpSection">
            <div className="cnpGrid">
              <div className="cnpField">
                <label className="cnpLabel">Project Type</label>
                <div className="cnpSelectWrap">
                  <select
                    className="cnpSelect"
                    value={form.projectType}
                    onChange={(e) => setForm((p) => ({ ...p, projectType: e.target.value }))}
                  >
                    {["DeFi", "Community", "Game", "RWA", "AI Tool", "Marketplace"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="cnpSelectIcon" aria-hidden="true" />
                </div>
              </div>

              <div className="cnpField">
                <label className="cnpLabel">Launch Style</label>
                <div className="cnpSelectWrap">
                  <select
                    className="cnpSelect"
                    value={form.launchStyle}
                    onChange={(e) => setForm((p) => ({ ...p, launchStyle: e.target.value }))}
                  >
                    {["Fair Launch", "Team Allocation", "Community Heavy"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="cnpSelectIcon" aria-hidden="true" />
                </div>
              </div>

              <div className="cnpField">
                <label className="cnpLabel">Supply Model</label>
                <div className="cnpSelectWrap">
                  <select
                    className="cnpSelect"
                    value={form.supplyModel}
                    onChange={(e) => setForm((p) => ({ ...p, supplyModel: e.target.value }))}
                  >
                    {["Fixed", "Inflationary"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="cnpSelectIcon" aria-hidden="true" />
                </div>
              </div>

              <div className="cnpField">
                <label className="cnpLabel" htmlFor="budget">
                  Liquidity Budget (USD)
                </label>
                <input
                  id="budget"
                  className="cnpInput"
                  value={form.liquidityBudget}
                  onChange={(e) => setForm((p) => ({ ...p, liquidityBudget: e.target.value }))}
                  inputMode="numeric"
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="cnpToggleCard">
              <div className="cnpToggleText">
                <div className="cnpToggleTitle">Governance Module</div>
                <div className="cnpToggleSub">Enable on-chain governance for token holders.</div>
              </div>

              <button
                type="button"
                className={`cnpSwitch ${form.governanceEnabled ? "is-on" : ""}`}
                onClick={() => setForm((p) => ({ ...p, governanceEnabled: !p.governanceEnabled }))}
                aria-pressed={form.governanceEnabled}
                aria-label="Toggle Governance Module"
              >
                <span className="cnpSwitch__knob" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 2 && (
          <div className="cnpSection">
            <div className="cnpReview">
              <div className="cnpReview__row">
                <span className="cnpReview__label">Project Type</span>
                <span className="cnpReview__value">{form.projectType}</span>
              </div>
              <div className="cnpReview__row">
                <span className="cnpReview__label">Launch Style</span>
                <span className="cnpReview__value">{form.launchStyle}</span>
              </div>
              <div className="cnpReview__row">
                <span className="cnpReview__label">Supply Model</span>
                <span className="cnpReview__value">{form.supplyModel}</span>
              </div>
              <div className="cnpReview__row">
                <span className="cnpReview__label">Liquidity Budget</span>
                <span className="cnpReview__value">${form.liquidityBudget}</span>
              </div>
              <div className="cnpReview__row">
                <span className="cnpReview__label">Governance</span>
                <span className="cnpReview__value">{form.governanceEnabled ? "Enabled" : "Disabled"}</span>
              </div>

              <div className="cnpReview__block">
                <div className="cnpReview__label">Project Description</div>
                <pre className="cnpReview__pre">{form.description || "—"}</pre>
              </div>
            </div>

            <div className="cnpWarn">
              Clicking <b>Generate Economy</b> will lock these inputs into a generation payload for the next steps.
            </div>
          </div>
        )}

        {/* STEP 4: AI Vara Agentic System */}
        {step === 3 && (
          <div className="cnpSection">
            <div className="cnpPlaceholder">
              <div className="cnpPlaceholder__head">
                <div>
                  <div className="cnpPlaceholder__title">AI Vara Agentic System</div>
                  <div className="cnpPlaceholder__sub">Mount your orchestrator UI here. You already have a generation payload ready.</div>
                </div>
                <span className="cnpTag">Agentic</span>
              </div>

              <div className="cnpPlaceholder__body">
                {generationPayload ? (
                  <Agents payload={generationPayload} />
                ) : (
                  <div className="cnpEmpty">No payload. Go back and Generate Economy first.</div>
                )}

                <div className="cnpCodeHint">
                  <div className="cnpCodeHint__title">Available payload</div>
                  <pre className="cnpCodeHint__pre">{JSON.stringify(generationPayload, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Deploy Token (Publish token contract) */}
        {step === 4 && (
          <div className="cnpSection">
            <div className="cnpPlaceholder">
              <div className="cnpPlaceholder__head">
                <div>
                  <div className="cnpPlaceholder__title">Deploy Token</div>
                  <div className="cnpPlaceholder__sub">Publish token contract</div>
                </div>
                <span className="cnpTag">Deploy</span>
              </div>

              <div className="cnpPlaceholder__body">
                {generationPayload ? (
                  <DeployToken payload={generationPayload} />
                ) : (
                  <div className="cnpEmpty">No payload. Go back and Generate Economy first.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Create Pool on RivrDEX (placeholder) */}
        {step === 5 && (
          <div className="cnpSection">
            <div className="cnpPlaceholder">
              <div className="cnpPlaceholder__head">
                <div>
                  <div className="cnpPlaceholder__title">Create Pool on RivrDEX</div>
                  <div className="cnpPlaceholder__sub">Add your pool creation + liquidity seeding component here.</div>
                </div>
               <CreatePairRiverDex/>
              </div>

              <div className="cnpPlaceholder__body">
                <div className="cnpEmpty">This area is reserved for your RivrDEX pool creation flow.</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Completed */}
        {step === 6 && (
          <div className="cnpSection">
            <div className="cnpDone">
              <div className="cnpDone__icon">
                <FiCheckCircle />
              </div>
              <div className="cnpDone__title">Setup Completed</div>
              <div className="cnpDone__sub">
                Your project has been configured and is ready to operate. You can now continue in the dashboard.
              </div>

              <div className="cnpDone__grid">
                <div className="cnpDoneCard">
                  <div className="cnpDoneCard__k">Project Type</div>
                  <div className="cnpDoneCard__v">{generationPayload?.form.projectType ?? "—"}</div>
                </div>
                <div className="cnpDoneCard">
                  <div className="cnpDoneCard__k">Launch Style</div>
                  <div className="cnpDoneCard__v">{generationPayload?.form.launchStyle ?? "—"}</div>
                </div>
                <div className="cnpDoneCard">
                  <div className="cnpDoneCard__k">Budget</div>
                  <div className="cnpDoneCard__v">${generationPayload?.form.liquidityBudget ?? "—"}</div>
                </div>
              </div>

              <div className="cnpDone__actions">
                <button className="cnpBtn cnpBtn--ghost" onClick={resetAll}>
                  Start another project
                </button>

                <a className="cnpBtn cnpBtn--primary" href="/dashboard">
                  Go to Dashboard
                  <FiArrowRight aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="cnpFooter">
          <button className="cnpBtn cnpBtn--ghost" onClick={back} disabled={step === 0}>
            <FiArrowLeft aria-hidden="true" />
            Back
          </button>

          {/* Step-specific primary action */}
          {step === 2 ? (
            <button
              className="cnpBtn cnpBtn--primary"
              onClick={generateEconomyAndGoToStep4}
              disabled={!form.description.trim()}
              title={!form.description.trim() ? "Write a description to continue" : "Save payload and continue"}
            >
              <FiZap className="cnpCta__icon" aria-hidden="true" />
              Generate Economy
            </button>
          ) : step < 6 ? (
            <button className="cnpBtn cnpBtn--primary" onClick={next} disabled={!canNext}>
              Next
              <FiArrowRight aria-hidden="true" />
            </button>
          ) : (
            <button className="cnpBtn cnpBtn--primary" onClick={resetAll}>
              Restart
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
