import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';
import { UserRole } from '../../enums/user-role.enum';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

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

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private formatMessage(msg: any, currentUser?: any) {
    const isMe = currentUser
      ? (currentUser.userId && msg.senderId === currentUser.userId) ||
        (currentUser.role === UserRole.SUPER_ADMIN && msg.senderRole === 'super_admin') ||
        (currentUser.role === UserRole.MANAGER && msg.senderRole === 'manager')
      : false;

    return {
      id: msg.id,
      ticketId: msg.ticketId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderRole: msg.senderRole,
      senderLabel: msg.senderRole === 'super_admin' ? 'Admin' : isMe ? 'You' : msg.senderName,
      message: msg.message,
      isMe,
      time: this.formatTime(new Date(msg.createdAt)),
      createdAt: msg.createdAt,
    };
  }

  async create(createTicketDto: CreateTicketDto, user: any) {
    const businessId = this.getEffectiveBusinessId(user, createTicketDto.businessId, false);

    if (businessId) {
      const business = await this.prisma.business.findUnique({
        where: { id: businessId },
      });
      if (!business) {
        throw new NotFoundException('Business tenant not found');
      }
    }

    const title =
      createTicketDto.title?.trim() ||
      `${createTicketDto.category} - ${createTicketDto.description.slice(0, 40)}`;

    const lastSync = createTicketDto.lastSync
      ? new Date(createTicketDto.lastSync)
      : new Date();

    const ticket = await this.prisma.ticket.create({
      data: {
        title,
        category: createTicketDto.category,
        description: createTicketDto.description.trim(),
        status: 'OPEN',
        priority: createTicketDto.priority || 'MEDIUM',
        deviceId: createTicketDto.deviceId || 'RENE-POS-8821',
        softwareVersion: createTicketDto.softwareVersion || 'v2.4.1-stable',
        lastSync,
        businessId: businessId || null,
        createdById: user.userId || user.id || null,
      },
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
            name: true,
          },
        },
      },
    });

    // Auto-create initial message from the creator in the communication thread
    await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: user.userId || user.id || null,
        senderName: user.name || (user.role === UserRole.SUPER_ADMIN ? 'Admin' : 'Manager'),
        senderRole: user.role === UserRole.SUPER_ADMIN ? 'super_admin' : 'manager',
        message: createTicketDto.description.trim(),
      },
    });

    return this.findOne(ticket.id, user);
  }

  async findAll(user: any, query?: QueryTicketDto) {
    const businessId = this.getEffectiveBusinessId(user, query?.businessId, false);

    const where: any = {};
    if (businessId) {
      where.businessId = businessId;
    }

    if (query?.status && query.status.trim() !== '') {
      where.status = query.status.trim().toUpperCase();
    }

    if (query?.category && query.category.trim() !== '') {
      where.category = { contains: query.category.trim(), mode: 'insensitive' };
    }

    if (query?.search && query.search.trim() !== '') {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { deviceId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map((t) => ({
      ...t,
      lastSyncFormatted: t.lastSync ? t.lastSync.toLocaleString() : null,
      messageCount: t._count?.messages || 0,
    }));
  }

  async findOne(id: string, user: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID '${id}' not found`);
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      ticket.businessId &&
      ticket.businessId !== user.businessId
    ) {
      throw new UnauthorizedException('You can only view tickets from your own restaurant');
    }

    return {
      ...ticket,
      lastSyncFormatted: ticket.lastSync ? ticket.lastSync.toLocaleString() : null,
      messages: ticket.messages.map((m) => this.formatMessage(m, user)),
    };
  }

  async addMessage(ticketId: string, messageText: string, user: any) {
    if (!messageText || messageText.trim() === '') {
      throw new BadRequestException('Message content cannot be empty');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID '${ticketId}' not found`);
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      ticket.businessId &&
      ticket.businessId !== user.businessId
    ) {
      throw new UnauthorizedException('You can only send messages in your restaurant tickets');
    }

    const senderRole = user.role === UserRole.SUPER_ADMIN ? 'super_admin' : 'manager';
    const senderName = user.role === UserRole.SUPER_ADMIN ? 'Admin' : (user.name || 'Manager');

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: user.userId || user.id || null,
        senderName,
        senderRole,
        message: messageText.trim(),
      },
    });

    // Touch ticket updatedAt
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    return this.formatMessage(message, user);
  }

  async updateStatus(id: string, status: string, user: any) {
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const cleanStatus = status.trim().toUpperCase();

    if (!validStatuses.includes(cleanStatus)) {
      throw new BadRequestException(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID '${id}' not found`);
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      ticket.businessId &&
      ticket.businessId !== user.businessId
    ) {
      throw new UnauthorizedException('You can only modify tickets from your own restaurant');
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: { status: cleanStatus },
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto, user?: any) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID '${id}' not found`);
    }

    if (
      user &&
      user.role !== UserRole.SUPER_ADMIN &&
      ticket.businessId &&
      ticket.businessId !== user.businessId
    ) {
      throw new UnauthorizedException('You can only update tickets from your own restaurant');
    }

    return this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto,
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: string, user?: any) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID '${id}' not found`);
    }

    if (
      user &&
      user.role !== UserRole.SUPER_ADMIN &&
      ticket.businessId &&
      ticket.businessId !== user.businessId
    ) {
      throw new UnauthorizedException('You can only delete tickets from your own restaurant');
    }

    await this.prisma.ticket.delete({
      where: { id },
    });

    return {
      message: `Support ticket "${ticket.title}" deleted successfully`,
      id: ticket.id,
    };
  }
}
