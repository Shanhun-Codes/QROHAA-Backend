import { Injectable } from '@nestjs/common';
import { CreateFeedbackSubmissionDto } from './dto/create-feedback-submission.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FeedbackSubmissionService {
  constructor(private readonly prisma: PrismaService) {}

  create(createFeedbackSubmissionDto: CreateFeedbackSubmissionDto) {
    return this.prisma.feedbackSubmission.create({
      data: {
        openHouseId: createFeedbackSubmissionDto.openHouseId,
        feedbackAnswers: {
          create: createFeedbackSubmissionDto.feedbackAnswers,
        },
      },
    });
  }

  async findAll() {
    const submissions = await this.prisma.feedbackSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        feedbackAnswers: {
          include: {
            question: true,
          },
        },
      },
    });

    return submissions.map(({ feedbackAnswers, ...submission }) => ({
      ...submission,
      questions: feedbackAnswers.map((answer) => ({
        id: answer.question.id,
        key: answer.question.key,
        label: answer.question.label,
        type: answer.question.type,
        answer: answer.value,
      })),
    }));
  }

  async findOne(id: string) {
    const submission = await this.prisma.feedbackSubmission.findUnique({
      where: { id },
      include: {
        feedbackAnswers: {
          include: { question: true },
        },
      },
    });

    if (!submission) return null;

    const { feedbackAnswers, ...submissionData } = submission;
    return {
      ...submissionData,
      questions: feedbackAnswers.map((answer) => ({
        id: answer.question.id,
        key: answer.question.key,
        label: answer.question.label,
        type: answer.question.type,
        answer: answer.value,
      })),
    };
  }
}
