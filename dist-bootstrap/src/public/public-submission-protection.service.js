"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PublicSubmissionProtectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicSubmissionProtectionService = void 0;
const common_1 = require("@nestjs/common");
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;
const BROWSER_COOLDOWN_MS = 30 * 1000;
const TESTER_SLUGS = new Set(['michael-elder', 'travis-shanhun']);
let PublicSubmissionProtectionService = PublicSubmissionProtectionService_1 = class PublicSubmissionProtectionService {
    logger = new common_1.Logger(PublicSubmissionProtectionService_1.name);
    submissionsByIp = new Map();
    lastSubmissionByBrowser = new Map();
    recentAnswerFingerprints = new Map();
    assertAllowed(slug, publicCode, ipAddress, browserToken) {
        if (TESTER_SLUGS.has(slug))
            return;
        const now = Date.now();
        const ipKey = `${publicCode}:${ipAddress}`;
        const recentSubmissions = (this.submissionsByIp.get(ipKey) ?? []).filter((submittedAt) => now - submittedAt < RATE_LIMIT_WINDOW_MS);
        this.submissionsByIp.set(ipKey, recentSubmissions);
        if (recentSubmissions.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
            throw new common_1.HttpException('Too many submissions. Please try again later.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (browserToken) {
            const lastSubmission = this.lastSubmissionByBrowser.get(`${publicCode}:${browserToken}`);
            if (lastSubmission && now - lastSubmission < BROWSER_COOLDOWN_MS) {
                throw new common_1.HttpException('Please wait before submitting feedback again.', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
        }
    }
    recordSuccessfulSubmission(slug, publicCode, ipAddress, browserToken, answerFingerprint) {
        if (TESTER_SLUGS.has(slug))
            return;
        const now = Date.now();
        const ipKey = `${publicCode}:${ipAddress}`;
        this.submissionsByIp.set(ipKey, [
            ...(this.submissionsByIp.get(ipKey) ?? []),
            now,
        ]);
        if (browserToken)
            this.lastSubmissionByBrowser.set(`${publicCode}:${browserToken}`, now);
        const fingerprintKey = `${publicCode}:${answerFingerprint}`;
        const previousSubmission = this.recentAnswerFingerprints.get(fingerprintKey);
        if (previousSubmission && now - previousSubmission < RATE_LIMIT_WINDOW_MS) {
            this.logger.warn(`Rapid identical feedback detected for open house ${publicCode}.`);
        }
        this.recentAnswerFingerprints.set(fingerprintKey, now);
    }
};
exports.PublicSubmissionProtectionService = PublicSubmissionProtectionService;
exports.PublicSubmissionProtectionService = PublicSubmissionProtectionService = PublicSubmissionProtectionService_1 = __decorate([
    (0, common_1.Injectable)()
], PublicSubmissionProtectionService);
//# sourceMappingURL=public-submission-protection.service.js.map