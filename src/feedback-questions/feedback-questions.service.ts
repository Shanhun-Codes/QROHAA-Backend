import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFeedbackQuestionDto } from './dto/create-feedback-question.dto';
import { UpdateFeedbackQuestionDto } from './dto/update-feedback-question.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateAgentFeedbackQuestionDto } from './dto/update-agent-feedback-question.dto';

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

  async update(id: string, dto: UpdateFeedbackQuestionDto) {
    const { options, ...question } = dto;

    return this.prisma.$transaction(async (transaction) => {
      const existingQuestion = await transaction.feedbackQuestion.findUnique({
        where: { id },
      });

      if (!existingQuestion) {
        throw new NotFoundException(`Feedback question ${id} was not found`);
      }

      if (options !== undefined) {
        await transaction.feedbackQuestionOption.deleteMany({
          where: { questionId: id },
        });
      }

      return transaction.feedbackQuestion.update({
        where: { id },
        data: {
          ...question,
          options:
            options !== undefined
              ? {
                  createMany: {
                    data: options,
                  },
                }
              : undefined,
        },
        include: {
          options: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      });
    });
  }

  async updateAgentQuestion(
    agentId: string,
    questionId: string,
    dto: UpdateAgentFeedbackQuestionDto,
  ) {
    return this.prisma.agentFeedbackQuestion.update({
      where: {
        agentId_questionId: {
          agentId,
          questionId,
        },
      },
      data: {
        active: dto.active,
        required: dto.required,
      },
      include: {
        question: {
          include: {
            options: {
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.feedbackQuestion.delete({ where: { id } });
  }
}
