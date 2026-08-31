import { Injectable } from '@nestjs/common';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

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
        phone: createAgentDto.phone,
        brokerageName: createAgentDto.brokerageName ?? null,
        headline: createAgentDto.headline ?? '',
        logoUrl: createAgentDto.logoUrl ?? '',
        headshotUrl: createAgentDto.headshotUrl ?? '',
        primaryColor: createAgentDto.primaryColor ?? '',
        secondaryColor: createAgentDto.secondaryColor ?? '',
      },
    });
  }

  findAll() {
    return this.prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
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

  private generateSlug(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async generateUniqueSlug(
    firstName: string,
    lastName: string,
  ): Promise<string> {
    const baseSlug = this.generateSlug(firstName, lastName);
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.agent.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    return slug;
  }
}
