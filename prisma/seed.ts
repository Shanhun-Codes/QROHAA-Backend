import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  FeedbackQuestionCategory,
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
  category: FeedbackQuestionCategory;
  required?: boolean;
  options?: { label: string; value: string }[];
};

const ratingOptions = [
  { label: 'Excellent', value: '4' },
  { label: 'Good', value: '3' },
  { label: 'Fair', value: '2' },
  { label: 'Poor', value: '1' },
];

const legacyQuestionKeys = [
  'name',
  'phone',
  'email',
  'budgetRange',
  'neighborhoodResident',
  'purchaseTimeline',
  'Location',
  'Price',
  'FloorPlan',
  'CurbAppeal',
  'OverallAppeal',
  'likedMost',
  'likedLeast',
  'preQualified',
  'workingWithAgent',
];

const seedPropertyId = 'seed-property-michael-elder';
const seedOpenHouseCode = '65TMX6HF';

const questions: QuestionSeed[] = [
  {
    key: 'source',
    label: 'How did you hear about this open house?',
    type: 'SINGLE_SELECT',
    category: 'BUYER_PROFILE',
    options: [
      { label: 'Zillow', value: 'ZILLOW' },
      { label: 'Realtor.com', value: 'REALTOR_COM' },
      { label: 'Social media', value: 'SOCIAL_MEDIA' },
      { label: 'Yard sign', value: 'YARD_SIGN' },
      { label: 'Friend or family', value: 'FRIEND_OR_FAMILY' },
      { label: 'Email', value: 'EMAIL' },
      { label: 'Listing agent', value: 'LISTING_AGENT' },
      { label: 'Other', value: 'OTHER' },
    ],
  },
  {
    key: 'budget_range',
    label: 'Budget Range',
    type: 'SINGLE_SELECT',
    category: 'BUYER_PROFILE',
    options: [
      { label: 'Under $300k', value: 'UNDER_300K' },
      { label: '$300k - $450k', value: 'FROM_300K_TO_450K' },
      { label: '$450k - $600k', value: 'FROM_450K_TO_600K' },
      { label: '$600k - $800k', value: 'FROM_600K_TO_800K' },
      { label: '$800k+', value: 'OVER_800K' },
    ],
  },
  {
    key: 'neighborhoods',
    label: 'Which neighborhoods interest you most?',
    type: 'TEXT',
    category: 'BUYER_PROFILE',
  },
  {
    key: 'neighborhood_resident',
    label: 'Do you live in this neighborhood?',
    type: 'SINGLE_SELECT',
    category: 'BUYER_PROFILE',
    options: [{ label: 'Yes', value: 'YES' }, { label: 'No', value: 'NO' }],
  },
  {
    key: 'purchase_timeline',
    label: 'When are you looking to buy?',
    type: 'SINGLE_SELECT',
    category: 'BUYER_PROFILE',
    options: [
      { label: 'ASAP', value: 'ASAP' },
      { label: '1-3 months', value: 'ONE_TO_THREE_MONTHS' },
      { label: '3-6 months', value: 'THREE_TO_SIX_MONTHS' },
      { label: '6+ months', value: 'OVER_SIX_MONTHS' },
      { label: 'Just browsing', value: 'JUST_BROWSING' },
    ],
  },
  { key: 'location_rating', label: 'Location', type: 'RATING', category: 'PROPERTY_FEEDBACK', options: ratingOptions },
  { key: 'price_rating', label: 'Price', type: 'RATING', category: 'PROPERTY_FEEDBACK', options: ratingOptions },
  { key: 'floor_plan_rating', label: 'Floorplan', type: 'RATING', category: 'PROPERTY_FEEDBACK', options: ratingOptions },
  { key: 'curb_appeal_rating', label: 'Curb Appeal', type: 'RATING', category: 'PROPERTY_FEEDBACK', options: ratingOptions },
  { key: 'overall_appeal_rating', label: 'Overall Appeal', type: 'RATING', category: 'PROPERTY_FEEDBACK', options: ratingOptions },
  {
    key: 'liked_most',
    label: 'What did you like most about this house?',
    type: 'TEXTAREA',
    category: 'PROPERTY_FEEDBACK',
  },
  { key: 'liked_least', label: 'What did you like least?', type: 'TEXTAREA', category: 'PROPERTY_FEEDBACK' },
  {
    key: 'pre_qualified',
    label: 'Have you been prequalified for a mortgage?',
    type: 'SINGLE_SELECT',
    category: 'BUYING_READINESS',
    options: [
      { label: 'Yes', value: 'YES' },
      { label: 'No', value: 'NO' },
      { label: 'In progress', value: 'IN_PROGRESS' },
    ],
  },
  {
    key: 'working_with_agent',
    label: 'Are you currently working with a real estate agent?',
    type: 'SINGLE_SELECT',
    category: 'BUYING_READINESS',
    options: [{ label: 'Yes', value: 'YES' }, { label: 'No', value: 'NO' }],
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

  const property = await prisma.property.upsert({
    where: { id: seedPropertyId },
    update: {
      street: '310 N Jefferson',
      street2: 'Apt 126',
      city: 'Springfield',
      state: 'MO',
      zip: '65806',
      listingPriceCents: 35000000,
    },
    create: {
      id: seedPropertyId,
      street: '310 N Jefferson',
      street2: 'Apt 126',
      city: 'Springfield',
      state: 'MO',
      zip: '65806',
      listingPriceCents: 35000000,
    },
  });

  const openHouse = await prisma.openHouse.upsert({
    where: { publicCode: seedOpenHouseCode },
    update: {
      startsAt: new Date('2026-08-31T13:00:00.000Z'),
      endsAt: new Date('2026-08-31T15:00:00.000Z'),
      agentId: agent.id,
      propertyId: property.id,
    },
    create: {
      publicCode: seedOpenHouseCode,
      startsAt: new Date('2026-08-31T13:00:00.000Z'),
      endsAt: new Date('2026-08-31T15:00:00.000Z'),
      agentId: agent.id,
      propertyId: property.id,
    },
  });

  await prisma.$transaction(async (transaction) => {
    await transaction.feedbackQuestion.updateMany({
      where: { key: { in: legacyQuestionKeys } },
      data: { active: false },
    });

    await transaction.agentFeedbackQuestion.deleteMany({
      where: {
        agentId: agent.id,
        question: { key: { in: legacyQuestionKeys } },
      },
    });
    await transaction.openHouseFeedbackQuestion.deleteMany({
      where: {
        openHouseId: openHouse.id,
        question: { key: { in: legacyQuestionKeys } },
      },
    });

    for (const [sortOrder, question] of questions.entries()) {
      const savedQuestion = await transaction.feedbackQuestion.upsert({
        where: { key: question.key },
        update: {
          label: question.label,
          type: question.type,
          category: question.category,
          active: true,
        },
        create: {
          key: question.key,
          label: question.label,
          type: question.type,
          category: question.category,
        },
      });

      await transaction.feedbackQuestionOption.deleteMany({
        where: { questionId: savedQuestion.id },
      });

      if (question.options) {
        await transaction.feedbackQuestionOption.createMany({
          data: question.options.map((option, optionSortOrder) => ({
            label: option.label,
            value: option.value,
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

      await transaction.openHouseFeedbackQuestion.upsert({
        where: {
          openHouseId_questionId: {
            openHouseId: openHouse.id,
            questionId: savedQuestion.id,
          },
        },
        update: { required: question.required ?? false, sortOrder },
        create: {
          openHouseId: openHouse.id,
          questionId: savedQuestion.id,
          required: question.required ?? false,
          sortOrder,
        },
      });
    }
  });

  console.log(
    `Seed complete: ${agent.firstName} ${agent.lastName} (${agent.slug}), ${property.street}, and open house ${openHouse.publicCode} have ${questions.length} feedback questions.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });