import { PROPERTY_DEPS_METADATA } from "@nestjs/common/constants";

export enum IDEMPOTENCY_STATUSES  {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
};
