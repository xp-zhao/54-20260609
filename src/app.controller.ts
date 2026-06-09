import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get('favicon.ico')
  getFavicon(@Res() res: Response) {
    res.status(204).send();
  }

  @Get()
  getRoot() {
    return {
      message: 'Welcome to NestJS Auth System',
      version: '1.0.0',
      docs: '/auth',
      endpoints: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        profile: 'GET /auth/profile (protected)',
      },
    };
  }
}
