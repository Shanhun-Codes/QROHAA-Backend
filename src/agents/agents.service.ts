import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  private prisma: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    this.prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: databaseUrl,
      }),
    });
  }

  private generateSlug(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async generateUniqueSlug(firstName: string, lastName: string): Promise<string> {
    const baseSlug = this.generateSlug(firstName, lastName);
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.agent.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    return slug;
  }

  async create(createAgentDto: CreateAgentDto) {
    const slug = await this.generateUniqueSlug(
      createAgentDto.firstName,
      createAgentDto.lastName,
    );

    return this.prisma.agent.create({
      data: {
        slug,
        firstName: createAgentDto.firstName,
        lastName: createAgentDto.lastName,
        email: createAgentDto.email,
        phone: createAgentDto.phone ?? null,
        brokerageName: createAgentDto.brokerageName ?? null,
        active: createAgentDto.active ?? createAgentDto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.agent.findUnique({
      where: { id },
    });
  }

  update(id: number, updateAgentDto: UpdateAgentDto) {
    return `This action updates a #${id} agent`;
  }

  remove(id: number) {
    return `This action removes a #${id} agent`;
  }
}
