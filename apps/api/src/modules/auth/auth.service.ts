import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto, SignupRole } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    let shopId: string | null = null;
    if (dto.role === SignupRole.OPERATOR) {
      if (!dto.shopName || !dto.shopLocation) {
        throw new BadRequestException('Shop name and location are required for OPERATOR');
      }
      const shop = await this.prisma.shop.create({
        data: {
          name: dto.shopName,
          location: dto.shopLocation,
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

    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: { id: user.id, email: user.email, role: user.role, shopId: user.shopId }, ...tokens };
  }

  async refreshTokens(userId: string, token: string) {
    const refreshTokenRecord = await this.prisma.refreshToken.findUnique({ where: { token } });
    if (!refreshTokenRecord || refreshTokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    
    // In MVP just generate a new access token for the given user, skip checking rotation limits
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any });
    
    return { accessToken };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { success: true };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any });
    const refreshTokenString = this.jwtService.sign({ sub: userId }, { secret: process.env.JWT_REFRESH_SECRET || 'refresh', expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any });

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshTokenString,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken: refreshTokenString };
  }
}
