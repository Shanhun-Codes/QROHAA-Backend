import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  FeedbackQuestionCategory,
  FeedbackQuestionType,
  PrismaClient,
  OpenHouse,
} from '../generated/prisma/client';
import fs from 'node:fs';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl,
    ssl: {
      ca: fs.readFileSync('./certs/global-bundle.pem', 'utf8'),
      rejectUnauthorized: true,
    },
  }),
});

type QuestionSeed = {
  key: string;
  label: string;
  type: FeedbackQuestionType;
  category: FeedbackQuestionCategory;
  required?: boolean;
  options?: {
    label: string;
    value: string;
  }[];
};

type AgentSeed = {
  slug: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  brokerageName?: string;
  headline?: string;
  logoUrl?: string;
  headshotUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
};

type PropertySeed = {
  id: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  listingPriceCents?: number;
};

type OpenHouseSeed = {
  publicCode: string;
  agentSlug: string;
  propertyId: string;
  startsAt: Date;
  endsAt: Date;
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
    options: [
      { label: 'Yes', value: 'YES' },
      { label: 'No', value: 'NO' },
    ],
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
  {
    key: 'location_rating',
    label: 'Location',
    type: 'RATING',
    category: 'PROPERTY_FEEDBACK',
    options: ratingOptions,
  },
  {
    key: 'price_rating',
    label: 'Price',
    type: 'RATING',
    category: 'PROPERTY_FEEDBACK',
    options: ratingOptions,
  },
  {
    key: 'floor_plan_rating',
    label: 'Floorplan',
    type: 'RATING',
    category: 'PROPERTY_FEEDBACK',
    options: ratingOptions,
  },
  {
    key: 'curb_appeal_rating',
    label: 'Curb Appeal',
    type: 'RATING',
    category: 'PROPERTY_FEEDBACK',
    options: ratingOptions,
  },
  {
    key: 'overall_appeal_rating',
    label: 'Overall Appeal',
    type: 'RATING',
    category: 'PROPERTY_FEEDBACK',
    options: ratingOptions,
  },
  {
    key: 'liked_most',
    label: 'What did you like most about this house?',
    type: 'TEXTAREA',
    category: 'PROPERTY_FEEDBACK',
  },
  {
    key: 'liked_least',
    label: 'What did you like least?',
    type: 'TEXTAREA',
    category: 'PROPERTY_FEEDBACK',
  },
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
    options: [
      { label: 'Yes', value: 'YES' },
      { label: 'No', value: 'NO' },
    ],
  },
];

const agents: AgentSeed[] = [
  {
    slug: 'michael-elder',
    firstName: 'Michael',
    lastName: 'Elder',
    email: 'michael.elder@kw.com',
    phone: '4175763487',
    brokerageName: 'Keller Williams local',
    headline:
      'Thank you for visiting! Honest opinions are appreciated - takes about 60 seconds.',
    logoUrl: 'KWLogo.png',
    headshotUrl: 'michael-elder-headshot.PNG',
    primaryColor: '#0A0A0A',
    secondaryColor: '#7F1D1D',
    accentColor: '#DC2626',
  },
  {
    slug: 'angular-tester1',
    firstName: 'Angular',
    lastName: 'Tester1',
    email: 'angular.tester1.qa@example.com',
    phone: '4175550102',
    brokerageName: 'QA Realty',
    headline: 'QA test agent for development and automated testing.',
    primaryColor: '#1F2937',
    secondaryColor: '#FFFFFF',
  },
];

const properties: PropertySeed[] = [
  {
    id: 'qa-property-michael-sunshine-001',
    street: '1949 E Sunshine St',
    street2: '',
    city: 'Springfield',
    state: 'MO',
    zip: '65804',
    listingPriceCents: 35000000,
  },
  {
    id: 'qa-property-downtown-001',
    street: '310 N Jefferson Ave',
    street2: 'Apt 126',
    city: 'Springfield',
    state: 'MO',
    zip: '65806',
    listingPriceCents: 35000000,
  },
  {
    id: 'qa-property-southside-002',
    street: '2201 S Campbell Ave',
    city: 'Springfield',
    state: 'MO',
    zip: '65807',
    listingPriceCents: 42500000,
  },
  {
    id: 'qa-property-eastside-003',
    street: '1850 E Sunshine St',
    city: 'Springfield',
    state: 'MO',
    zip: '65804',
    listingPriceCents: 57500000,
  },
  {
    id: 'qa-property-premium-004',
    street: '4100 S Fremont Ave',
    city: 'Springfield',
    state: 'MO',
    zip: '65804',
    listingPriceCents: 82500000,
  },
];

