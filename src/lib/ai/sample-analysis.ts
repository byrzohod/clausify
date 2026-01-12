import type { AnalysisResult } from '@/types';

/**
 * Sample NDA contract analysis for demo purposes
 * This allows users to see what the analysis output looks like before signing up
 */
export const SAMPLE_NDA_ANALYSIS: AnalysisResult = {
  summary:
    'This is a standard Non-Disclosure Agreement (NDA) between a company (the "Disclosing Party") and an individual or entity (the "Receiving Party"). The agreement protects confidential business information shared during discussions about a potential business relationship. The NDA is mutual, meaning both parties agree to keep each other\'s information confidential. The agreement has a 3-year term with confidentiality obligations lasting 5 years.',
  contractType: 'NDA',
  riskScore: 'MEDIUM',
  keyTerms: [
    {
      term: 'Confidentiality Period',
      value: '5 years after disclosure',
      importance: 'high',
      explanation:
        'Information must be kept confidential for 5 years, even after the agreement ends. This is longer than typical NDAs (usually 2-3 years).',
    },
    {
      term: 'Agreement Duration',
      value: '3 years',
      importance: 'medium',
      explanation:
        'The agreement remains in effect for 3 years from signing, after which no new confidential information should be shared under this agreement.',
    },
    {
      term: 'Definition of Confidential Information',
      value: 'Broadly defined to include all non-public business information',
      importance: 'high',
      explanation:
        'The definition is quite broad, covering technical, financial, and business information. This may include information you might not expect.',
    },
    {
      term: 'Permitted Disclosures',
      value: 'Need-to-know basis only',
      importance: 'medium',
      explanation:
        'You can only share information with people who need it for the business purpose, and they must also agree to confidentiality.',
    },
  ],
  obligations: [
    {
      party: 'Receiving Party',
      description: 'Must protect confidential information using reasonable care',
      deadline: 'Ongoing',
      consequence: 'Breach of contract, potential damages',
    },
    {
      party: 'Receiving Party',
      description: 'Must not disclose information to third parties without written consent',
      deadline: 'Ongoing',
      consequence: 'Injunctive relief and monetary damages',
    },
    {
      party: 'Receiving Party',
      description: 'Must return or destroy all confidential materials upon request',
      deadline: '30 days from request',
      consequence: 'Continued liability',
    },
    {
      party: 'Both Parties',
      description: 'Must provide written notice of any required legal disclosure',
      deadline: 'Promptly upon receiving legal process',
      consequence: undefined,
    },
  ],
  redFlags: [
    {
      title: 'Broad Non-Compete Implications',
      description:
        'Section 4.2 contains language that could be interpreted as restricting your ability to work with competitors, even though this is labeled as an NDA.',
      severity: 'high',
      suggestion:
        'Ask for clarification or removal of Section 4.2, or request that it explicitly exclude general industry knowledge and skills.',
      clause: 'Receiving Party agrees not to use Confidential Information to compete directly with Disclosing Party...',
    },
    {
      title: 'Extended Confidentiality Period',
      description:
        'The 5-year confidentiality period is longer than industry standard. Most NDAs have 2-3 year terms.',
      severity: 'medium',
      suggestion:
        'Consider negotiating for a shorter confidentiality period (2-3 years) unless there\'s a specific reason for the extended term.',
      clause: undefined,
    },
    {
      title: 'Vague "Reasonable Care" Standard',
      description:
        'The agreement requires "reasonable care" without defining what that means. This creates ambiguity about your obligations.',
      severity: 'low',
      suggestion:
        'Request that "reasonable care" be defined as "the same care you use for your own confidential information" for clearer expectations.',
      clause: undefined,
    },
  ],
  sections: [
    {
      title: 'Definitions',
      summary:
        'Defines key terms including what counts as "Confidential Information" and who the parties are.',
      concerns: ['Very broad definition of confidential information'],
    },
    {
      title: 'Obligations of Receiving Party',
      summary:
        'Lists what the receiving party must do to protect information, including security measures and disclosure restrictions.',
      concerns: [],
    },
    {
      title: 'Exclusions from Confidentiality',
      summary:
        'Standard exclusions for publicly known information, independently developed information, and legally required disclosures.',
      concerns: [],
    },
    {
      title: 'Term and Termination',
      summary:
        'Agreement lasts 3 years, but confidentiality obligations continue for 5 years after disclosure.',
      concerns: ['Extended confidentiality period'],
    },
    {
      title: 'Remedies',
      summary:
        'Specifies that the disclosing party can seek injunctive relief and monetary damages for breaches.',
      concerns: ['No cap on damages specified'],
    },
  ],
  parties: [
    {
      name: 'Acme Corporation',
      role: 'Disclosing Party',
      obligations: ['Identify confidential information when shared', 'Act in good faith'],
    },
    {
      name: 'Recipient (You)',
      role: 'Receiving Party',
      obligations: [
        'Protect confidential information',
        'Limit disclosure to need-to-know',
        'Return materials on request',
      ],
    },
  ],
  dates: [
    {
      description: 'Agreement effective date',
      date: 'Upon signing',
      importance: 'high',
    },
    {
      description: 'Agreement termination',
      date: '3 years from effective date',
      importance: 'medium',
    },
    {
      description: 'Confidentiality obligations end',
      date: '5 years from last disclosure',
      importance: 'high',
    },
  ],
  amounts: [
    {
      description: 'Maximum damages',
      amount: 'Not specified',
      currency: 'USD',
      frequency: 'N/A',
    },
  ],
};

