export type ProjectType = "DeFi" | "Community" | "Game" | "RWA" | "AI Tool" | "Marketplace"
export type LaunchStyle = "Fair Launch" | "Team Allocation" | "Community Heavy"
export type SupplyModel = "Fixed" | "Inflationary"

export interface ProjectManifest {
  id: string
  name: string
  description: string
  prompt: string
  projectType: ProjectType
  launchStyle: LaunchStyle
  supplyModel: SupplyModel
  liquidityBudget: number
  governance: boolean
  status: "draft" | "generating" | "preview" | "deploying" | "live"
  createdAt: string
  tokenomics?: TokenomicsBlueprint
  riskReport?: RiskReport
}

export interface TokenAllocation {
  label: string
  percentage: number
  color: string
}

export interface TokenomicsBlueprint {
  tokenName: string
  tokenSymbol: string
  totalSupply: number
  initialPrice: number
  allocations: TokenAllocation[]
  emissionsCurve: { month: number; supply: number }[]
  utilityDescription: string
  modules: {
    token: boolean
    treasury: boolean
    incentives: boolean
    liquidity: boolean
    governance: boolean
  }
}

export interface RiskReport {
  inflationRisk: "Low" | "Medium" | "High"
  liquidityRisk: "Low" | "Medium" | "High"
  whaleRisk: "Low" | "Medium" | "High"
  utilityGap: "Low" | "Medium" | "High"
  overallScore: number
}

export interface DeployStep {
  id: number
  title: string
  description: string
  status: "pending" | "active" | "completed" | "error"
}

export interface AnalyticsData {
  supplyHistory: { date: string; value: number }[]
  tvlHistory: { date: string; value: number }[]
  activeUsers: number
  treasuryBalance: number
  totalValueLocked: number
  marketCap: number
  tokenPrice: number
  liquidity: number
}