const openHouses: OpenHouseSeed[] = [
  // Michael local configuration mirrored into QA.
  {
    publicCode: 'RE7VW854',
    agentSlug: 'michael-elder',
    propertyId: 'qa-property-michael-sunshine-001',
    startsAt: new Date('2026-08-31T13:00:00.000Z'),
    endsAt: new Date('2026-08-31T15:00:00.000Z'),
  },

  // Existing Michael QA test URL.
  {
    publicCode: '65TMX6HF',
    agentSlug: 'michael-elder',
    propertyId: 'qa-property-downtown-001',
    startsAt: new Date('2026-09-05T15:00:00.000Z'),
    endsAt: new Date('2026-09-05T18:00:00.000Z'),
  },

  // Angular tester current/future QA open house.
  {
    publicCode: 'ANGQA001',
    agentSlug: 'angular-tester1',
    propertyId: 'qa-property-southside-002',
    startsAt: new Date('2026-09-06T17:00:00.000Z'),
    endsAt: new Date('2026-09-06T20:00:00.000Z'),
  },

  // Second future open house for list testing.
  {
    publicCode: 'ANGQA002',
    agentSlug: 'angular-tester1',
    propertyId: 'qa-property-eastside-003',
    startsAt: new Date('2026-09-12T16:00:00.000Z'),
    endsAt: new Date('2026-09-12T19:00:00.000Z'),
  },

  // Past open house for history/filter testing.
  {
    publicCode: 'ANGPAST1',
    agentSlug: 'angular-tester1',
    propertyId: 'qa-property-premium-004',
    startsAt: new Date('2026-08-15T16:00:00.000Z'),
    endsAt: new Date('2026-08-15T19:00:00.000Z'),
  },
];

async function seedAgents() {
  console.log('Seeding agents...');

  const savedAgents = new Map<
    string,
    Awaited<ReturnType<typeof prisma.agent.upsert>>
  >();

  for (const agent of agents) {
    const savedAgent = await prisma.agent.upsert({
      where: {
        slug: agent.slug,
      },
      update: {
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        phone: agent.phone,
        brokerageName: agent.brokerageName,
        headline: agent.headline,
        logoUrl: agent.logoUrl,
        headshotUrl: agent.headshotUrl,
        primaryColor: agent.primaryColor,
        secondaryColor: agent.secondaryColor,
        accentColor: agent.accentColor,
      },
      create: agent,
    });

    savedAgents.set(agent.slug, savedAgent);

    console.log(`  ✓ ${savedAgent.slug}`);
  }

  return savedAgents;
}

async function seedProperties() {
  console.log('Seeding properties...');

  for (const property of properties) {
    await prisma.property.upsert({
      where: {
        id: property.id,
      },
      update: {
        street: property.street,
        street2: property.street2,
        city: property.city,
        state: property.state,
        zip: property.zip,
        listingPriceCents: property.listingPriceCents,
      },
      create: property,
    });

    console.log(`  ✓ ${property.street}`);
  }
}

async function seedQuestions() {
  console.log('Seeding feedback questions...');

  await prisma.feedbackQuestion.updateMany({
    where: {
      key: {
        in: legacyQuestionKeys,
      },
    },
    data: {
      active: false,
    },
  });

  const savedQuestions = new Map<
    string,
    Awaited<ReturnType<typeof prisma.feedbackQuestion.upsert>>
  >();

  for (const question of questions) {
    const savedQuestion = await prisma.feedbackQuestion.upsert({
      where: {
        key: question.key,
      },
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
        active: true,
      },
    });

    await prisma.feedbackQuestionOption.deleteMany({
      where: {
        questionId: savedQuestion.id,
      },
    });

    if (question.options?.length) {
      await prisma.feedbackQuestionOption.createMany({
        data: question.options.map((option, sortOrder) => ({
          questionId: savedQuestion.id,
          label: option.label,
          value: option.value,
          sortOrder,
        })),
      });
    }

    savedQuestions.set(question.key, savedQuestion);

    console.log(`  ✓ ${question.key}`);
  }

  return savedQuestions;
}

async function seedOpenHouses(
  savedAgents: Map<string, Awaited<ReturnType<typeof prisma.agent.upsert>>>,
) {
  console.log('Seeding open houses...');

  const savedOpenHouses: OpenHouse[] = [];

  for (const openHouse of openHouses) {
    const agent = savedAgents.get(openHouse.agentSlug);

    if (!agent) {
      throw new Error(`Unable to find seeded agent "${openHouse.agentSlug}".`);
    }

    const savedOpenHouse = await prisma.openHouse.upsert({
      where: {
        publicCode: openHouse.publicCode,
      },
      update: {
        agentId: agent.id,
        propertyId: openHouse.propertyId,
        startsAt: openHouse.startsAt,
        endsAt: openHouse.endsAt,
      },
      create: {
        publicCode: openHouse.publicCode,
        agentId: agent.id,
        propertyId: openHouse.propertyId,
        startsAt: openHouse.startsAt,
        endsAt: openHouse.endsAt,
      },
    });

    savedOpenHouses.push(savedOpenHouse);

    console.log(`  ✓ ${openHouse.publicCode} (${openHouse.agentSlug})`);
  }

  return savedOpenHouses;
}

