import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { UsersService } from './users.service';

jest.mock('axios');
jest.mock('fs');
jest.mock('path');

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken('User'),
          useValue: {
            new: jest.fn().mockResolvedValue({}),
            constructor: jest.fn().mockResolvedValue({}),
            find: jest.fn(),
            findOne: jest.fn(),
            exec: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
            save: jest.fn(),
            deleteOne: jest.fn(),
          },
        },
        {
          provide: getModelToken('Avatar'),
          useValue: {
            new: jest.fn().mockResolvedValue({}),
            constructor: jest.fn().mockResolvedValue({}),
            find: jest.fn(),
            findOne: jest.fn(),
            exec: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
            save: jest.fn(),
            deleteOne: jest.fn(),
          },
        },
        {
          provide: 'RABBITMQ_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    jest
      .spyOn(fs, 'readFileSync')
      .mockImplementation(() => Buffer.from('avatar image data'));
    jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
    jest.spyOn(crypto, 'createHash').mockImplementation(
      () =>
        ({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue('mockHash'),
        }) as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
