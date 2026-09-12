import { PrismaPg } from '@prisma/adapter-pg';
import {
  FeedbackQuestionCategory,
  FeedbackQuestionType,
  PrismaClient,
  OpenHouse,
} from '../generated/prisma/client';
import fs from 'node:fs';

// ======================================================
// DATABASE ENVIRONMENT
// ======================================================

const databaseUrl = process.env.DATABASE_URL;
const databaseEnvironment = process.env.DATABASE_ENV ?? 'dev';

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const parsedDatabaseUrl = new URL(databaseUrl);

const isLocal =
  parsedDatabaseUrl.hostname === 'localhost' ||
  parsedDatabaseUrl.hostname === '127.0.0.1';

const isAwsRds = parsedDatabaseUrl.hostname.endsWith('.rds.amazonaws.com');

if (!['dev', 'qa'].includes(databaseEnvironment)) {
  throw new Error(
    `Unsupported DATABASE_ENV "${databaseEnvironment}". Expected "dev" or "qa".`,
  );
}

if (databaseEnvironment === 'dev' && !isLocal) {
  throw new Error(
    `DEV seed refused: expected localhost but received ${parsedDatabaseUrl.hostname}`,
  );
}

if (databaseEnvironment === 'qa' && !isAwsRds) {
  throw new Error(
    `QA seed refused: expected AWS RDS but received ${parsedDatabaseUrl.hostname}`,
  );
}

console.log(`Database environment: ${databaseEnvironment}`);
console.log(`Database host: ${parsedDatabaseUrl.hostname}`);

// ======================================================
// PRISMA
// ======================================================

const adapter = new PrismaPg({
  connectionString: databaseUrl,

  ...(isAwsRds
    ? {
        ssl: {
          ca: fs.readFileSync('./certs/global-bundle.pem', 'utf8'),
          rejectUnauthorized: true,
        },
      }
    : {}),
});

const prisma = new PrismaClient({
  adapter,
});

// ======================================================
// TYPES
// ======================================================

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
  agentSlug: string;
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

type LeadStatus =
  'NEW' | 'CONTACTED' | 'FOLLOW_UP' | 'QUALIFIED' | 'CLOSED' | 'LOST';

type LeadSeed = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  createdAt: Date;
};

// ======================================================
// QUESTION OPTIONS
// ======================================================

const ratingOptions = [
  { label: 'Excellent', value: '4' },
  { label: 'Good', value: '3' },
  { label: 'Fair', value: '2' },
  { label: 'Poor', value: '1' },
];

// ======================================================
// LEGACY QUESTIONS
// ======================================================

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

// ======================================================
// FEEDBACK QUESTIONS
// ======================================================

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

// ======================================================
// AGENTS
// ======================================================

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

// ======================================================
// PROPERTIES
// ======================================================

const properties: PropertySeed[] = [
  {
    id: 'qa-property-michael-sunshine-001',
    agentSlug: 'michael-elder',
    street: '1949 E Sunshine St',
    street2: '',
    city: 'Springfield',
    state: 'MO',
    zip: '65804',
    listingPriceCents: 35000000,
  },
  {
    id: 'qa-property-downtown-001',
    agentSlug: 'michael-elder',
    street: '310 N Jefferson Ave',
    street2: 'Apt 126',
    city: 'Springfield',
    state: 'MO',
    zip: '65806',
    listingPriceCents: 35000000,
  },
  {
    id: 'qa-property-southside-002',
    agentSlug: 'angular-tester1',
    street: '2201 S Campbell Ave',
    city: 'Springfield',
    state: 'MO',
    zip: '65807',
    listingPriceCents: 42500000,
  },
  {
    id: 'qa-property-eastside-003',
    agentSlug: 'angular-tester1',
    street: '1850 E Sunshine St',
    city: 'Springfield',
    state: 'MO',
    zip: '65804',
    listingPriceCents: 57500000,
  },
  {
    id: 'qa-property-premium-004',
    agentSlug: 'angular-tester1',
    street: '4100 S Fremont Ave',
    city: 'Springfield',
    state: 'MO',
    zip: '65804',
    listingPriceCents: 82500000,
  },
];

// ======================================================
// OPEN HOUSES
// ======================================================