async function seedQuestionAssignments(
  savedAgents: Map<string, Awaited<ReturnType<typeof prisma.agent.upsert>>>,
  savedQuestions: Map<
    string,
    Awaited<ReturnType<typeof prisma.feedbackQuestion.upsert>>
  >,
  savedOpenHouses: Awaited<ReturnType<typeof seedOpenHouses>>,
) {
  console.log('Assigning feedback questions...');

  await prisma.$transaction(
    async (transaction) => {
      for (const agent of savedAgents.values()) {
        await transaction.agentFeedbackQuestion.deleteMany({
          where: {
            agentId: agent.id,
            question: {
              key: {
                in: legacyQuestionKeys,
              },
            },
          },
        });

        for (const [sortOrder, questionSeed] of questions.entries()) {
          const question = savedQuestions.get(questionSeed.key);

          if (!question) {
            throw new Error(
              `Unable to find seeded question "${questionSeed.key}".`,
            );
          }

          await transaction.agentFeedbackQuestion.upsert({
            where: {
              agentId_questionId: {
                agentId: agent.id,
                questionId: question.id,
              },
            },
            update: {
              required: questionSeed.required ?? false,
              sortOrder,
            },
            create: {
              agentId: agent.id,
              questionId: question.id,
              required: questionSeed.required ?? false,
              sortOrder,
            },
          });
        }
      }

      for (const openHouse of savedOpenHouses) {
        await transaction.openHouseFeedbackQuestion.deleteMany({
          where: {
            openHouseId: openHouse.id,
            question: {
              key: {
                in: legacyQuestionKeys,
              },
            },
          },
        });

        for (const [sortOrder, questionSeed] of questions.entries()) {
          const question = savedQuestions.get(questionSeed.key);

          if (!question) {
            throw new Error(
              `Unable to find seeded question "${questionSeed.key}".`,
            );
          }

          await transaction.openHouseFeedbackQuestion.upsert({
            where: {
              openHouseId_questionId: {
                openHouseId: openHouse.id,
                questionId: question.id,
              },
            },
            update: {
              required: questionSeed.required ?? false,
              sortOrder,
            },
            create: {
              openHouseId: openHouse.id,
              questionId: question.id,
              required: questionSeed.required ?? false,
              sortOrder,
            },
          });
        }
      }
    },
    { timeout: 30000 },
  );

  console.log('  ✓ Agent question configurations');
  console.log('  ✓ Open house question configurations');
}

async function main() {
  console.log('');
  console.log('========================================');
  console.log(' QROHAA QA DATABASE SEED');
  console.log('========================================');
  console.log('');

  const savedAgents = await seedAgents();

  await seedProperties();

  const savedQuestions = await seedQuestions();

  const savedOpenHouses = await seedOpenHouses(savedAgents);

  await seedQuestionAssignments(savedAgents, savedQuestions, savedOpenHouses);

  console.log('');
  console.log('========================================');
  console.log(' QA SEED COMPLETE');
  console.log('========================================');
  console.log('');
  console.log(`Agents:       ${savedAgents.size}`);
  console.log(`Properties:   ${properties.length}`);
  console.log(`Open houses:  ${savedOpenHouses.length}`);
  console.log(`Questions:    ${savedQuestions.size}`);
  console.log('');
  console.log('Test URLs:');
  console.log('');
  console.log('Agent:');
  console.log('  /public/agents/michael-elder');
  console.log('  /public/agents/angular-tester1');
  console.log('');
  console.log('Open houses:');
  console.log(
    '  /public/agents/michael-elder/open-houses/RE7VW854/configuration',
  );
  console.log(
    '  /public/agents/michael-elder/open-houses/65TMX6HF/configuration',
  );
  console.log(
    '  /public/agents/angular-tester1/open-houses/ANGQA001/configuration',
  );
  console.log(
    '  /public/agents/angular-tester1/open-houses/ANGQA002/configuration',
  );
  console.log(
    '  /public/agents/angular-tester1/open-houses/ANGPAST1/configuration',
  );
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('');
    console.error('QA seed failed:');
    console.error(error);

    await prisma.$disconnect();

    process.exit(1);
  });
