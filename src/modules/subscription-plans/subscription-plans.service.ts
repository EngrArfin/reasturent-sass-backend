import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  constructor(private prisma: PrismaService) {}

  async create(createSubscriptionPlanDto: CreateSubscriptionPlanDto) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { name: createSubscriptionPlanDto.name },
    });
    if (existing) {
      throw new ConflictException('Subscription plan name already exists');
    }

    return this.prisma.subscriptionPlan.create({
      data: {
        name: createSubscriptionPlanDto.name,
        type: createSubscriptionPlanDto.type,
        description: createSubscriptionPlanDto.description,
        amount: createSubscriptionPlanDto.amount,
        currency: createSubscriptionPlanDto.currency || 'USD',
        isActive: createSubscriptionPlanDto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        businesses: true,
      },
    });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }
    return plan;
  }

  async update(id: string, updateSubscriptionPlanDto: UpdateSubscriptionPlanDto) {
    await this.findOne(id);
    try {
      return await this.prisma.subscriptionPlan.update({
        where: { id },
        data: updateSubscriptionPlanDto,
      });
    } catch (e) {
      throw new ConflictException('Failed to update subscription plan (name might be taken)');
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.subscriptionPlan.delete({
      where: { id },
    });
  }
}
