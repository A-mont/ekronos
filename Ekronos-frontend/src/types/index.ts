import { FunctionComponent, SVGProps } from 'react';

// in case Object.entries return value is immutable
// ref: https://stackoverflow.com/a/60142095
type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

type SVGComponent = FunctionComponent<
  SVGProps<SVGSVGElement> & {
    title?: string | undefined;
  }
>;

export type RiskLevel = 'low' | 'medium' | 'high';

export type AllocationItem = {
  bucket: string;
  percent: number;
  vestingMonths: number;
};

export type EmissionPoint = {
  month: number;
  amount: number;
};

export type RiskScore = {
  score: number;
  level: RiskLevel;
  flags: string[];
};

export type DeploymentStatus = {
  token: 'idle' | 'loading' | 'success' | 'error';
  pool: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
};

export type TokenomicsBlueprint = {
  token: {
    name: string;
    symbol: string;
    supplyModel: string;
    initialSupply: number;
  };
  allocation: AllocationItem[];
  emissions: EmissionPoint[];
  risk: RiskScore;
  deploymentPlan: {
    vftReady: boolean;
    poolReady: boolean;
    notes: string[];
  };
};

export type { Entries, SVGComponent };
