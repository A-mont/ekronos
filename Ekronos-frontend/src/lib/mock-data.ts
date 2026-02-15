import type {
  ProjectManifest,
  TokenomicsBlueprint,
  RiskReport,
  AnalyticsData,
  DeployStep,
} from "./types"

export const mockTokenomics: TokenomicsBlueprint = {
  tokenName: "NexToken",
  tokenSymbol: "NXT",
  totalSupply: 100_000_000,
  initialPrice: 0.025,
  allocations: [
    { label: "Community Rewards", percentage: 40, color: "hsl(192, 91%, 54%)" },
    { label: "Treasury", percentage: 20, color: "hsl(160, 60%, 45%)" },
    { label: "Team", percentage: 15, color: "hsl(30, 80%, 55%)" },
    { label: "Liquidity", percentage: 15, color: "hsl(280, 65%, 60%)" },
    { label: "Advisors", percentage: 10, color: "hsl(340, 75%, 55%)" },
  ],
  emissionsCurve: Array.from({ length: 24 }, (_, i) => ({
    month: i + 1,
    supply: Math.round(100_000_000 * (1 - Math.exp((-i - 1) / 12))),
  })),
  utilityDescription:
    "NXT is used for governance voting, staking rewards, transaction fee discounts, and accessing premium platform features.",
  modules: {
    token: true,
    treasury: true,
    incentives: true,
    liquidity: true,
    governance: true,
  },
}

export const mockRiskReport: RiskReport = {
  inflationRisk: "Low",
  liquidityRisk: "Medium",
  whaleRisk: "Low",
  utilityGap: "Low",
  overallScore: 87,
}

export const mockProject: ProjectManifest = {
  id: "proj_001",
  name: "NexToken Economy",
  description: "A community-driven DeFi protocol with sustainable tokenomics.",
  prompt:
    "Create a DeFi protocol that rewards community participation with a fair launch model.",
  projectType: "DeFi",
  launchStyle: "Fair Launch",
  supplyModel: "Fixed",
  liquidityBudget: 50000,
  governance: true,
  status: "live",
  createdAt: "2026-01-15",
  tokenomics: mockTokenomics,
  riskReport: mockRiskReport,
}

export const mockProjects: ProjectManifest[] = [
  mockProject,
  {
    id: "proj_002",
    name: "GameVault",
    description: "A gaming economy with play-to-earn mechanics.",
    prompt: "Build a gaming economy with tournaments and rewards.",
    projectType: "Game",
    launchStyle: "Community Heavy",
    supplyModel: "Inflationary",
    liquidityBudget: 25000,
    governance: false,
    status: "preview",
    createdAt: "2026-02-01",
  },
  {
    id: "proj_003",
    name: "RealAsset DAO",
    description: "Tokenized real-world assets with governance.",
    prompt: "Tokenize real estate assets with fractional ownership.",
    projectType: "RWA",
    launchStyle: "Team Allocation",
    supplyModel: "Fixed",
    liquidityBudget: 100000,
    governance: true,
    status: "draft",
    createdAt: "2026-02-10",
  },
]

export const mockAnalytics: AnalyticsData = {
  supplyHistory: Array.from({ length: 30 }, (_, i) => ({
    date: `Feb ${i + 1}`,
    value: Math.round(40_000_000 + i * 800_000 + Math.random() * 500_000),
  })),
  tvlHistory: Array.from({ length: 30 }, (_, i) => ({
    date: `Feb ${i + 1}`,
    value: Math.round(500_000 + i * 35_000 + Math.random() * 20_000),
  })),
  activeUsers: 2847,
  treasuryBalance: 1_250_000,
  totalValueLocked: 2_340_000,
  marketCap: 4_500_000,
  tokenPrice: 0.045,
  liquidity: 890_000,
}

export const deploySteps: DeployStep[] = [
  {
    id: 1,
    title: "Deploy Contracts",
    description: "Deploying smart contracts to the Vara network.",
    status: "pending",
  },
  {
    id: 2,
    title: "Mint Allocations",
    description: "Minting token allocations per the tokenomics blueprint.",
    status: "pending",
  },
  {
    id: 3,
    title: "Create RivrDEX Pool",
    description: "Creating the trading pool on RivrDEX.",
    status: "pending",
  },
  {
    id: 4,
    title: "Seed Liquidity",
    description: "Seeding initial liquidity into the trading pool.",
    status: "pending",
  },
  {
    id: 5,
    title: "Optional LP Lock",
    description: "Locking liquidity provider tokens for security.",
    status: "pending",
  },
  {
    id: 6,
    title: "Activate Incentives",
    description: "Activating staking and reward incentive modules.",
    status: "pending",
  },
]

export const generationSteps = [
  "Generating Product Spec",
  "Designing Tokenomics",
  "Running Simulation",
  "Building Smart Contracts",
  "Preparing RivrDEX Launch",
]
