import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

export const DEMO_USERS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Owen Owner',
    email: 'owner@docflow.test',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Casey Collaborator',
    email: 'collaborator@docflow.test',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Amara Engineer',
    email: 'amara.engineer@docflow.test',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Priya Reviewer',
    email: 'priya.reviewer@docflow.test',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'Noah Product',
    email: 'noah.product@docflow.test',
  },
] as const;

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.users.upsert(DEMO_USERS.map((user) => ({ ...user })), ['email']);
  }

  list() {
    return this.users.find({ order: { name: 'ASC' } });
  }

  async requireUser(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Select a demo user to continue');
    }

    const user = await this.users.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('Unknown demo user');
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.users.findOneBy({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundException('No demo user exists with that email');
    }
    return user;
  }
}
