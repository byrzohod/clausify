/**
 * Audit logging for sensitive operations
 * In production, this should write to a dedicated audit log service or database
 */

export type AuditAction =
  | 'contract.upload'
  | 'contract.delete'
  | 'contract.analyze'
  | 'user.signup'
  | 'user.login'
  | 'user.logout'
  | 'user.plan_change'
  | 'user.delete'
  | 'payment.checkout'
  | 'payment.success'
  | 'payment.failure'
  | 'admin.action';

export interface AuditLogEntry {
  timestamp: string;
  action: AuditAction;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  success: boolean;
  error?: string;
}

/**
 * Log an audit event for sensitive operations
 * @param entry The audit log entry
 */
export function logAudit(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // In production, this should:
  // 1. Write to a dedicated audit log database table
  // 2. Send to a log aggregation service (e.g., Datadog, Splunk)
  // 3. Ensure logs cannot be tampered with

  // For now, we use structured logging
  console.log('[AUDIT]', JSON.stringify(logEntry));
}

/**
 * Helper to log a contract operation
 */
export function logContractAudit(
  action: 'contract.upload' | 'contract.delete' | 'contract.analyze',
  params: {
    userId: string;
    contractId: string;
    fileName?: string;
    success: boolean;
    error?: string;
    ipAddress?: string;
  }
): void {
  logAudit({
    action,
    userId: params.userId,
    resourceId: params.contractId,
    resourceType: 'contract',
    ipAddress: params.ipAddress,
    details: params.fileName ? { fileName: params.fileName } : undefined,
    success: params.success,
    error: params.error,
  });
}

/**
 * Helper to log a user operation
 */
export function logUserAudit(
  action: 'user.signup' | 'user.login' | 'user.logout' | 'user.plan_change' | 'user.delete',
  params: {
    userId?: string;
    email?: string;
    success: boolean;
    error?: string;
    ipAddress?: string;
    details?: Record<string, unknown>;
  }
): void {
  logAudit({
    action,
    userId: params.userId,
    resourceType: 'user',
    ipAddress: params.ipAddress,
    details: {
      email: params.email,
      ...params.details,
    },
    success: params.success,
    error: params.error,
  });
}

/**
 * Helper to log a payment operation
 */
export function logPaymentAudit(
  action: 'payment.checkout' | 'payment.success' | 'payment.failure',
  params: {
    userId: string;
    plan?: string;
    amount?: number;
    success: boolean;
    error?: string;
    stripeSessionId?: string;
    stripeCustomerId?: string;
  }
): void {
  logAudit({
    action,
    userId: params.userId,
    resourceType: 'payment',
    details: {
      plan: params.plan,
      amount: params.amount,
      stripeSessionId: params.stripeSessionId,
      stripeCustomerId: params.stripeCustomerId,
    },
    success: params.success,
    error: params.error,
  });
}
