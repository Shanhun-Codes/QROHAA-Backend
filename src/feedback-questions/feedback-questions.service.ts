import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFeedbackQuestionDto } from './dto/create-feedback-question.dto';
import { UpdateFeedbackQuestionDto } from './dto/update-feedback-question.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FeedbackQuestionsService {
  constructor(private prisma: PrismaService) {}

  create(createFeedbackQuestionDto: CreateFeedbackQuestionDto) {
    const { options, ...question } = createFeedbackQuestionDto;
    return this.prisma.feedbackQuestion.create({
      data: {
        ...question,
        options: options ? { createMany: { data: options } } : undefined,
      },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  findAll() {
    return this.prisma.feedbackQuestion.findMany({
      include: { options: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { key: 'asc' },
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.feedbackQuestion.findUnique({
      where: { id },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!question)
      throw new NotFoundException(`Feedback question ${id} was not found.`);
    return question;
  }

  async update(
    id: string,
    updateFeedbackQuestionDto: UpdateFeedbackQuestionDto,
  ) {
    await this.findOne(id);
    const { options, ...question } = updateFeedbackQuestionDto;
    return this.prisma.$transaction(async (transaction) => {
      if (options)
        await transaction.feedbackQuestionOption.deleteMany({
          where: { questionId: id },
        });
      return transaction.feedbackQuestion.update({
        where: { id },
        data: {
          ...question,
          options: options ? { createMany: { data: options } } : undefined,
        },
        include: { options: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.feedbackQuestion.delete({ where: { id } });
  }
}
