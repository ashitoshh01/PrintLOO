import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return { status: 'ok', message: 'PrintLOO API is running', timestamp: new Date().toISOString() };
  }

  @Get('health')
  health() {
    return { status: 'ok', timestamp: Date.now() };
  }
}
