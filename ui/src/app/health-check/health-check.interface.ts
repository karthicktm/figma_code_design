
/**
 * Interface definition for health check.
 */

export interface HealthCheckResponse {
  database: DatabaseHealthInfo;
}

export interface DatabaseHealthInfo {
  uptime: string;
  dbSize: MemorySizeInfo;
  numberOfConnections: NumberOfConnectionsInfo;
  memory: MemorySizeInfo;
  longRunningQueries: LongRunningQueryInfo[];
  deadlocks: DeadlockInfo[];
}

export interface NumberOfConnectionsInfo {
  maxConnections: string;
  currentConnections: string;
  activeConnections: string;
}

export interface MemorySizeInfo {
  configured: string;
  used: string;
}

export interface LongRunningQueryInfo {
  pid: string;
  query: string;
  state: string;
  duration: string;
}

export interface DeadlockInfo {
  blockedPid: string;
  blockedUser: string;
  blockingPid: string;
  blockingUser: string;
  lockedDatabase: string;
  lockedTable: string;
  blockedQuery: string;
  blockingQuery: string
}