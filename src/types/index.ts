import type {
  User,
  Contract,
  Analysis,
  Plan,
  ContractStatus,
  AnalysisStatus,
  ContractType,
  RiskLevel,
} from '@prisma/client';

export type { User, Contract, Analysis };
export { Plan, ContractStatus, AnalysisStatus, ContractType, RiskLevel };

// Analysis result types
export interface KeyTerm {
  term: string;
  value: string;
  importance: 'high' | 'medium' | 'low';
  explanation?: string;
}

export interface Obligation {
  party: string;
  description: string;
  deadline?: string;
  consequence?: string;
}

export interface RedFlag {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestion?: string;
  clause?: string;
}

export interface ContractSection {
  title: string;
  summary: string;
  originalText?: string;
  concerns?: string[];
}

export interface Party {
  name: string;
  role: string;
  obligations?: string[];
}

export interface DateInfo {
  description: string;
  date: string;
  importance: 'high' | 'medium' | 'low';
}

export interface AmountInfo {
  description: string;
  amount: string;
  currency?: string;
  frequency?: string;
}

export interface AnalysisResult {
  summary: string;
  contractType: ContractType;
  riskScore: RiskLevel;
  keyTerms: KeyTerm[];
  obligations: Obligation[];
  redFlags: RedFlag[];
  sections: ContractSection[];
  parties: Party[];
  dates: DateInfo[];
  amounts: AmountInfo[];
}

// API types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UploadResponse {
  contractId: string;
  fileName: string;
  status: ContractStatus;
}

export interface AnalysisResponse {
  analysisId: string;
  status: AnalysisStatus;
  result?: AnalysisResult;
}

// User types
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: Plan;
  analysesUsed: number;
  analysesLimit: number;
}

// Session types
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

// Comparison types
export interface ComparisonContract {
  id: string;
  fileName: string;
  text: string;
  uploadedAt: Date;
}

export interface ComparisonState {
  left: ComparisonContract | null;
  right: ComparisonContract | null;
  isComparing: boolean;
}
