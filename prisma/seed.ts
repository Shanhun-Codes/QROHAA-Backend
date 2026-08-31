import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  FeedbackQuestionType,
  PrismaClient,
} from '../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

type QuestionSeed = {
  key: string;
  label: string;
  type: FeedbackQuestionType;
  required?: boolean;
  options?: string[];
};

const ratingOptions = ['Excellent', 'Good', 'Fair', 'Poor'];

const questions: QuestionSeed[] = [
  { key: 'name', label: 'Full Name', type: 'TEXT', required: true },
  { key: 'phone', label: 'Phone Number', type: 'TEXT' },
  { key: 'email', label: 'Email Address', type: 'TEXT', required: true },
  {
    key: 'source',
    label: 'How did you hear about this open house?',
    type: 'SINGLE_SELECT',
    options: [
      'Zillow',
      'Realtor.com',
      'Social media',
      'Yard sign',
      'Friend or family',
      'Email',
      'Listing agent',
      'Other',
    ],
  },
  {
    key: 'budgetRange',
    label: 'Budget Range',
    type: 'SINGLE_SELECT',
    options: ['Under $300k', '$300k - $450k', '$450k - $600k', '$600k - $800k', '$800k+'],
  },
  {
    key: 'neighborhoods',
    label: 'Which neighborhoods interest you most?',
    type: 'TEXT',
  },
  {
    key: 'neighborhoodResident',
    label: 'Do you live in this neighborhood?',
    type: 'SINGLE_SELECT',
    options: ['Yes', 'No'],
  },
  {
    key: 'purchaseTimeline',
    label: 'When are you looking to buy?',
    type: 'SINGLE_SELECT',
    options: ['ASAP', '1-3 mo', '3-6 mo', '6+ mo', 'Just browsing'],
  },
  { key: 'Location', label: 'Location', type: 'RATING', options: ratingOptions },
  { key: 'Price', label: 'Price', type: 'RATING', options: ratingOptions },
  { key: 'FloorPlan', label: 'Floorplan', type: 'RATING', options: ratingOptions },
  { key: 'CurbAppeal', label: 'Curb Appeal', type: 'RATING', options: ratingOptions },
  { key: 'OverallAppeal', label: 'Overall Appeal', type: 'RATING', options: ratingOptions },
  {
    key: 'likedMost',
    label: 'What did you like most about this house?',
    type: 'TEXTAREA',
  },
  { key: 'likedLeast', label: 'What did you like least?', type: 'TEXTAREA' },
  {
    key: 'preQualified',
    label: 'Have you been prequalified for a mortgage?',
    type: 'SINGLE_SELECT',
    options: ['Yes', 'No', 'In progress'],
  },
  {
    key: 'workingWithAgent',
    label: 'Are you currently working with a real estate agent?',
    type: 'SINGLE_SELECT',
    options: ['Yes', 'No'],
  },
];

async function main() {
  console.log('Seeding feedback form data...');

  const agent = await prisma.agent.upsert({
    where: { slug: 'michael-elder' },
    update: {
      firstName: 'Michael',
      lastName: 'Elder',
      email: 'michael.elder@kw.com',
      phone: '4175763487',
      brokerageName: 'Keller Williams local',
      headline: 'Thank you for visiting! Honest opinions are appreciated - takes about 60 seconds.',
      logoUrl: 'KWLogo.png',
    },
    create: {
      slug: 'michael-elder',
      firstName: 'Michael',
      lastName: 'Elder',
      email: 'michael.elder@kw.com',
      phone: '4175763487',
      brokerageName: 'Keller Williams local',
      headline: 'Thank you for visiting! Honest opinions are appreciated - takes about 60 seconds.',
      logoUrl: 'KWLogo.png',
    },
  });

  await prisma.$transaction(async (transaction) => {
    for (const [sortOrder, question] of questions.entries()) {
      const savedQuestion = await transaction.feedbackQuestion.upsert({
        where: { key: question.key },
        update: {
          label: question.label,
          type: question.type,
          active: true,
        },
        create: {
          key: question.key,
          label: question.label,
          type: question.type,
        },
      });

      await transaction.feedbackQuestionOption.deleteMany({
        where: { questionId: savedQuestion.id },
      });

      if (question.options) {
        await transaction.feedbackQuestionOption.createMany({
          data: question.options.map((option, optionSortOrder) => ({
            label: option,
            value: option,
            sortOrder: optionSortOrder,
            questionId: savedQuestion.id,
          })),
        });
      }

      await transaction.agentFeedbackQuestion.upsert({
        where: {
          agentId_questionId: {
            agentId: agent.id,
            questionId: savedQuestion.id,
          },
        },
        update: { required: question.required ?? false, sortOrder },
        create: {
          agentId: agent.id,
          questionId: savedQuestion.id,
          required: question.required ?? false,
          sortOrder,
        },
      });
    }
  });

  console.log(
    `Seed complete: ${agent.firstName} ${agent.lastName} (${agent.slug}) has ${questions.length} feedback questions.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });