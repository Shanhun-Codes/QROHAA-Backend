import { describe, expect, it } from '@jest/globals';
import { HttpException } from '@nestjs/common';
import { PublicSubmissionProtectionService } from './public-submission-protection.service';

describe('PublicSubmissionProtectionService', () => {
  it('allows up to five submissions per IP and open house in fifteen minutes', () => {
    const service = new PublicSubmissionProtectionService();

    for (let index = 0; index < 5; index += 1) {
      service.assertAllowed('public-agent', 'HOUSE123', '127.0.0.1');
      service.recordSuccessfulSubmission(
        'public-agent',
        'HOUSE123',
        '127.0.0.1',
        undefined,
        `${index}`,
      );
    }

    expect(() =>
      service.assertAllowed('public-agent', 'HOUSE123', '127.0.0.1'),
    ).toThrow(HttpException);
  });

  it('applies a browser cooldown for the same open house', () => {
    const service = new PublicSubmissionProtectionService();
    service.recordSuccessfulSubmission(
      'public-agent',
      'HOUSE123',
      '127.0.0.1',
      'browser-1',
      'answers',
    );

    expect(() =>
      service.assertAllowed(
        'public-agent',
        'HOUSE123',
        '127.0.0.1',
        'browser-1',
      ),
    ).toThrow(HttpException);
  });

  it.each(['michael-elder', 'travis-shanhun'])(
    'does not throttle tester slug %s',
    (slug) => {
      const service = new PublicSubmissionProtectionService();

      for (let index = 0; index < 6; index += 1) {
        service.assertAllowed(slug, 'HOUSE123', '127.0.0.1', 'browser-1');
        service.recordSuccessfulSubmission(
          slug,
          'HOUSE123',
          '127.0.0.1',
          'browser-1',
          'answers',
        );
      }
    },
  );
});