const openHouses: OpenHouseSeed[] = [
  {
    publicCode: 'RE7VW854',
    agentSlug: 'michael-elder',
    propertyId: 'qa-property-michael-sunshine-001',
    startsAt: new Date('2026-08-31T13:00:00.000Z'),
    endsAt: new Date('2026-08-31T15:00:00.000Z'),
  },
  {
    publicCode: '65TMX6HF',
    agentSlug: 'michael-elder',
    propertyId: 'qa-property-downtown-001',
    startsAt: new Date('2026-09-05T15:00:00.000Z'),
    endsAt: new Date('2026-09-05T18:00:00.000Z'),
  },
  {
    publicCode: 'ANGQA001',
    agentSlug: 'angular-tester1',
    propertyId: 'qa-property-southside-002',
    startsAt: new Date('2026-09-06T17:00:00.000Z'),
    endsAt: new Date('2026-09-06T20:00:00.000Z'),
  },
  {
    publicCode: 'ANGQA002',
    agentSlug: 'angular-tester1',
    propertyId: 'qa-property-eastside-003',
    startsAt: new Date('2026-09-12T16:00:00.000Z'),
    endsAt: new Date('2026-09-12T19:00:00.000Z'),
  },
  {
    publicCode: 'ANGPAST1',
    agentSlug: 'angular-tester1',
    propertyId: 'qa-property-premium-004',
    startsAt: new Date('2026-08-15T16:00:00.000Z'),
    endsAt: new Date('2026-08-15T19:00:00.000Z'),
  },
];

// ======================================================
// MICHAEL DEV LEADS
//
// These are deliberately NOT given an agentId here.
// Michael's actual generated DB ID is resolved during the seed.
// ======================================================