/**
 * Sample Employment Contract analysis
 */
export const SAMPLE_EMPLOYMENT_ANALYSIS: AnalysisResult = {
  summary:
    'This is an at-will employment agreement for a Software Engineer position. The offer includes a base salary, equity compensation, and standard benefits. Key provisions include a 90-day probation period, standard IP assignment clause, and a 12-month non-compete. The agreement also includes a mandatory arbitration clause.',
  contractType: 'EMPLOYMENT',
  riskScore: 'MEDIUM',
  keyTerms: [
    {
      term: 'Base Salary',
      value: '$150,000 per year',
      importance: 'high',
      explanation: 'Your annual salary, paid bi-weekly. This is competitive for the role and location.',
    },
    {
      term: 'Equity',
      value: '10,000 stock options, 4-year vesting with 1-year cliff',
      importance: 'high',
      explanation:
        'You receive stock options that vest over 4 years. You get 25% after the first year, then monthly vesting.',
    },
    {
      term: 'Probation Period',
      value: '90 days',
      importance: 'medium',
      explanation:
        'During this period, either party can end employment with minimal notice. Standard practice.',
    },
    {
      term: 'Non-Compete',
      value: '12 months post-employment',
      importance: 'high',
      explanation:
        'You cannot work for competitors for 12 months after leaving. This affects your future job options.',
    },
  ],
  obligations: [
    {
      party: 'Employee',
      description: 'Assign all intellectual property created during employment',
      deadline: 'Ongoing',
      consequence: 'Breach of contract',
    },
    {
      party: 'Employee',
      description: 'Maintain confidentiality of company information',
      deadline: 'Indefinite',
      consequence: 'Legal action',
    },
    {
      party: 'Employer',
      description: 'Pay salary on bi-weekly basis',
      deadline: 'Every two weeks',
      consequence: 'Breach of contract',
    },
  ],
  redFlags: [
    {
      title: 'Broad IP Assignment',
      description:
        'The IP clause requires assignment of ALL inventions, even those created outside work hours using personal equipment.',
      severity: 'high',
      suggestion:
        'Request an exception for personal projects unrelated to the company business, developed on your own time and equipment.',
      clause: 'Employee agrees to assign all inventions, improvements, and intellectual property...',
    },
    {
      title: 'Mandatory Arbitration',
      description:
        'All disputes must go through binding arbitration. You waive your right to a jury trial or class action.',
      severity: 'medium',
      suggestion:
        'Understand that arbitration typically favors employers. Consider negotiating for the right to opt out.',
      clause: undefined,
    },
    {
      title: 'Non-Compete Enforceability',
      description:
        '12-month non-compete may be unenforceable in your state (e.g., California), but the clause is still present.',
      severity: 'medium',
      suggestion: 'Verify non-compete enforceability in your state. Request removal if unenforceable.',
      clause: undefined,
    },
  ],
  sections: [
    {
      title: 'Position and Duties',
      summary: 'Defines your role as Software Engineer with standard duties and reporting structure.',
      concerns: [],
    },
    {
      title: 'Compensation',
      summary: 'Details salary, equity, bonus structure, and benefits eligibility.',
      concerns: [],
    },
    {
      title: 'Intellectual Property',
      summary: 'Assigns all work-related IP to the company.',
      concerns: ['Very broad IP assignment clause'],
    },
    {
      title: 'Restrictive Covenants',
      summary: 'Non-compete, non-solicitation, and confidentiality provisions.',
      concerns: ['12-month non-compete', 'Broad non-solicitation'],
    },
    {
      title: 'Dispute Resolution',
      summary: 'Requires mandatory arbitration for all disputes.',
      concerns: ['Waiver of jury trial rights'],
    },
  ],
  parties: [
    {
      name: 'Tech Startup Inc.',
      role: 'Employer',
      obligations: ['Pay compensation', 'Provide benefits', 'Safe workplace'],
    },
    {
      name: 'Employee (You)',
      role: 'Employee',
      obligations: ['Perform duties', 'Assign IP', 'Maintain confidentiality', 'Honor non-compete'],
    },
  ],
  dates: [
    {
      description: 'Start date',
      date: 'February 1, 2024',
      importance: 'high',
    },
    {
      description: 'Probation period ends',
      date: '90 days from start',
      importance: 'medium',
    },
    {
      description: 'Equity cliff date',
      date: '1 year from start',
      importance: 'high',
    },
  ],
  amounts: [
    {
      description: 'Base salary',
      amount: '$150,000',
      currency: 'USD',
      frequency: 'annual',
    },
    {
      description: 'Signing bonus',
      amount: '$10,000',
      currency: 'USD',
      frequency: 'one-time',
    },
    {
      description: 'Stock options',
      amount: '10,000 shares',
      currency: 'N/A',
      frequency: '4-year vesting',
    },
  ],
};
