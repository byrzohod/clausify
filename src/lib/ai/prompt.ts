export const ANALYSIS_SYSTEM_PROMPT = `You are a legal contract analysis assistant. Your job is to help non-lawyers understand contracts by explaining them in plain English.

IMPORTANT DISCLAIMER: You are not providing legal advice. You are helping users understand what their contracts say, but you are not a lawyer and your analysis should not be treated as legal advice. Users should consult a qualified attorney for legal advice.

When analyzing contracts, you should:
1. Be thorough but accessible - explain complex legal terms in simple language
2. Identify potential risks and red flags that could harm the user
3. Highlight important dates, amounts, and obligations
4. Be conservative in risk assessment - when in doubt, flag it as a concern
5. Provide actionable suggestions for negotiation where appropriate

Your analysis should be balanced and fair, considering both parties' perspectives while focusing on protecting the user's interests.`;

export const ANALYSIS_USER_PROMPT = `Please analyze the following contract and provide a comprehensive analysis in JSON format.

CONTRACT TEXT:
{CONTRACT_TEXT}

Please respond with a JSON object containing the following fields:

{
  "summary": "A 2-3 paragraph plain English summary of what this contract is about and what the user is agreeing to",
  "contractType": "One of: NDA, EMPLOYMENT, LEASE, SERVICE, FREELANCE, SALES, PARTNERSHIP, LICENSE, LOAN, OTHER",
  "riskScore": "One of: LOW, MEDIUM, HIGH - based on how favorable the terms are for the user and potential risks",
  "keyTerms": [
    {
      "term": "Name of the key term",
      "value": "The actual value or condition",
      "importance": "high/medium/low",
      "explanation": "Plain English explanation of what this means"
    }
  ],
  "obligations": [
    {
      "party": "Which party has this obligation",
      "description": "What they must do",
      "deadline": "When they must do it (if applicable)",
      "consequence": "What happens if they don't (if stated)"
    }
  ],
  "redFlags": [
    {
      "title": "Brief title of the concern",
      "description": "Explanation of why this is concerning",
      "severity": "high/medium/low",
      "suggestion": "What the user might want to negotiate or ask about",
      "clause": "Quote of the relevant clause (if applicable)"
    }
  ],
  "sections": [
    {
      "title": "Section name",
      "summary": "Plain English explanation of this section",
      "concerns": ["Any concerns specific to this section"]
    }
  ],
  "parties": [
    {
      "name": "Name of the party",
      "role": "Their role (e.g., 'Service Provider', 'Employer', 'Landlord')",
      "obligations": ["List of their main obligations"]
    }
  ],
  "dates": [
    {
      "description": "What this date represents",
      "date": "The actual date",
      "importance": "high/medium/low"
    }
  ],
  "amounts": [
    {
      "description": "What this amount is for",
      "amount": "The dollar amount",
      "currency": "USD or other currency",
      "frequency": "one-time, monthly, annual, etc."
    }
  ],
  "negotiationTips": [
    {
      "priority": "high/medium/low",
      "topic": "Brief title of what to negotiate",
      "currentTerm": "What the contract currently says",
      "suggestedChange": "What the user should ask for instead",
      "reasoning": "Why this change would benefit the user",
      "scriptSuggestion": "Sample language the user could use when negotiating"
    }
  ],
  "expirationDate": "The contract's end date or renewal date if specified (ISO 8601 format, null if not applicable)"
}

Be thorough and identify ALL significant terms, obligations, and potential concerns. If the contract is missing important provisions (like termination clauses, dispute resolution, etc.), mention that as a red flag.

For negotiation tips, focus on:
1. One-sided clauses that could be made more balanced
2. Missing protections the user should request
3. Unfavorable terms that are commonly negotiable
4. Industry-standard provisions that are missing

Respond with ONLY the JSON object, no additional text.`;

export function buildAnalysisPrompt(contractText: string): string {
  // Truncate if too long to save on API costs (50KB is sufficient for most contracts)
  const maxLength = 50000; // ~50k characters (~12,500 tokens)
  const truncatedText =
    contractText.length > maxLength
      ? contractText.substring(0, maxLength) +
        '\n\n[NOTE: Contract text was truncated at 50KB. The analysis covers the content shown above. ' +
        'For complete analysis of longer documents, consider splitting them into sections.]'
      : contractText;

  return ANALYSIS_USER_PROMPT.replace('{CONTRACT_TEXT}', truncatedText);
}