const michaelDevLeads: LeadSeed[] = [
  {
    id: 'dev-lead-michael-001',
    firstName: 'Jim',
    lastName: 'Bean',
    email: 'jim.bean@example.com',
    phone: '6022223223',
    status: 'NEW',
    createdAt: new Date('2026-09-05T22:15:00.000Z'),
  },
  {
    id: 'dev-lead-michael-002',
    firstName: 'Amanda',
    lastName: 'Parker',
    email: 'amanda.parker@example.com',
    phone: '4175551002',
    status: 'NEW',
    createdAt: new Date('2026-09-05T19:42:00.000Z'),
  },
  {
    id: 'dev-lead-michael-003',
    firstName: 'Chris',
    lastName: 'Wilson',
    email: 'chris.wilson@example.com',
    phone: '4175551003',
    status: 'CONTACTED',
    createdAt: new Date('2026-09-04T20:30:00.000Z'),
  },
  {
    id: 'dev-lead-michael-004',
    firstName: 'Sarah',
    lastName: 'Miller',
    email: 'sarah.miller@example.com',
    phone: '4175551004',
    status: 'FOLLOW_UP',
    createdAt: new Date('2026-09-04T16:18:00.000Z'),
  },
  {
    id: 'dev-lead-michael-005',
    firstName: 'David',
    lastName: 'Johnson',
    email: 'david.johnson@example.com',
    phone: '4175551005',
    status: 'QUALIFIED',
    createdAt: new Date('2026-09-03T21:45:00.000Z'),
  },
  {
    id: 'dev-lead-michael-006',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@example.com',
    phone: '4175551006',
    status: 'CLOSED',
    createdAt: new Date('2026-09-03T17:11:00.000Z'),
  },
  {
    id: 'dev-lead-michael-007',
    firstName: 'Ryan',
    lastName: 'Thompson',
    email: 'ryan.thompson@example.com',
    phone: '4175551007',
    status: 'LOST',
    createdAt: new Date('2026-09-02T20:10:00.000Z'),
  },
  {
    id: 'dev-lead-michael-008',
    firstName: 'Jessica',
    lastName: 'Moore',
    email: 'jessica.moore@example.com',
    phone: '4175551008',
    status: 'NEW',
    createdAt: new Date('2026-09-02T15:35:00.000Z'),
  },
  {
    id: 'dev-lead-michael-009',
    firstName: 'Brandon',
    lastName: 'Clark',
    email: 'brandon.clark@example.com',
    phone: '4175551009',
    status: 'CONTACTED',
    createdAt: new Date('2026-09-01T22:20:00.000Z'),
  },
  {
    id: 'dev-lead-michael-010',
    firstName: 'Nicole',
    lastName: 'Lewis',
    email: 'nicole.lewis@example.com',
    phone: '4175551010',
    status: 'FOLLOW_UP',
    createdAt: new Date('2026-09-01T18:00:00.000Z'),
  },
  {
    id: 'dev-lead-michael-011',
    firstName: 'Matthew',
    lastName: 'Walker',
    email: null,
    phone: '4175551011',
    status: 'QUALIFIED',
    createdAt: new Date('2026-08-31T23:05:00.000Z'),
  },
  {
    id: 'dev-lead-michael-012',
    firstName: 'Ashley',
    lastName: 'Hall',
    email: 'ashley.hall@example.com',
    phone: null,
    status: 'NEW',
    createdAt: new Date('2026-08-31T19:26:00.000Z'),
  },
  {
    id: 'dev-lead-michael-013',
    firstName: 'Kevin',
    lastName: 'Allen',
    email: 'kevin.allen@example.com',
    phone: '4175551013',
    status: 'LOST',
    createdAt: new Date('2026-08-30T21:18:00.000Z'),
  },
  {
    id: 'dev-lead-michael-014',
    firstName: 'Rachel',
    lastName: 'Young',
    email: 'rachel.young@example.com',
    phone: '4175551014',
    status: 'NEW',
    createdAt: new Date('2026-08-30T16:45:00.000Z'),
  },
  {
    id: 'dev-lead-michael-015',
    firstName: 'Jason',
    lastName: 'King',
    email: 'jason.king@example.com',
    phone: '4175551015',
    status: 'CONTACTED',
    createdAt: new Date('2026-08-29T20:32:00.000Z'),
  },
  {
    id: 'dev-lead-michael-016',
    firstName: 'Lauren',
    lastName: 'Wright',
    email: 'lauren.wright@example.com',
    phone: '4175551016',
    status: 'FOLLOW_UP',
    createdAt: new Date('2026-08-28T18:08:00.000Z'),
  },
  {
    id: 'dev-lead-michael-017',
    firstName: 'Andrew',
    lastName: 'Scott',
    email: 'andrew.scott@example.com',
    phone: '4175551017',
    status: 'CLOSED',
    createdAt: new Date('2026-08-27T22:24:00.000Z'),
  },
  {
    id: 'dev-lead-michael-018',
    firstName: 'Megan',
    lastName: 'Green',
    email: 'megan.green@example.com',
    phone: '4175551018',
    status: 'QUALIFIED',
    createdAt: new Date('2026-08-26T16:40:00.000Z'),
  },
  {
    id: 'dev-lead-michael-019',
    firstName: 'Tyler',
    lastName: 'Baker',
    email: 'tyler.baker@example.com',
    phone: '4175551019',
    status: 'NEW',
    createdAt: new Date('2026-08-25T19:55:00.000Z'),
  },
  {
    id: 'dev-lead-michael-020',
    firstName: 'Samantha',
    lastName: 'Adams',
    email: 'samantha.adams@example.com',
    phone: '4175551020',
    status: 'CONTACTED',
    createdAt: new Date('2026-08-24T17:22:00.000Z'),
  },
  {
    id: 'dev-lead-michael-021',
    firstName: 'Eric',
    lastName: 'Nelson',
    email: 'eric.nelson@example.com',
    phone: '4175551021',
    status: 'FOLLOW_UP',
    createdAt: new Date('2026-08-23T21:12:00.000Z'),
  },
  {
    id: 'dev-lead-michael-022',
    firstName: 'Brittany',
    lastName: 'Carter',
    email: 'brittany.carter@example.com',
    phone: '4175551022',
    status: 'QUALIFIED',
    createdAt: new Date('2026-08-22T18:30:00.000Z'),
  },
  {
    id: 'dev-lead-michael-023',
    firstName: 'Justin',
    lastName: 'Mitchell',
    email: 'justin.mitchell@example.com',
    phone: '4175551023',
    status: 'LOST',
    createdAt: new Date('2026-08-21T20:15:00.000Z'),
  },
  {
    id: 'dev-lead-michael-024',
    firstName: 'Kayla',
    lastName: 'Perez',
    email: 'kayla.perez@example.com',
    phone: '4175551024',
    status: 'NEW',
    createdAt: new Date('2026-08-20T17:48:00.000Z'),
  },
  {
    id: 'dev-lead-michael-025',
    firstName: 'Derek',
    lastName: 'Roberts',
    email: 'derek.roberts@example.com',
    phone: '4175551025',
    status: 'CONTACTED',
    createdAt: new Date('2026-08-19T19:33:00.000Z'),
  },
  {
    id: 'dev-lead-michael-026',
    firstName: 'Courtney',
    lastName: 'Turner',
    email: null,
    phone: '4175551026',
    status: 'FOLLOW_UP',
    createdAt: new Date('2026-08-18T21:05:00.000Z'),
  },
  {
    id: 'dev-lead-michael-027',
    firstName: 'Nathan',
    lastName: 'Phillips',
    email: 'nathan.phillips@example.com',
    phone: '4175551027',
    status: 'CLOSED',
    createdAt: new Date('2026-08-17T18:44:00.000Z'),
  },
  {
    id: 'dev-lead-michael-028',
    firstName: 'Hannah',
    lastName: 'Campbell',
    email: 'hannah.campbell@example.com',
    phone: null,
    status: 'QUALIFIED',
    createdAt: new Date('2026-08-16T16:24:00.000Z'),
  },
  {
    id: 'dev-lead-michael-029',
    firstName: 'Jordan',
    lastName: 'Reed',
    email: 'jordan.reed@example.com',
    phone: '4175551029',
    status: 'NEW',
    createdAt: new Date('2026-08-15T19:10:00.000Z'),
  },
  {
    id: 'dev-lead-michael-030',
    firstName: 'Madison',
    lastName: 'Brooks',
    email: 'madison.brooks@example.com',
    phone: '4175551030',
    status: 'FOLLOW_UP',
    createdAt: new Date('2026-08-14T17:35:00.000Z'),
  },
];

// ======================================================
// SEED AGENTS
// ======================================================

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

// ======================================================
// SEED USERS
// ======================================================

async function seedUsers(
  savedAgents: Map<string, Awaited<ReturnType<typeof prisma.agent.upsert>>>,
) {
  console.log('Seeding users...');

  const michael = savedAgents.get('michael-elder');

  if (!michael) {
    throw new Error('Unable to seed user because michael-elder was not found.');
  }

  await prisma.user.upsert({
    where: {
      cognitoSub: '7408a488-d071-70b3-1049-3d69567cdbfe',
    },
    update: {
      agentId: michael.id,
    },
    create: {
      cognitoSub: '7408a488-d071-70b3-1049-3d69567cdbfe',
      email: 'shanhun.codes@gmail.com',
      agentId: michael.id,
    },
  });

  console.log('  ✓ Cognito user → michael-elder');
}

// ======================================================
// SEED PROPERTIES
// ======================================================

async function seedProperties(
  savedAgents: Map<string, Awaited<ReturnType<typeof prisma.agent.upsert>>>,
) {
  console.log('Seeding properties...');

  for (const property of properties) {
    const agent = savedAgents.get(property.agentSlug);

    if (!agent) {
      throw new Error(
        `Unable to seed property "${property.id}" because agent "${property.agentSlug}" was not found.`,
      );
    }

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
        agentId: agent.id,
      },
      create: {
        id: property.id,
        street: property.street,
        street2: property.street2,
        city: property.city,
        state: property.state,
        zip: property.zip,
        listingPriceCents: property.listingPriceCents,
        agentId: agent.id,
      },
    });

    console.log(`  ✓ ${property.street} (${property.agentSlug})`);
  }
}

// ======================================================
// SEED QUESTIONS
// ======================================================

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

// ======================================================
// SEED OPEN HOUSES
// ======================================================

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

// ======================================================
// SEED QUESTION ASSIGNMENTS
// ======================================================

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
    {
      timeout: 30000,
    },
  );

  console.log('  ✓ Agent question configurations');
  console.log('  ✓ Open house question configurations');
}

// ======================================================
// SEED MICHAEL DEV LEADS
// ======================================================

async function seedMichaelDevLeads(
  savedAgents: Map<string, Awaited<ReturnType<typeof prisma.agent.upsert>>>,
) {
  const savedLeads = new Map<
    string,
    Awaited<ReturnType<typeof prisma.lead.upsert>>
  >();

  // if (databaseEnvironment !== 'dev') {
  //   console.log('Skipping Michael dev leads outside DEV.');
  //   return savedLeads;
  // }

  console.log('Seeding Michael dev leads...');

  const michael = savedAgents.get('michael-elder');

  if (!michael) {
    throw new Error(
      'Unable to seed Michael dev leads because michael-elder was not found.',
    );
  }

  for (const lead of michaelDevLeads) {
    const savedLead = await prisma.lead.upsert({
      where: {
        id: lead.id,
      },
      update: {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        createdAt: lead.createdAt,
        agentId: michael.id,
      },
      create: {
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        createdAt: lead.createdAt,
        agentId: michael.id,
      },
    });

    savedLeads.set(lead.id, savedLead);

    console.log(`  ✓ ${lead.firstName} ${lead.lastName} (${lead.status})`);
  }

  return savedLeads;
}

