export enum IDEMPOTENCY_STATUSES {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export const MONGO_DB_CONNECTION_STRING = process.env.MONGO_DB_CONNECTION_STRING || 'mongodb://localhost:27017/idempotency_gateway';