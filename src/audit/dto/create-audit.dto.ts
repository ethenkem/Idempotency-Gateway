export class CreateAuditDto {
  idempotencyKey: string;
  requestBody: any;
  responseBody?: any;
  status: 'processing' | 'completed' | 'replayed';
  ipAddress?: string;
}
