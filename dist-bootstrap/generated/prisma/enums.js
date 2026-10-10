"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteEntityType = exports.LeadStatusType = exports.FeedbackQuestionCategory = exports.FeedbackQuestionType = exports.PropertyStatusType = exports.AccessStatus = exports.AccessType = exports.InvitationAccountType = exports.AccountStatus = exports.UserRole = void 0;
exports.UserRole = {
    AGENT: 'AGENT',
    AGENCY_ADMIN: 'AGENCY_ADMIN',
    PLATFORM_ADMIN: 'PLATFORM_ADMIN'
};
exports.AccountStatus = {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED'
};
exports.InvitationAccountType = {
    AGENT: 'AGENT',
    AGENCY: 'AGENCY'
};
exports.AccessType = {
    BETA: 'BETA',
    PAID: 'PAID'
};
exports.AccessStatus = {
    ACTIVE: 'ACTIVE',
    EXPIRED: 'EXPIRED',
    REVOKED: 'REVOKED'
};
exports.PropertyStatusType = {
    ACTIVE: 'ACTIVE',
    ARCHIVED: 'ARCHIVED'
};
exports.FeedbackQuestionType = {
    TEXT: 'TEXT',
    TEXTAREA: 'TEXTAREA',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    RATING: 'RATING',
    SINGLE_SELECT: 'SINGLE_SELECT',
    MULTI_SELECT: 'MULTI_SELECT'
};
exports.FeedbackQuestionCategory = {
    BUYER_PROFILE: 'BUYER_PROFILE',
    PROPERTY_FEEDBACK: 'PROPERTY_FEEDBACK',
    BUYING_READINESS: 'BUYING_READINESS',
    GENERAL: 'GENERAL'
};
exports.LeadStatusType = {
    NEW: 'NEW',
    CONTACTED: 'CONTACTED',
    FOLLOW_UP: 'FOLLOW_UP',
    QUALIFIED: 'QUALIFIED',
    CLOSED: 'CLOSED',
    LOST: 'LOST'
};
exports.NoteEntityType = {
    LEAD: 'LEAD',
    PROPERTY: 'PROPERTY',
    OPEN_HOUSE: 'OPEN_HOUSE'
};
//# sourceMappingURL=enums.js.map