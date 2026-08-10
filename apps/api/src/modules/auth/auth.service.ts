import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto, SignupRole } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private otpStore = new Map<string, { otp: string; expiresAt: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async sendOtp(email: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    this.otpStore.set(email.toLowerCase(), { otp, expiresAt });

    this.logger.debug(`OTP sent to ${email}`);
    return {
      success: true,
      message: `OTP sent to ${email}`,
      devOtp: otp,
    };
  }

  async verifyOtp(email: string, otp: string) {
    if (!email || !otp) {
      throw new BadRequestException('Email and OTP are required');
    }
    const record = this.otpStore.get(email.toLowerCase());
    if (!record) {
      throw new BadRequestException('No OTP request found for this email. Please request a new OTP.');
    }
    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(email.toLowerCase());
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }
    if (record.otp !== otp) {
      throw new BadRequestException('Invalid OTP. Please check and try again.');
    }

    return { success: true, message: 'OTP verified successfully' };
  }

  async signup(dto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let shopId: string | null = null;
    if (dto.role === SignupRole.OPERATOR) {
      if (!dto.shopName || !dto.shopLocation) {
        throw new BadRequestException('Shop name and location are required for OPERATOR');
      }
      const shop = await this.prisma.shop.create({
        data: {
          name: dto.shopName,
          location: dto.shopLocation,
          latitude: dto.shopLatitude ?? null,
          longitude: dto.shopLongitude ?? null,
          contact: '', // placeholder, can be updated later
        },
      });
      shopId = shop.id;
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        shopId,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.shopId);
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, shopId: user.shopId },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.shopId);
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role, shopId: user.shopId }, ...tokens };
  }

  async refreshTokens(token: string) {
    const refreshTokenRecord = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!refreshTokenRecord || refreshTokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    
    const user = await this.prisma.user.findUnique({ where: { id: refreshTokenRecord.userId } });
    if (!user) throw new UnauthorizedException('User not found');
    
    const payload = { sub: user.id, email: user.email, role: user.role, shopId: user.shopId };
    const token_ = this.jwtService.sign(payload, { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any });
    
    return { token: token_, user: { id: user.id, name: user.name, email: user.email, role: user.role, shopId: user.shopId } };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { success: true };
  }

  private async generateTokens(userId: string, email: string, role: string, shopId: string | null = null) {
    // Clean up expired refresh tokens for this user (prevents table bloat)
    await this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });

    const payload = { sub: userId, email, role, shopId: shopId || null };
    const token = this.jwtService.sign(payload, { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any });
    const refreshTokenString = this.jwtService.sign({ sub: userId }, { secret: process.env.JWT_REFRESH_SECRET || 'refresh', expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any });

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshTokenString,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { token, refreshToken: refreshTokenString };
  }
}
