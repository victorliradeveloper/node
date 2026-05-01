import { Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventPublisherService } from '../messaging/event-publisher.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly eventPublisher: EventPublisherService) {}

  @Post('password-reset')
  @HttpCode(202)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 202, description: 'Password reset email queued' })
  requestPasswordReset(@Req() req: any) {
    const { userId, name, email } = req.user;

    this.eventPublisher.publishUserEvent({
      eventType: 'USER_PASSWORD_RESET',
      timestamp: new Date().toISOString(),
      payload: { userId, name, email },
    });

    return { message: 'Password reset email will be sent' };
  }
}
