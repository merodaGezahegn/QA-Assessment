import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: any;

  const mockUser = {
    id: 1,
    name: 'QA Test User',
    email: 'qa.test@example.com',
    transactions: [],
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      preload: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.create({
        name: 'QA Test User',
        email: 'qa.test@example.com',
      });

      expect(result.statusCode).toBe(201);
      expect(result.data).toEqual(mockUser);
    });

    it('should reject duplicate email addresses', async () => {
      const duplicateError = new QueryFailedError(
        'INSERT INTO users',
        [],
        { code: '23505', message: 'Duplicate email' } as any,
      );

      repository.create.mockReturnValue(mockUser);
      repository.save.mockRejectedValue(duplicateError);

      await expect(
        service.create({
          name: 'QA Test User',
          email: 'qa.test@example.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      repository.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(mockUser);
    });

    it('should throw NotFoundException for a missing user', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const updatedUser = {
        ...mockUser,
        name: 'Updated User',
      };

      repository.preload.mockResolvedValue(updatedUser);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.update(1, {
        name: 'Updated User',
        email: 'qa.test@example.com',
      });

      expect(result.statusCode).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Updated User');
    });
  });
});

