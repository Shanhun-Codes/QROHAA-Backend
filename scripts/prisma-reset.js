const { spawnSync } = require('node:child_process');

const environment = process.argv[2];
const databaseUrl = process.env.DATABASE_URL;

// --------------------------------------------------
// 1. DATABASE_URL must exist
// --------------------------------------------------

if (!databaseUrl) {
  console.error('');
  console.error('❌ DATABASE_URL is not defined.');
  console.error('Reset aborted.');
  console.error('');
  process.exit(1);
}

// --------------------------------------------------
// 2. Only DEV and QA are allowed to reset
// --------------------------------------------------

const allowedEnvironments = ['dev', 'qa'];

if (!allowedEnvironments.includes(environment)) {
  console.error('');
  console.error('🚨 DATABASE RESET BLOCKED');
  console.error('');
  console.error('Only DEV and QA databases may be reset.');
  console.error(`Received environment: ${environment ?? 'undefined'}`);
  console.error('');
  process.exit(1);
}

// --------------------------------------------------
// 3. Parse DATABASE_URL
// --------------------------------------------------

let parsedUrl;

try {
  parsedUrl = new URL(databaseUrl);
} catch {
  console.error('');
  console.error('❌ DATABASE_URL is invalid.');
  console.error('Reset aborted.');
  console.error('');
  process.exit(1);
}

const databaseName = parsedUrl.pathname.replace(/^\//, '');
const databaseHost = parsedUrl.hostname;

// --------------------------------------------------
// 4. Explicitly block production-looking databases
// --------------------------------------------------

const productionIdentifiers = [
  'prod',
  'production',
  'qrohaa_prod',
  'qrohaa_production',
];

const databaseLooksLikeProduction = productionIdentifiers.some((identifier) =>
  databaseName.toLowerCase().includes(identifier),
);

if (databaseLooksLikeProduction) {
  console.error('');
  console.error('🚨🚨🚨 PRODUCTION DATABASE DETECTED 🚨🚨🚨');
  console.error('');
  console.error(`Database: ${databaseName}`);
  console.error(`Host:     ${databaseHost}`);
  console.error('');
  console.error('❌ RESET ABORTED.');
  console.error('');
  process.exit(1);
}

// --------------------------------------------------
// 5. Extra QA safety check
// --------------------------------------------------

if (environment === 'qa' && databaseName !== 'qrohaa_qa') {
  console.error('');
  console.error('🚨 QA DATABASE SAFETY CHECK FAILED');
  console.error('');
  console.error('Expected database: qrohaa_qa');
  console.error(`Actual database:   ${databaseName}`);
  console.error(`Host:              ${databaseHost}`);
  console.error('');
  console.error('❌ RESET ABORTED.');
  console.error('');
  process.exit(1);
}

// --------------------------------------------------
// 6. Show exactly what is about to be reset
// --------------------------------------------------

console.log('');
console.log('========================================');
console.log(' DATABASE RESET');
console.log('========================================');
console.log('');
console.log(`Environment: ${environment.toUpperCase()}`);
console.log(`Database:    ${databaseName}`);
console.log(`Host:        ${databaseHost}`);
console.log('');

// --------------------------------------------------
// 7. Run Prisma reset
// --------------------------------------------------

const result = spawnSync('npx', ['prisma', 'migrate', 'reset'], {
  stdio: 'inherit',
  shell: true,
});

if (result.error) {
  console.error('');
  console.error('❌ Failed to execute Prisma reset.');
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
