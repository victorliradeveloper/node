import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'CRUD API com NestJS e TypeORM',
      version: '1.0.0',
      endpoints: {
        users: '/api/users',
        health: '/api/health'
      }
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}