// ======================================================
// DEV FEEDBACK ANSWER VALUES
//
// Every seeded lead gets a real FeedbackSubmission with
// answers for every currently seeded feedback question.
// ======================================================

const sourceValues = [
  'ZILLOW',
  'REALTOR_COM',
  'SOCIAL_MEDIA',
  'YARD_SIGN',
  'FRIEND_OR_FAMILY',
  'EMAIL',
  'LISTING_AGENT',
  'OTHER',
];

const budgetValues = [
  'UNDER_300K',
  'FROM_300K_TO_450K',
  'FROM_450K_TO_600K',
  'FROM_600K_TO_800K',
  'OVER_800K',
];

const timelineValues = [
  'ASAP',
  'ONE_TO_THREE_MONTHS',
  'THREE_TO_SIX_MONTHS',
  'OVER_SIX_MONTHS',
  'JUST_BROWSING',
];

const neighborhoodValues = [
  'Rountree, University Heights',
  'Southern Hills, Brentwood',
  'Downtown Springfield',
  'Galloway, Sequiota',
  'Kickapoo, Chesterfield Village',
  'Phelps Grove, Fassnight',
];

const likedMostValues = [
  'The natural light and open living area.',
  'The kitchen layout and amount of storage.',
  'The backyard and outdoor entertaining space.',
  'The primary bedroom and bathroom.',
  'The location and overall neighborhood.',
  'The garage and extra storage space.',
];

const likedLeastValues = [
  'The bedrooms felt a little small.',
  'The kitchen could use a few updates.',
  'The backyard needs some work.',
  'The price feels slightly high for the finishes.',
  'I would prefer a more open floorplan.',
  'There was not much I disliked.',
];

function getFeedbackValue(questionKey: string, index: number): string {
  switch (questionKey) {
    case 'source':
      return sourceValues[index % sourceValues.length];

    case 'budget_range':
      return budgetValues[index % budgetValues.length];

    case 'neighborhoods':
      return neighborhoodValues[index % neighborhoodValues.length];

    case 'neighborhood_resident':
      return index % 4 === 0 ? 'YES' : 'NO';

    case 'purchase_timeline':
      return timelineValues[index % timelineValues.length];

    case 'location_rating':
      return String(4 - (index % 3));

    case 'price_rating':
      return String(4 - ((index + 1) % 3));

    case 'floor_plan_rating':
      return String(4 - ((index + 2) % 3));

    case 'curb_appeal_rating':
      return String(4 - (index % 2));

    case 'overall_appeal_rating':
      return String(4 - (index % 3));

    case 'liked_most':
      return likedMostValues[index % likedMostValues.length];

    case 'liked_least':
      return likedLeastValues[index % likedLeastValues.length];

    case 'pre_qualified':
      return ['YES', 'NO', 'IN_PROGRESS'][index % 3];

    case 'working_with_agent':
      // Keep these synthetic visitors eligible to exist as leads.
      return 'NO';

    default:
      throw new Error(`No DEV feedback value configured for "${questionKey}".`);
  }
}

// ======================================================
// SEED MICHAEL DEV FEEDBACK SUBMISSIONS
// ======================================================

