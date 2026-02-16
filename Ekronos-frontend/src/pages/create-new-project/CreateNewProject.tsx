import { useMemo, useState } from 'react';
import { Switch } from '@base-ui-components/react/switch';
import { Select } from '@base-ui-components/react/select';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiChevronDown,
  FiCpu,
  FiDroplet,
  FiEdit3,
  FiLoader,
  FiShield,
  FiZap,
} from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { DeploymentStatus, RiskLevel, TokenomicsBlueprint } from '@/types';
import './create-new-project.css';

type StepId = 0 | 1 | 2 | 3 | 4;

type ProjectForm = {
  description: string;
  projectType: string;
  launchStyle: string;
  supplyModel: string;
  liquidityBudget: string;
  governanceEnabled: boolean;
};

type RunAgentsResponse = {
  artifacts?: Record<string, unknown>;
};

type ConfigSelectProps = {
  id: string;
  value: string;
  options: string[];
  onChange: (nextValue: string) => void;
};

const ConfigSelect = ({ id, value, options, onChange }: ConfigSelectProps) => {
  return (
    <Select.Root
      value={value}
      onValueChange={(nextValue) => {
        if (typeof nextValue === 'string') onChange(nextValue);
      }}
    >
      <Select.Trigger id={id} className="cnpSelect cnpSelectTrigger">
        <Select.Value />
        <Select.Icon className="cnpSelect__icon">
          <FiChevronDown />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={8} className="cnpSelectPos">
          <Select.Popup className="cnpSelectPopup">
            <Select.List className="cnpSelectList">
              {options.map((item) => (
                <Select.Item key={item} value={item} className="cnpSelectItem">
                  <Select.ItemText>{item}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
};

const steps = [
  { title: 'Describe', subtitle: 'Describe your product idea' },
  { title: 'Configure', subtitle: 'Token and launch settings' },
  { title: 'Generate', subtitle: 'Run AI tokenomics generation' },
  { title: 'Blueprint & Risk', subtitle: 'Review generated economy' },
  { title: 'Deploy', subtitle: 'Token and pool deployment status' },
] as const;

function clampPercent(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

function normalizeRiskLevel(input: unknown): RiskLevel {
  if (input === 'high' || input === 'medium' || input === 'low') return input;
  return 'medium';
}

function fallbackBlueprint(form: ProjectForm): TokenomicsBlueprint {
  const baseName = form.projectType === 'AI Tool' ? 'Neuron' : form.projectType;
  const tokenName = `${baseName} Token`;
  const symbol = baseName.slice(0, 3).toUpperCase();

  const isInflationary = form.supplyModel === 'Inflationary';
  const initialSupply = isInflationary ? 1_000_000 : 10_000_000;
  const concentrationRisk = form.launchStyle === 'Team Allocation' ? 76 : 49;
  const inflationRisk = isInflationary ? 71 : 34;
  const riskScore = Math.round((concentrationRisk + inflationRisk) / 2);
  const riskLevel: RiskLevel = riskScore >= 70 ? 'high' : riskScore >= 45 ? 'medium' : 'low';

  return {
    token: {
      name: tokenName,
      symbol,
      supplyModel: form.supplyModel,
      initialSupply,
    },
    allocation: [
      { bucket: 'Community Rewards', percent: 40, vestingMonths: 0 },
      { bucket: 'Liquidity', percent: 20, vestingMonths: 0 },
      { bucket: 'Treasury', percent: 20, vestingMonths: 12 },
      { bucket: 'Core Team', percent: 20, vestingMonths: 18 },
    ],
    emissions: [
      { month: 1, amount: 120_000 },
      { month: 3, amount: 95_000 },
      { month: 6, amount: 70_000 },
      { month: 12, amount: 40_000 },
    ],
    risk: {
      score: riskScore,
      level: riskLevel,
      flags: [
        isInflationary ? 'Inflation pressure during early months' : 'Supply rigidity can limit incentive tuning',
        form.launchStyle === 'Team Allocation' ? 'Team concentration may reduce trust' : 'Community-heavy allocation requires retention mechanics',
      ],
    },
    deploymentPlan: {
      vftReady: true,
      poolReady: Number(form.liquidityBudget || 0) > 0,
      notes: [
        'Validate symbol uniqueness before deploy',
        'Seed initial liquidity and verify price bounds',
      ],
    },
  };
}

function parseBlueprintFromArtifacts(artifacts: Record<string, unknown> | undefined, form: ProjectForm): TokenomicsBlueprint {
  const raw = artifacts?.blueprint as Partial<TokenomicsBlueprint> | undefined;
  if (!raw) return fallbackBlueprint(form);

  const safeAllocation = (Array.isArray(raw.allocation) ? raw.allocation : [])
    .map((a) => ({
      bucket: typeof a?.bucket === 'string' ? a.bucket : 'Unknown',
      percent: clampPercent(Number(a?.percent ?? 0)),
      vestingMonths: Number(a?.vestingMonths ?? 0),
    }))
    .filter((a) => a.percent > 0);

  const safeEmissions = (Array.isArray(raw.emissions) ? raw.emissions : [])
    .map((e) => ({
      month: Number(e?.month ?? 0),
      amount: Number(e?.amount ?? 0),
    }))
    .filter((e) => e.month > 0 && e.amount >= 0);

  const fallback = fallbackBlueprint(form);

  return {
    token: {
      name: raw.token?.name || fallback.token.name,
      symbol: raw.token?.symbol || fallback.token.symbol,
      supplyModel: raw.token?.supplyModel || fallback.token.supplyModel,
      initialSupply: Number(raw.token?.initialSupply || fallback.token.initialSupply),
    },
    allocation: safeAllocation.length ? safeAllocation : fallback.allocation,
    emissions: safeEmissions.length ? safeEmissions : fallback.emissions,
    risk: {
      score: Number(raw.risk?.score ?? fallback.risk.score),
      level: normalizeRiskLevel(raw.risk?.level),
      flags: Array.isArray(raw.risk?.flags) ? raw.risk?.flags.map(String) : fallback.risk.flags,
    },
    deploymentPlan: {
      vftReady: Boolean(raw.deploymentPlan?.vftReady ?? fallback.deploymentPlan.vftReady),
      poolReady: Boolean(raw.deploymentPlan?.poolReady ?? fallback.deploymentPlan.poolReady),
      notes: Array.isArray(raw.deploymentPlan?.notes)
        ? raw.deploymentPlan?.notes.map(String)
        : fallback.deploymentPlan.notes,
    },
  };
}

function levelClass(level: RiskLevel) {
  if (level === 'high') return 'is-high';
  if (level === 'low') return 'is-low';
  return 'is-medium';
}

export const CreateNewProject = () => {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

  const [step, setStep] = useState<StepId>(0);
  const [form, setForm] = useState<ProjectForm>({
    description: '',
    projectType: 'DeFi',
    launchStyle: 'Fair Launch',
    supplyModel: 'Fixed',
    liquidityBudget: '50000',
    governanceEnabled: true,
  });

  const [generationState, setGenerationState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [generationError, setGenerationError] = useState<string>('');
  const [blueprint, setBlueprint] = useState<TokenomicsBlueprint | null>(null);

  const [deployState, setDeployState] = useState<DeploymentStatus>({
    token: 'idle',
    pool: 'idle',
  });

  const progressPct = useMemo(() => ((step + 1) / steps.length) * 100, [step]);
  const canContinueStep0 = form.description.trim().length > 10;
  const canContinueStep1 = form.liquidityBudget.trim().length > 0;
  const canProceed =
    (step === 0 && canContinueStep0) ||
    (step === 1 && canContinueStep1) ||
    (step === 2 && generationState === 'success') ||
    step >= 3;

  async function runGeneration() {
    setGenerationState('loading');
    setGenerationError('');

    const goal = [
      `Project description: ${form.description}`,
      `Project type: ${form.projectType}`,
      `Launch style: ${form.launchStyle}`,
      `Supply model: ${form.supplyModel}`,
      `Liquidity budget: ${form.liquidityBudget} USD`,
      `Governance enabled: ${form.governanceEnabled}`,
      'Return a deployable tokenomics blueprint with risk analysis.',
    ].join('\n');

    try {
      const res = await fetch(`${API_BASE}/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, constraints: [], context: {}, preferred_agents: ['economy'] }),
      });

      if (!res.ok) {
        throw new Error(`Generation failed (${res.status})`);
      }

      const data = (await res.json()) as RunAgentsResponse;
      const normalized = parseBlueprintFromArtifacts(data.artifacts, form);
      setBlueprint(normalized);
      setGenerationState('success');
      setStep(3);
    } catch (error) {
      const fallback = fallbackBlueprint(form);
      setBlueprint(fallback);
      setGenerationState('error');
      setGenerationError(error instanceof Error ? error.message : 'Unknown generation error');
    }
  }

  async function runDeploySimulation() {
    setDeployState({ token: 'loading', pool: 'idle', message: 'Deploying token contract...' });

    await new Promise((resolve) => setTimeout(resolve, 1100));

    setDeployState({ token: 'success', pool: 'loading', message: 'Creating RivrDEX pool...' });

    await new Promise((resolve) => setTimeout(resolve, 1200));

    setDeployState({ token: 'success', pool: 'success', message: 'Deployment complete. Ready for launch.' });
  }

  function editAndRegenerate() {
    setStep(1);
    setGenerationState('idle');
    setGenerationError('');
  }

  function next() {
    if (!canProceed || step >= 4) return;
    setStep((prev) => (prev + 1) as StepId);
  }

  function back() {
    if (step === 0) return;
    setStep((prev) => (prev - 1) as StepId);
  }

  return (
    <section className="cnp">
      <header className="cnp__head">
        <div className="cnp__kicker">Creator Studio</div>
        <h1 className="cnp__title">Launch Designer</h1>
        <p className="cnp__sub">
          Create a polished token launch plan in five steps: idea, config, AI generation, blueprint review, and deploy status.
        </p>
      </header>

      <div className="cnpStepper" aria-label="Project creation steps">
        <div className="cnpStepper__bar">
          <div className="cnpStepper__barFill" style={{ width: `${progressPct}%` }} />
        </div>

        <div className="cnpStepper__row cnpStepper__row--5">
          {steps.map((s, idx) => {
            const state = idx < step ? 'complete' : idx === step ? 'active' : 'upcoming';
            return (
              <div key={s.title} className={`cnpStep cnpStep--${state}`}>
                <div className="cnpStep__dot">{idx < step ? <FiCheckCircle /> : idx + 1}</div>
                <div className="cnpStep__txt">
                  <div className="cnpStep__title">{s.title}</div>
                  <div className="cnpStep__sub">{s.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cnpCard">
        <div className="cnpCard__top">
          <div>
            <h2 className="cnpCard__title">{steps[step].title}</h2>
            <p className="cnpCard__desc">{steps[step].subtitle}</p>
          </div>
          <span className="cnpPill">Step {step + 1} / {steps.length}</span>
        </div>

        {step === 0 && (
          <div className="cnpSection">
            <Label className="cnpLabel" htmlFor="projectDescription">Project Description</Label>
            <Textarea
              id="projectDescription"
              className="cnpTextarea"
              rows={8}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Example: A community DeFi app where members earn utility tokens for healthy protocol participation and governance voting."
            />
            <p className="cnpHint">Clear utility + target audience gives stronger AI output.</p>
          </div>
        )}

        {step === 1 && (
          <div className="cnpSection cnpGrid">
            <div className="cnpField">
              <Label className="cnpLabel" htmlFor="projectType">Project Type</Label>
              <ConfigSelect
                id="projectType"
                value={form.projectType}
                options={['DeFi', 'Community', 'Game', 'RWA', 'AI Tool', 'Marketplace']}
                onChange={(projectType) => setForm((prev) => ({ ...prev, projectType }))}
              />
            </div>

            <div className="cnpField">
              <Label className="cnpLabel" htmlFor="launchStyle">Launch Style</Label>
              <ConfigSelect
                id="launchStyle"
                value={form.launchStyle}
                options={['Fair Launch', 'Team Allocation', 'Community Heavy']}
                onChange={(launchStyle) => setForm((prev) => ({ ...prev, launchStyle }))}
              />
            </div>

            <div className="cnpField">
              <Label className="cnpLabel" htmlFor="supplyModel">Supply Model</Label>
              <ConfigSelect
                id="supplyModel"
                value={form.supplyModel}
                options={['Fixed', 'Inflationary']}
                onChange={(supplyModel) => setForm((prev) => ({ ...prev, supplyModel }))}
              />
            </div>

            <div className="cnpField">
              <Label className="cnpLabel" htmlFor="liquidityBudget">Liquidity Budget (USD)</Label>
              <Input
                id="liquidityBudget"
                className="cnpInput"
                value={form.liquidityBudget}
                inputMode="numeric"
                onChange={(e) => setForm((prev) => ({ ...prev, liquidityBudget: e.target.value }))}
              />
            </div>

            <div className="cnpSwitchRow">
              <div>
                <div className="cnpToggleTitle">Governance Module</div>
                <div className="cnpToggleSub">Enable token-holder voting module by default.</div>
              </div>
              <Switch.Root
                className={`cnpSwitch ${form.governanceEnabled ? 'is-on' : ''}`}
                checked={form.governanceEnabled}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, governanceEnabled: checked }))}
                aria-label="Toggle governance module"
              >
                <Switch.Thumb className="cnpSwitch__knob" />
              </Switch.Root>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="cnpSection">
            <div className="genState">
              <div className="genState__icon">
                {generationState === 'loading' ? <FiLoader className="spin" /> : <FiCpu />}
              </div>
              <div>
                <h3>Run AI Tokenomics Generation</h3>
                <p>We generate allocation, emissions, risk scoring, and deployment notes from your prompt.</p>
              </div>
            </div>

            <div className="genActions">
              <Button
                type="button"
                className="cnpBtn cnpBtn--primary"
                onClick={runGeneration}
                disabled={generationState === 'loading'}
              >
                <FiZap />
                {generationState === 'loading' ? 'Generating...' : 'Generate Blueprint'}
              </Button>

              {generationState === 'error' && (
                <div className="genError">
                  <FiAlertCircle />
                  {generationError || 'Generation failed. Please retry.'}
                </div>
              )}

              {generationState === 'success' && <div className="genSuccess">Blueprint generated successfully.</div>}
            </div>
          </div>
        )}

        {step === 3 && blueprint && (
          <div className="cnpSection blueprint">
            <div className="bpTop">
              <div>
                <h3>{blueprint.token.name} ({blueprint.token.symbol})</h3>
                <p>{blueprint.token.supplyModel} model • Initial supply {blueprint.token.initialSupply.toLocaleString()}</p>
              </div>
              <span className={`riskBadge ${levelClass(blueprint.risk.level)}`}>
                <FiShield /> Risk {blueprint.risk.level.toUpperCase()} ({blueprint.risk.score})
              </span>
            </div>

            <div className="bpGrid">
              <div className="bpCard">
                <h4>Allocation</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Bucket</th>
                      <th>Percent</th>
                      <th>Vesting</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blueprint.allocation.map((row) => (
                      <tr key={row.bucket}>
                        <td>{row.bucket}</td>
                        <td>{row.percent}%</td>
                        <td>{row.vestingMonths}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bpCard">
                <h4>Emission Curve</h4>
                <div className="emissions">
                  {blueprint.emissions.map((point) => (
                    <div className="emRow" key={point.month}>
                      <span>M{point.month}</span>
                      <div className="emBarTrack">
                        <div
                          className="emBarFill"
                          style={{ width: `${Math.min(100, Math.round((point.amount / blueprint.emissions[0].amount) * 100))}%` }}
                        />
                      </div>
                      <span>{point.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bpCard bpCard--full">
                <h4>What to edit before deploy</h4>
                <ul>
                  {blueprint.risk.flags.map((flag) => <li key={flag}>{flag}</li>)}
                  {blueprint.deploymentPlan.notes.map((note) => <li key={note}>{note}</li>)}
                </ul>
              </div>
            </div>

            <Button type="button" className="cnpBtn cnpBtn--ghost" onClick={editAndRegenerate}>
              <FiEdit3 /> Edit & Regenerate
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="cnpSection deploy">
            <div className="deployCard">
              <h3>Deploy Status</h3>
              <p>Launch status for token contract and RivrDEX pool.</p>

              <div className="deployRows">
                <div className={`deployRow status-${deployState.token}`}>
                  <span>VFT Token</span>
                  <strong>{deployState.token}</strong>
                </div>
                <div className={`deployRow status-${deployState.pool}`}>
                  <span>RivrDEX Pool</span>
                  <strong>{deployState.pool}</strong>
                </div>
              </div>

              <div className="deployMsg">{deployState.message || 'No deployment started yet.'}</div>

              <Button
                type="button"
                className="cnpBtn cnpBtn--primary"
                onClick={runDeploySimulation}
                disabled={deployState.token === 'loading' || deployState.pool === 'loading'}
              >
                <FiDroplet />
                {deployState.token === 'loading' || deployState.pool === 'loading' ? 'Deploying...' : 'Start Deploy'}
              </Button>
            </div>
          </div>
        )}

        <div className="cnpFooter">
          <Button type="button" className="cnpBtn cnpBtn--ghost" onClick={back} disabled={step === 0}>
            <FiArrowLeft /> Back
          </Button>

          {step < 4 ? (
            <Button type="button" className="cnpBtn cnpBtn--primary" onClick={next} disabled={!canProceed}>
              Next <FiArrowRight />
            </Button>
          ) : (
            <a className="cnpBtn cnpBtn--primary" href="/dashboard/projects">
              View My Projects <FiArrowRight />
            </a>
          )}
        </div>
      </div>
    </section>
  );
};
