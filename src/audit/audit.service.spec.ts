import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAuditDto } from './dto/create-audit.dto';
import { PaymentAudit } from './models/audit-log.model';

describe('AuditService', () => {
  let service: AuditService;
  let auditRepo: Repository<PaymentAudit>;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(PaymentAudit),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditRepo = module.get<Repository<PaymentAudit>>(
      getRepositoryToken(PaymentAudit),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create and save an audit record', async () => {
    const dto: CreateAuditDto = {
      idempotencyKey: 'test-key',
      requestBody: { amount: 100 },
      responseBody: { message: 'Processed' },
      status: 'completed',
      ipAddress: '127.0.0.1',
    };

    const createdAudit = { ...dto, id: 1 };
    const savedAudit = { ...createdAudit };
    mockRepo.create.mockReturnValue(createdAudit);
    mockRepo.save.mockResolvedValue(savedAudit);

    const result = await service.logRequest(dto);

    // Verify repository methods called correctly
    expect(mockRepo.create).toHaveBeenCalledWith({
      idempotencyKey: dto.idempotencyKey,
      requestBody: dto.requestBody,
      responseBody: dto.responseBody,
      status: dto.status,
      ipAddress: dto.ipAddress,
    });
    expect(mockRepo.save).toHaveBeenCalledWith(createdAudit);

    // Result should be the saved entity
    expect(result).toEqual(savedAudit);
  });
});
