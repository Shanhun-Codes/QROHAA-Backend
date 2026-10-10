import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;
const BROWSER_COOLDOWN_MS = 30 * 1000;
const TESTER_SLUGS = new Set(['michael-elder', 'travis-shanhun']);

@Injectable()
export class PublicSubmissionProtectionService {
  private readonly logger = new Logger(PublicSubmissionProtectionService.name);
  private readonly submissionsByIp = new Map<string, number[]>();
  private readonly lastSubmissionByBrowser = new Map<string, number>();
  private readonly recentAnswerFingerprints = new Map<string, number>();

  assertAllowed(
    slug: string,
    publicCode: string,
    ipAddress: string,
    browserToken?: string,
  ) {
    if (TESTER_SLUGS.has(slug)) return;

    const now = Date.now();
    const ipKey = `${publicCode}:${ipAddress}`;
    const recentSubmissions = (this.submissionsByIp.get(ipKey) ?? []).filter(
      (submittedAt) => now - submittedAt < RATE_LIMIT_WINDOW_MS,
    );
    this.submissionsByIp.set(ipKey, recentSubmissions);
    if (recentSubmissions.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
      throw new HttpException(
        'Too many submissions. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (browserToken) {
      const lastSubmission = this.lastSubmissionByBrowser.get(
        `${publicCode}:${browserToken}`,
      );
      if (lastSubmission && now - lastSubmission < BROWSER_COOLDOWN_MS) {
        throw new HttpException(
          'Please wait before submitting feedback again.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  recordSuccessfulSubmission(
    slug: string,
    publicCode: string,
    ipAddress: string,
    browserToken: string | undefined,
    answerFingerprint: string,
  ) {
    if (TESTER_SLUGS.has(slug)) return;

    const now = Date.now();
    const ipKey = `${publicCode}:${ipAddress}`;
    this.submissionsByIp.set(ipKey, [
      ...(this.submissionsByIp.get(ipKey) ?? []),
      now,
    ]);
    if (browserToken)
      this.lastSubmissionByBrowser.set(`${publicCode}:${browserToken}`, now);

    const fingerprintKey = `${publicCode}:${answerFingerprint}`;
    const previousSubmission =
      this.recentAnswerFingerprints.get(fingerprintKey);
    if (previousSubmission && now - previousSubmission < RATE_LIMIT_WINDOW_MS) {
      this.logger.warn(
        `Rapid identical feedback detected for open house ${publicCode}.`,
      );
    }
    this.recentAnswerFingerprints.set(fingerprintKey, now);
  }
}
