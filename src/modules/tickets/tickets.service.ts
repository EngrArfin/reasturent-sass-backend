import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(createTicketDto: CreateTicketDto) {
    if (createTicketDto.businessId) {
      const business = await this.prisma.business.findUnique({
        where: { id: createTicketDto.businessId },
      });
      if (!business) {
        throw new NotFoundException('Business not found');
      }
    }

    return this.prisma.ticket.create({
      data: {
        title: createTicketDto.title,
        status: 'OPEN',
        businessId: createTicketDto.businessId || null,
      },
      include: {
        business: true,
      },
    });
  }

  async findAll() {
    return this.prisma.ticket.findMany({
      include: {
        business: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        business: true,
      },
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    await this.findOne(id);
    return this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto,
      include: {
        business: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.ticket.delete({
      where: { id },
    });
  }
}
