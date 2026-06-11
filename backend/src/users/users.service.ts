import { Injectable, OnModuleInit, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    const count = await this.usersRepo.count();
    if (count === 0) {
      const passwordHash = await bcrypt.hash('owner123', 10);

      const owner = this.usersRepo.create({
        email: 'owner@utopiabyrim.com',
        name: 'Utopia Owner',
        role: 'owner',
        passwordHash,
      });

      await this.usersRepo.save(owner);
      console.log(
        '✅ Seeded default owner: owner@utopiabyrim.com / owner123',
      );
    }
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  async register(data: { name: string; email: string; password: string; phone?: string }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already registered.');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.usersRepo.create({
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      passwordHash,
      role: 'customer',
    });
    return this.usersRepo.save(user) as Promise<User>;
  }
}
