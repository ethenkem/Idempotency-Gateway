import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyService } from './idempotency.service';
import { Repository } from 'typeorm';
import { IdempotencyModel } from './models/idempotency.model';
import { SharedService } from '../shared/shared.service';
import { IdempotencyHelper } from './idempotency.helper';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let repository: jest.Mocked<Repository<IdempotencyModel>>;
  let sharedService: jest.Mocked<SharedService>;
  let idempotencyHelper: jest.Mocked<IdempotencyHelper>;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockShared = {
    hashRequestBody: jest.fn(),
  };

  const mockHelper = {
    waitUntilProcessingCompletes: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        { provide: getRepositoryToken(IdempotencyModel), useValue: mockRepo },
        { provide: SharedService, useValue: mockShared },
        { provide: IdempotencyHelper, useValue: mockHelper },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
    repository = module.get(getRepositoryToken(IdempotencyModel));
    sharedService = module.get(SharedService);
    idempotencyHelper = module.get(IdempotencyHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new idempotency record', async () => {
    const idempotencyKey = 'key123';
    const body = { amount: 100, currency: 'GHS' };
    const fakeRecord = {
      id: 'uuid',
      idempotencyKey,
      requestHash: 'hash',
      status: 'processing',
      responseData: null,
      statusCode: null,
      createdAt: new Date().toISOString(),
      updtedAt: new Date().toISOString(),
    } as unknown as IdempotencyModel;

    sharedService.hashRequestBody.mockReturnValue('hash');
    repository.create.mockReturnValue(fakeRecord);
    repository.save.mockResolvedValue(fakeRecord);

    const result = await service.createIdempotencyRecord(idempotencyKey, body);

    expect(sharedService.hashRequestBody).toHaveBeenCalledWith(body);
    expect(repository.create).toHaveBeenCalledWith({
      idempotencyKey,
      requestHash: 'hash',
      status: 'processing',
    });
    expect(repository.save).toHaveBeenCalledWith(fakeRecord);
    expect(result).toEqual(fakeRecord);
  });

  it('should find a record by idempotency key', async () => {
    const record = { idempotencyKey: 'key123' } as IdempotencyModel;
    repository.findOne.mockResolvedValue(record);

    const result = await service.findOneRecordByIdempotencyKey('key123');
    expect(result).toEqual(record);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { idempotencyKey: 'key123' } });
  });

  it('should throw NotFoundException if record not found by key', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOneRecordByIdempotencyKey('missing-key')).resolves.toBeNull();
  });

  it('executeOrReplay should throw NotFoundException if no record exists', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.executeOrReplay('key123', { amount: 100, currency: 'GHS' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('executeOrReplay should throw ConflictException if requestHash mismatch', async () => {
    const record = { idempotencyKey: 'key123', requestHash: 'abc', status: 'completed', responseData: '{}' } as any;
    repository.findOne.mockResolvedValue(record);
    sharedService.hashRequestBody.mockReturnValue('differentHash');

    await expect(service.executeOrReplay('key123', { amount: 100, currency: 'GHS' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('executeOrReplay should wait if status is PROCESSING', async () => {
    const record = {
      id: '1',
      idempotencyKey: 'key123',
      requestHash: 'hash',
      status: 'processing',
      responseData: '{}',
    } as any;

    repository.findOne.mockResolvedValueOnce(record); // initial lookup
    sharedService.hashRequestBody.mockReturnValue('hash');

    const processResponse = { statusCode: 200, body: { message: 'Payment processed successfully' } };
    idempotencyHelper.waitUntilProcessingCompletes.mockResolvedValue(processResponse);

    const findRecord = { ...record, status: 'completed' };
    repository.findOne.mockResolvedValueOnce(findRecord);

    const result = await service.executeOrReplay('key123', { amount: 100, currency: 'GHS' });

    expect(result).toEqual(processResponse);
    expect(idempotencyHelper.waitUntilProcessingCompletes).toHaveBeenCalledWith('1');
  });

  it('executeOrReplay should return cached response if completed', async () => {
    const record = {
      id: '1',
      idempotencyKey: 'key123',
      requestHash: 'hash',
      status: 'completed',
      statusCode: 200,
      responseData: JSON.stringify({ success: true }),
    } as any;

    repository.findOne.mockResolvedValue(record);
    sharedService.hashRequestBody.mockReturnValue('hash');

    const result = await service.executeOrReplay('key123', { amount: 100, currency: 'GHS' });

    expect(result).toEqual({
      statusCode: 200,
      headers: { 'X-Cache-Hit': 'true' },
      body: { success: true },
    });
  });
});