async function seedMichaelDevFeedbackSubmissions(
  savedLeads: Map<string, Awaited<ReturnType<typeof prisma.lead.upsert>>>,
  savedQuestions: Map<
    string,
    Awaited<ReturnType<typeof prisma.feedbackQuestion.upsert>>
  >,
  savedOpenHouses: Awaited<ReturnType<typeof seedOpenHouses>>,
) {
  // if (databaseEnvironment !== 'dev') {
  //   console.log('Skipping Michael dev feedback submissions outside DEV.');
  //   return 0;
  // }

  console.log('Seeding Michael dev feedback submissions...');

  const michaelOpenHouses = savedOpenHouses.filter((openHouse) =>
    ['RE7VW854', '65TMX6HF'].includes(openHouse.publicCode),
  );

  // if (michaelOpenHouses.length !== 2) {
  //   throw new Error(
  //     'Expected Michael DEV open houses RE7VW854 and 65TMX6HF to be seeded.',
  //   );
  // }

  // These IDs belong only to synthetic DEV leads, so it is safe to replace
  // their synthetic submissions on every seed run. This makes the seed idempotent.
  const existingSubmissions = await prisma.feedbackSubmission.findMany({
    where: {
      leadId: {
        in: michaelDevLeads.map((lead) => lead.id),
      },
    },
    select: {
      id: true,
    },
  });

  const existingSubmissionIds = existingSubmissions.map(
    (submission) => submission.id,
  );

  if (existingSubmissionIds.length) {
    await prisma.feedbackAnswer.deleteMany({
      where: {
        submissionId: {
          in: existingSubmissionIds,
        },
      },
    });

    await prisma.feedbackSubmission.deleteMany({
      where: {
        id: {
          in: existingSubmissionIds,
        },
      },
    });
  }

  let submissionCount = 0;

  for (const [index, leadSeed] of michaelDevLeads.entries()) {
    const lead = savedLeads.get(leadSeed.id);

    if (!lead) {
      throw new Error(`Unable to find seeded DEV lead "${leadSeed.id}".`);
    }

    // Most recent leads are associated with the September open house;
    // older leads are associated with Michael's August open house.
    const publicCode = index < 10 ? '65TMX6HF' : 'RE7VW854';
    const openHouse = michaelOpenHouses.find(
      (candidate) => candidate.publicCode === publicCode,
    );

    if (!openHouse) {
      throw new Error(`Unable to find seeded open house "${publicCode}".`);
    }

    const feedbackAnswers = questions.map((questionSeed) => {
      const question = savedQuestions.get(questionSeed.key);

      if (!question) {
        throw new Error(
          `Unable to seed feedback answer because question "${questionSeed.key}" was not found.`,
        );
      }

      return {
        questionId: question.id,
        value: getFeedbackValue(questionSeed.key, index),
      };
    });

    await prisma.feedbackSubmission.create({
      data: {
        createdAt: leadSeed.createdAt,
        openHouse: {
          connect: {
            id: openHouse.id,
          },
        },
        lead: {
          connect: {
            id: lead.id,
          },
        },
        feedbackAnswers: {
          create: feedbackAnswers,
        },
      },
    });

    submissionCount += 1;

    console.log(
      `  ✓ ${leadSeed.firstName} ${leadSeed.lastName} → ${publicCode} (${feedbackAnswers.length} answers)`,
    );
  }

  return submissionCount;
}

// ======================================================
// MAIN
// ======================================================

async function main() {
  const environmentLabel = databaseEnvironment.toUpperCase();

  console.log('');
  console.log('========================================');
  console.log(` QROHAA ${environmentLabel} DATABASE SEED`);
  console.log('========================================');
  console.log('');

  const savedAgents = await seedAgents();

  await seedUsers(savedAgents);

  await seedProperties(savedAgents);

  const savedQuestions = await seedQuestions();

  const savedOpenHouses = await seedOpenHouses(savedAgents);

  await seedQuestionAssignments(savedAgents, savedQuestions, savedOpenHouses);

  const savedLeads = await seedMichaelDevLeads(savedAgents);

  const seededSubmissionCount = await seedMichaelDevFeedbackSubmissions(
    savedLeads,
    savedQuestions,
    savedOpenHouses,
  );

  console.log('');
  console.log('========================================');
  console.log(` ${environmentLabel} SEED COMPLETE`);
  console.log('========================================');
  console.log('');

  console.log(`Agents:       ${savedAgents.size}`);
  console.log(`Properties:   ${properties.length}`);
  console.log(`Open houses:  ${savedOpenHouses.length}`);
  console.log(`Questions:    ${savedQuestions.size}`);

  // if (databaseEnvironment === 'dev') {
  //   console.log(`Michael leads:       ${savedLeads.size}`);
  //   console.log(
  //     `Feedback submissions:${seededSubmissionCount.toString().padStart(4, ' ')}`,
  //   );
  //   console.log(
  //     `Feedback answers:    ${seededSubmissionCount * questions.length}`,
  //   );
  // }

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

// ======================================================
// RUN
// ======================================================

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('');
    console.error(`${databaseEnvironment.toUpperCase()} seed failed:`);
    console.error(error);

    await prisma.$disconnect();

    process.exit(1);
  });
