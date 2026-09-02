import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { UserRole } from '../../enums/user-role.enum';

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  private getEffectiveBusinessId(user: any, requestedBusinessId?: string, isRequired = false): string | undefined {
    if (user.role === UserRole.SUPER_ADMIN) {
      if (requestedBusinessId) {
        return requestedBusinessId;
      }
      if (isRequired) {
        throw new BadRequestException('businessId is required for Super Admin');
      }
      return undefined;
    }

    const businessId = user.businessId;
    if (!businessId) {
      throw new BadRequestException('Current user is not associated with any restaurant tenant');
    }
    return businessId;
  }

  private calculatePricing(minimumPrice: number, offPriceStr: string) {
    const minPrice = Math.max(0, Number(minimumPrice) || 0);
    const cleanOff = (offPriceStr || '0%').trim();
    let discountAmount = 0;

    if (cleanOff.includes('%')) {
      const percent = parseFloat(cleanOff.replace(/[^0-9.]/g, '')) || 0;
      discountAmount = (minPrice * percent) / 100;
    } else {
      discountAmount = parseFloat(cleanOff.replace(/[^0-9.]/g, '')) || 0;
    }

    discountAmount = Math.min(minPrice, Math.max(0, Number(discountAmount.toFixed(2))));
    const finalPrice = Math.max(0, Number((minPrice - discountAmount).toFixed(2)));

    return {
      minimumPrice: minPrice,
      offPrice: cleanOff,
      amountOff: discountAmount,
      finalPrice,
      originalFormatted: `$${minPrice.toFixed(2)}`,
      discountFormatted: `-$${discountAmount.toFixed(2)}`,
      finalFormatted: `$${finalPrice.toFixed(2)}`,
    };
  }

  private formatVoucher(voucher: any) {
    const minPrice = voucher.minimumPrice || 0;
    const amountOff = voucher.amountOff || 0;
    const finalPrice = voucher.finalPrice ?? Math.max(0, minPrice - amountOff);
    const requestedBy = (voucher.requestedBy || 'MANAGER').toUpperCase();

    return {
      id: voucher.id,
      name: voucher.name,
      code: voucher.code,
      minimumPrice: minPrice,
      offPrice: voucher.offPrice,
      amountOff: amountOff,
      finalPrice: finalPrice,
      requestedBy: requestedBy,
      requestedByFormatted: `REQUESTED BY ${requestedBy}`,
      originalFormatted: `$${minPrice.toFixed(2)}`,
      discountFormatted: `-$${amountOff.toFixed(2)}`,
      finalFormatted: `$${finalPrice.toFixed(2)}`,
      isActive: voucher.isActive,
      businessId: voucher.businessId,
      createdAt: voucher.createdAt,
      updatedAt: voucher.updatedAt,
    };
  }

  async create(createVoucherDto: CreateVoucherDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, createVoucherDto.businessId, true)!;

    const pricing = this.calculatePricing(
      createVoucherDto.minimumPrice,
      createVoucherDto.offPrice,
    );

    const requestedBy = (
      createVoucherDto.requestedBy?.trim() ||
      user.name ||
      'MANAGER'
    ).toUpperCase();

    // Auto-generate a readable code if not supplied
    let code = createVoucherDto.code?.trim().toUpperCase();
    if (!code) {
      const cleanName = createVoucherDto.name
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
        .slice(0, 6);
      const rand = Math.floor(100 + Math.random() * 900);
      code = `VOUCH-${cleanName || 'DISC'}-${rand}`;
    }

    const voucher = await this.prisma.voucher.create({
      data: {
        name: createVoucherDto.name.trim(),
        code,
        minimumPrice: pricing.minimumPrice,
        offPrice: pricing.offPrice,
        amountOff: pricing.amountOff,
        finalPrice: pricing.finalPrice,
        requestedBy,
        businessId,
        isActive: true,
      },
    });

    return this.formatVoucher(voucher);
  }

  async findAll(user: any, requestedBusinessId?: string, search?: string) {
    const businessId = this.getEffectiveBusinessId(user, requestedBusinessId, false);

    const where: any = {};
    if (businessId) {
      where.businessId = businessId;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { requestedBy: { contains: q, mode: 'insensitive' } },
      ];
    }

    const vouchers = await this.prisma.voucher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return vouchers.map((v) => this.formatVoucher(v));
  }

  async findOne(id: string, user: any) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with ID '${id}' not found`);
    }

    if (user.role !== UserRole.SUPER_ADMIN && voucher.businessId !== user.businessId) {
      throw new NotFoundException(`Voucher with ID '${id}' not found`);
    }

    return this.formatVoucher(voucher);
  }

  async update(id: string, updateVoucherDto: UpdateVoucherDto, user: any) {
    const existing = await this.prisma.voucher.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Voucher with ID '${id}' not found`);
    }

    if (user.role !== UserRole.SUPER_ADMIN && existing.businessId !== user.businessId) {
      throw new UnauthorizedException('You can only modify vouchers belonging to your restaurant');
    }

    const newMinPrice =
      updateVoucherDto.minimumPrice !== undefined
        ? Number(updateVoucherDto.minimumPrice)
        : existing.minimumPrice;

    const newOffPrice =
      updateVoucherDto.offPrice !== undefined
        ? updateVoucherDto.offPrice
        : existing.offPrice;

    const pricing = this.calculatePricing(newMinPrice, newOffPrice);

    const dataToUpdate: any = {
      minimumPrice: pricing.minimumPrice,
      offPrice: pricing.offPrice,
      amountOff: pricing.amountOff,
      finalPrice: pricing.finalPrice,
    };

    if (updateVoucherDto.name !== undefined) {
      dataToUpdate.name = updateVoucherDto.name.trim();
    }

    if (updateVoucherDto.requestedBy !== undefined) {
      dataToUpdate.requestedBy = updateVoucherDto.requestedBy.trim().toUpperCase();
    }

    if (updateVoucherDto.code !== undefined) {
      dataToUpdate.code = updateVoucherDto.code.trim().toUpperCase();
    }

    if (updateVoucherDto.isActive !== undefined) {
      dataToUpdate.isActive = updateVoucherDto.isActive;
    }

    const updated = await this.prisma.voucher.update({
      where: { id },
      data: dataToUpdate,
    });

    return this.formatVoucher(updated);
  }

  async remove(id: string, user: any) {
    const existing = await this.prisma.voucher.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Voucher with ID '${id}' not found`);
    }

    if (user.role !== UserRole.SUPER_ADMIN && existing.businessId !== user.businessId) {
      throw new UnauthorizedException('You can only delete vouchers belonging to your restaurant');
    }

    await this.prisma.voucher.delete({
      where: { id },
    });

    return {
      message: `Voucher "${existing.name}" deleted successfully`,
      id: existing.id,
      name: existing.name,
    };
  }
}
