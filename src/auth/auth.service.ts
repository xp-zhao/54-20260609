import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoggerService } from '../common/services/logger.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const { username, password } = registerDto;

    this.logger.log('User registration started', 'AuthService', { username });

    const existingUser = await this.usersRepository.findOne({ where: { username } });
    if (existingUser) {
      this.logger.warn('Username already exists', 'AuthService', { username });
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      username,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);
    this.logger.log('User registered successfully', 'AuthService', { userId: savedUser.id, username });

    return savedUser;
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const { username, password } = loginDto;

    this.logger.log('User login started', 'AuthService', { username });

    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) {
      this.logger.warn('User not found', 'AuthService', { username });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn('Invalid password', 'AuthService', { username });
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log('User logged in successfully', 'AuthService', { userId: user.id, username });

    return { access_token: accessToken };
  }

  async getProfile(userId: number): Promise<User> {
    this.logger.log('Get user profile started', 'AuthService', { userId });

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn('User not found', 'AuthService', { userId });
    }

    this.logger.log('Get user profile completed', 'AuthService', { userId, username: user?.username });

    return user;
  }
}
