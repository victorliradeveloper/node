import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventPublisherService } from '../messaging/event-publisher.service';
import { UsersService } from '../users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async create(@Body() dto: CreateOrderDto, @Req() req: any): Promise<OrderResponseDto> {
    const user = await this.usersService.findById(req.user.userId);

    const order = await this.ordersService.create(dto, user);

    this.eventPublisher.publishOrderEvent({
      eventType: 'ORDER_CREATED',
      timestamp: new Date().toISOString(),
      payload: {
        orderId: order.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        description: order.description,
        amount: Number(order.amount),
      },
    });

    return {
      id: order.id,
      description: order.description,
      amount: Number(order.amount),
      createdAt: order.createdAt,
    };
  }
}
