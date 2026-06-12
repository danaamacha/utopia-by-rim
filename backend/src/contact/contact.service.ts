// src/contact/contact.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { ContactMessage, ContactMessageStatus } from './entities/contact-message.entity';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { AdminContactQueryDto } from './dto/admin-contact-query.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(ContactMessage)
    private readonly repo: Repository<ContactMessage>,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateContactMessageDto) {
    const message = this.repo.create({
      ...dto,
      status: ContactMessageStatus.NEW,
    });
    const saved = await this.repo.save(message);

    // Fire-and-forget owner notification: the message is already saved,
    // so an SMTP failure must never fail the customer's submission.
    this.mailService
      .sendContactNotification({
        name: saved.name,
        email: saved.email,
        message: saved.message,
      })
      .catch((e) =>
        this.logger.warn(`Contact notification email failed: ${e?.message ?? e}`),
      );

    return { id: saved.id, status: saved.status, createdAt: saved.createdAt };
  }

  async adminList(query: AdminContactQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<ContactMessage> = {};
    if (query.status) where.status = query.status;

    if (query.dateFrom || query.dateTo) {
      const from = query.dateFrom ? new Date(query.dateFrom) : new Date('1970-01-01');
      const to = query.dateTo ? new Date(query.dateTo) : new Date();
      where.createdAt = Between(from, to);
    }

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items,
    };
  }

  async adminGetById(id: string) {
    const msg = await this.repo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException('Contact message not found');
    return msg;
  }

  async adminUpdateStatus(id: string, dto: UpdateContactStatusDto) {
    const msg = await this.repo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException('Contact message not found');

    msg.status = dto.status;
    await this.repo.save(msg);

    return { id: msg.id, status: msg.status };
  }
}
