import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PublicSubmissionProtectionService } from './public-submission-protection.service';

describe('Public resource', () => {
  const transaction = {
    lead: { findFirst: jest.fn() },
    feedbackSubmission: { create: jest.fn() },
  } as any;
  const prisma = {
    agent: { findUnique: jest.fn() },
    openHouse: { findUnique: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof transaction) => unknown) =>
      callback(transaction),
    ),
  } as any;
  const submissionProtection = {
    assertAllowed: jest.fn(),
    recordSuccessfulSubmission: jest.fn(),
  } as unknown as PublicSubmissionProtectionService;
  const service = new PublicService(prisma, submissionProtection);
  const controller = new PublicController(service);

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.lead.findFirst.mockResolvedValue(null);
  });

  it('selects public agent profile fields including email', () => {
    service.findPublicAgentBySlug('michael-elder');
    expect(prisma.agent.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'michael-elder' },
        select: expect.objectContaining({ email: true }),
      }),
    );
  });

  it('returns resolved branding and sorted question DTOs for public configuration', async () => {
    prisma.agent.findUnique.mockResolvedValue({
      slug: 'michael-elder',
      firstName: 'Michael',
      lastName: 'Elder',
      email: 'michael@example.com',
      phone: '4175763487',
      brokerageName: null,
      headline: null,
      logoUrl: null,
      headshotUrl: null,
      primaryColor: null,
      secondaryColor: null,
      accentColor: null,
    });
    prisma.openHouse.findFirst.mockResolvedValue({
      publicCode: 'CODE1234',
      startsAt: new Date(),
      endsAt: new Date(),
      property: null,
      openHouseFeedbackQuestions: [
        {
          required: true,
          sortOrder: 0,
          question: {
            id: 'question-1',
            key: 'source',
            label: 'Source',
            type: 'SINGLE_SELECT',
            category: 'BUYER_PROFILE',
            options: [],
          },
        },
      ],
    });
    const result = await service.getConfigurationData(
      'michael-elder',
      'CODE1234',
    );
    expect(result.branding).toEqual({
      primaryColor: '#1E3A5F',
      secondaryColor: '#4F6F8F',
      accentColor: '#D4A853',
    });
    expect(result.agent?.email).toBe('michael@example.com');
    expect(result.feedbackForm.questions[0]).toMatchObject({
      id: 'question-1',
      required: true,
      sortOrder: 0,
    });
  });

  it('forwards all public controller lookups', () => {
    prisma.agent.findUnique.mockReturnValue({});
    prisma.openHouse.findUnique.mockReturnValue({});
    expect(controller.findAgent('michael-elder')).toEqual({});
    expect(controller.findOpenHouseByPublicCode('CODE1234')).toEqual({});
    expect(
      controller.getConfigurationData('michael-elder', 'CODE1234'),
    ).toBeInstanceOf(Promise);
  });

  it('creates a lead and linked submission from public contact and feedback data', async () => {
    prisma.openHouse.findFirst.mockResolvedValue({
      id: 'open-house-1',
      agentId: 'agent-1',
      openHouseFeedbackQuestions: [
        {
          required: false,
          questionId: 'question-1',
          question: {
            key: 'overall_appeal_rating',
            type: 'RATING',
            options: [{ value: '4' }],
          },
        },
      ],
    });
    transaction.feedbackSubmission.create.mockResolvedValue({
      id: 'submission-1',
      leadId: 'lead-1',
    });

    await expect(
      service.submitFeedback(
        'michael-elder',
        'CODE1234',
        {
          firstName: 'Jordan',
          email: 'jordan@example.com',
          feedbackAnswers: [{ questionId: 'question-1', value: '4' }],
        },
        '127.0.0.1',
      ),
    ).resolves.toMatchObject({
      message: 'Feedback submitted successfully.',
      leadAction: 'LEAD_CREATED',
    });

    expect(transaction.feedbackSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          openHouse: { connect: { id: 'open-house-1' } },
          lead: {
            create: {
              firstName: 'Jordan',
              email: 'jordan@example.com',
              agentId: 'agent-1',
            },
          },
        }),
      }),
    );
  });

  it('connects a submission to an existing lead with the same agent email', async () => {
    prisma.openHouse.findFirst.mockResolvedValue({
      id: 'open-house-1',
      agentId: 'agent-1',
      openHouseFeedbackQuestions: [
        {
          required: false,
          questionId: 'question-1',
          question: {
            key: 'overall_appeal_rating',
            type: 'RATING',
            options: [{ value: '4' }],
          },
        },
      ],
    });
    transaction.lead.findFirst.mockResolvedValue({ id: 'existing-lead-1' });
    transaction.feedbackSubmission.create.mockResolvedValue({
      id: 'submission-2',
      leadId: 'existing-lead-1',
    });

    await expect(
      service.submitFeedback(
        'public-agent',
        'CODE1234',
        {
          email: 'jordan@example.com',
          feedbackAnswers: [{ questionId: 'question-1', value: '4' }],
        },
        '127.0.0.1',
      ),
    ).resolves.toMatchObject({
      leadAction: 'LEAD_CONTACT_FOUND_AND_REUSED',
    });

    expect(transaction.feedbackSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lead: { connect: { id: 'existing-lead-1' } },
        }),
      }),
    );
  });

  it('keeps feedback but does not create a lead for visitors working with an agent', async () => {
    prisma.openHouse.findFirst.mockResolvedValue({
      id: 'open-house-1',
      agentId: 'agent-1',
      openHouseFeedbackQuestions: [
        {
          required: false,
          questionId: 'question-1',
          question: {
            key: 'working_with_agent',
            type: 'SINGLE_SELECT',
            options: [{ value: 'YES' }, { value: 'NO' }],
          },
        },
      ],
    });
    transaction.feedbackSubmission.create.mockResolvedValue({
      id: 'submission-1',
      leadId: null,
    });

    await expect(
      service.submitFeedback(
        'michael-elder',
        'CODE1234',
        {
          firstName: 'Jordan',
          email: 'jordan@example.com',
          feedbackAnswers: [{ questionId: 'question-1', value: 'YES' }],
        },
        '127.0.0.1',
      ),
    ).resolves.toMatchObject({ leadAction: 'NO_LEAD_CREATED' });

    expect(transaction.feedbackSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ lead: expect.anything() }),
      }),
    );
  });

  it('creates a lead from contact information without a name', async () => {
    prisma.openHouse.findFirst.mockResolvedValue({
      id: 'open-house-1',
      agentId: 'agent-1',
      openHouseFeedbackQuestions: [
        {
          required: false,
          questionId: 'question-1',
          question: {
            key: 'overall_appeal_rating',
            type: 'RATING',
            options: [{ value: '4' }],
          },
        },
      ],
    });
    transaction.feedbackSubmission.create.mockResolvedValue({
      id: 'submission-1',
      leadId: 'lead-1',
    });

    await service.submitFeedback(
      'michael-elder',
      'CODE1234',
      {
        email: 'jordan@example.com',
        feedbackAnswers: [{ questionId: 'question-1', value: '4' }],
      },
      '127.0.0.1',
    );

    expect(transaction.feedbackSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lead: { create: { email: 'jordan@example.com', agentId: 'agent-1' } },
        }),
      }),
    );
  });
});
