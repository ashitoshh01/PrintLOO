import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createPayment(@Body() dto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.createRazorpayOrder(dto.orderId, user.id);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Post('webhook')
  async webhook(@Body() body: any, @Headers('x-razorpay-signature') signature: string) {
    return this.paymentsService.handleWebhook(body, signature);
  }
}
