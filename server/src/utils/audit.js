const auditLogs = []

export const addAuditLog = (entry) => {
  const log = {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...entry,
  }

  auditLogs.unshift(log)
  return log
}

export const getAuditLogs = () => auditLogs
