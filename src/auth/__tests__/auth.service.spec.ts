import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';
import { LoggerService } from '../../common/services/logger.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };
  let logger: { log: jest.Mock; warn: jest.Mock; error: jest.Mock };

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
      error: jest.fn(),
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

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('正常注册：用户名未被占用时应当创建并返回新用户', async () => {
      const dto: RegisterDto = { username: 'alice', password: 'password123' };
      const hashedPassword = 'hashed_password';
      const createdUser = { username: dto.username, password: hashedPassword };
      const savedUser = { id: 1, ...createdUser };

      usersRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersRepository.create.mockReturnValue(createdUser);
      usersRepository.save.mockResolvedValue(savedUser);

      const result = await service.register(dto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { username: dto.username } });
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(usersRepository.create).toHaveBeenCalledWith({
        username: dto.username,
        password: hashedPassword,
      });
      expect(usersRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(savedUser);
    });

    it('重复用户名：应当抛出 ConflictException 且不写库', async () => {
      const dto: RegisterDto = { username: 'alice', password: 'password123' };
      usersRepository.findOne.mockResolvedValue({ id: 1, username: dto.username });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(usersRepository.create).not.toHaveBeenCalled();
      expect(usersRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('登录成功：用户存在且密码匹配时应返回 access_token', async () => {
      const dto: LoginDto = { username: 'alice', password: 'password123' };
      const user = { id: 1, username: 'alice', password: 'hashed_password' };
      const token = 'signed.jwt.token';

      usersRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue(token);

      const result = await service.login(dto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { username: dto.username } });
      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, user.password);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id, username: user.username });
      expect(result).toEqual({ access_token: token });
    });

    it('密码错误：bcrypt.compare 返回 false 时应抛出 UnauthorizedException', async () => {
      const dto: LoginDto = { username: 'alice', password: 'wrong_password' };
      const user = { id: 1, username: 'alice', password: 'hashed_password' };

      usersRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, user.password);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});
