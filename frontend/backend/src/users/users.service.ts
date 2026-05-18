import { Injectable, OnModuleInit } from '@nestjs/common';
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
}
