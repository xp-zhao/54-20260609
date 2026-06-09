import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';
import { LoggerService } from '../../common/services/logger.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockUsersRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

const mockLoggerService = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = { username: 'testuser', password: 'password123' };
      const hashedPassword = 'hashed_password_123';
      const savedUser = { id: 1, username: 'testuser', password: hashedPassword };

      mockUsersRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUsersRepository.create.mockReturnValue(savedUser);
      mockUsersRepository.save.mockResolvedValue(savedUser);

      const result = await service.register(registerDto);

      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUsersRepository.create).toHaveBeenCalledWith({
        username: 'testuser',
        password: hashedPassword,
      });
      expect(mockUsersRepository.save).toHaveBeenCalledWith(savedUser);
      expect(result).toEqual(savedUser);
    });

    it('should throw ConflictException when username already exists', async () => {
      const registerDto = { username: 'existinguser', password: 'password123' };
      const existingUser = { id: 1, username: 'existinguser', password: 'old_hash' };

      mockUsersRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Username already exists'),
      );

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUsersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully and return access token', async () => {
      const loginDto = { username: 'testuser', password: 'password123' };
      const user = { id: 1, username: 'testuser', password: 'hashed_password' };
      const token = 'jwt_access_token';

      mockUsersRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        username: user.username,
      });
      expect(result).toEqual({ access_token: token });
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      const loginDto = { username: 'testuser', password: 'wrongpassword' };
      const user = { id: 1, username: 'testuser', password: 'hashed_password' };

      mockUsersRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
