import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsBoolean,
} from 'class-validator';

export enum PaymentMethod {
  ONLINE = 'ONLINE',
  CARD = 'CARD',
  CASH = 'CASH',
}

export enum OnlineProvider {
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  ROCKET = 'ROCKET',
  UPAY = 'UPAY',
}

export enum CardType {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  AMEX = 'AMEX',
}

export class CashierCheckoutDto {
  @ApiProperty({
    description: 'Table ID or Table Number being billed',
    example: '1',
  })
  @IsNotEmpty()
  tableId: string;

  @ApiPropertyOptional({
    description: 'Existing Order ID if table is already billed',
    example: 'e3b8b1a8-8f8e-4a4b-8c8d-1e2f3a4b5c6d',
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Selected payment method tab',
    example: PaymentMethod.ONLINE,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    enum: OnlineProvider,
    description: 'Selected mobile banking provider (for ONLINE tab)',
    example: OnlineProvider.BKASH,
  })
  @IsOptional()
  @IsEnum(OnlineProvider)
  onlineProvider?: OnlineProvider;

  @ApiPropertyOptional({
    enum: CardType,
    description: 'Selected card type (for CARD tab)',
    example: CardType.VISA,
  })
  @IsOptional()
  @IsEnum(CardType)
  cardType?: CardType;

  @ApiPropertyOptional({
    description: 'Transaction ID entered by cashier (TrxID for bKash/Nagad etc.)',
    example: '9J7A8K2',
  })
  @IsOptional()
  @IsString()
  trxId?: string;

  @ApiProperty({
    description: 'Total bill amount to charge',
    example: 17.49,
  })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({
    description: 'Discount percentage applied (0, 5, 10, 15 etc.)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional({
    description: 'Tendered cash received from customer (for CASH tab)',
    example: 20.0,
  })
  @IsOptional()
  @IsNumber()
  tenderedCash?: number;

  @ApiPropertyOptional({
    description: 'Calculated change amount due to customer',
    example: 2.51,
  })
  @IsOptional()
  @IsNumber()
  changeDue?: number;

  @ApiPropertyOptional({
    description: 'Print Customer Receipt flag',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  printReceipt?: boolean;
}
