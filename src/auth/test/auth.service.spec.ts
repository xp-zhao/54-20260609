import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';
import { LoggerService } from '../../common/services/logger.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
  };
  let logger: {
    log: jest.Mock;
    warn: jest.Mock;
  };

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    logger = {
      log: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: LoggerService,
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully when username does not exist', async () => {
      const registerDto = {
        username: 'testuser',
        password: 'password123',
      };

      const hashedPassword = 'hashed_password';
      const createdUser = {
        id: 1,
        username: 'testuser',
        password: hashedPassword,
      };
      const savedUser = {
        ...createdUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersRepository.create.mockReturnValue(createdUser);
      usersRepository.save.mockResolvedValue(savedUser);

      const result = await service.register(registerDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(usersRepository.create).toHaveBeenCalledWith({
        username: 'testuser',
        password: hashedPassword,
      });
      expect(usersRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(savedUser);
      expect(logger.log).toHaveBeenCalled();
    });

    it('should throw ConflictException when username already exists', async () => {
      const registerDto = {
        username: 'existinguser',
        password: 'password123',
      };

      const existingUser = {
        id: 1,
        username: 'existinguser',
        password: 'hashed_password',
      };

      usersRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'existinguser' },
      });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(usersRepository.create).not.toHaveBeenCalled();
      expect(usersRepository.save).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return access token when login is successful with valid credentials', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };

      const user = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      };

      const accessToken = 'jwt_token_here';

      usersRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue(accessToken);

      const result = await service.login(loginDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        username: 'testuser',
      });
      expect(result).toEqual({ access_token: accessToken });
      expect(logger.log).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const user = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      };

      usersRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashed_password');
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
