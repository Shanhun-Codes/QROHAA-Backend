"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonNullValueFilter = exports.NullsOrder = exports.QueryMode = exports.NullableJsonNullValueInput = exports.SortOrder = exports.NoteMentionScalarFieldEnum = exports.NoteScalarFieldEnum = exports.LeadScalarFieldEnum = exports.FeedbackAnswerScalarFieldEnum = exports.FeedbackSubmissionScalarFieldEnum = exports.OpenHouseFeedbackQuestionScalarFieldEnum = exports.FeedbackQuestionOptionScalarFieldEnum = exports.AgentFeedbackQuestionScalarFieldEnum = exports.FeedbackQuestionScalarFieldEnum = exports.OpenHouseScalarFieldEnum = exports.PropertyScalarFieldEnum = exports.AuditLogScalarFieldEnum = exports.AccessEntitlementScalarFieldEnum = exports.InvitationScalarFieldEnum = exports.UserScalarFieldEnum = exports.AgencyScalarFieldEnum = exports.BrokerageScalarFieldEnum = exports.AgentScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.Decimal = void 0;
const runtime = __importStar(require("@prisma/client/runtime/index-browser"));
exports.Decimal = runtime.Decimal;
exports.NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
exports.DbNull = runtime.DbNull;
exports.JsonNull = runtime.JsonNull;
exports.AnyNull = runtime.AnyNull;
exports.ModelName = {
    Agent: 'Agent',
    Brokerage: 'Brokerage',
    Agency: 'Agency',
    User: 'User',
    Invitation: 'Invitation',
    AccessEntitlement: 'AccessEntitlement',
    AuditLog: 'AuditLog',
    Property: 'Property',
    OpenHouse: 'OpenHouse',
    FeedbackQuestion: 'FeedbackQuestion',
    AgentFeedbackQuestion: 'AgentFeedbackQuestion',
    FeedbackQuestionOption: 'FeedbackQuestionOption',
    OpenHouseFeedbackQuestion: 'OpenHouseFeedbackQuestion',
    FeedbackSubmission: 'FeedbackSubmission',
    FeedbackAnswer: 'FeedbackAnswer',
    Lead: 'Lead',
    Note: 'Note',
    NoteMention: 'NoteMention'
};
exports.TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
exports.AgentScalarFieldEnum = {
    id: 'id',
    slug: 'slug',
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phone: 'phone',
    brokerageName: 'brokerageName',
    realEstateLicenseNumber: 'realEstateLicenseNumber',
    headline: 'headline',
    logoUrl: 'logoUrl',
    headshotUrl: 'headshotUrl',
    primaryColor: 'primaryColor',
    secondaryColor: 'secondaryColor',
    accentColor: 'accentColor',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    agencyId: 'agencyId',
    brandingLocked: 'brandingLocked'
};
exports.BrokerageScalarFieldEnum = {
    id: 'id',
    name: 'name',
    licenseNumber: 'licenseNumber',
    phone: 'phone',
    email: 'email',
    websiteUrl: 'websiteUrl',
    street: 'street',
    street2: 'street2',
    city: 'city',
    state: 'state',
    zip: 'zip',
    agentId: 'agentId',
    agencyId: 'agencyId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AgencyScalarFieldEnum = {
    id: 'id',
    name: 'name',
    headline: 'headline',
    logoUrl: 'logoUrl',
    primaryColor: 'primaryColor',
    secondaryColor: 'secondaryColor',
    accentColor: 'accentColor',
    plan: 'plan',
    seatLimit: 'seatLimit',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.UserScalarFieldEnum = {
    id: 'id',
    cognitoSub: 'cognitoSub',
    email: 'email',
    role: 'role',
    status: 'status',
    agencyId: 'agencyId',
    agentId: 'agentId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.InvitationScalarFieldEnum = {
    id: 'id',
    email: 'email',
    tokenHash: 'tokenHash',
    role: 'role',
    accountType: 'accountType',
    agencyId: 'agencyId',
    createdBySub: 'createdBySub',
    expiresAt: 'expiresAt',
    revokedAt: 'revokedAt',
    redeemedAt: 'redeemedAt',
    redeemedBySub: 'redeemedBySub',
    createdAt: 'createdAt'
};
exports.AccessEntitlementScalarFieldEnum = {
    id: 'id',
    type: 'type',
    status: 'status',
    startsAt: 'startsAt',
    expiresAt: 'expiresAt',
    revokedAt: 'revokedAt',
    userId: 'userId',
    agencyId: 'agencyId',
    stripeCustomerId: 'stripeCustomerId',
    stripeSubscriptionId: 'stripeSubscriptionId',
    grantedBySub: 'grantedBySub',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AuditLogScalarFieldEnum = {
    id: 'id',
    actorSub: 'actorSub',
    action: 'action',
    targetType: 'targetType',
    targetId: 'targetId',
    metadata: 'metadata',
    createdAt: 'createdAt'
};
exports.PropertyScalarFieldEnum = {
    id: 'id',
    street: 'street',
    street2: 'street2',
    city: 'city',
    state: 'state',
    zip: 'zip',
    listingPriceCents: 'listingPriceCents',
    status: 'status',
    agentId: 'agentId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.OpenHouseScalarFieldEnum = {
    id: 'id',
    publicCode: 'publicCode',
    startsAt: 'startsAt',
    endsAt: 'endsAt',
    agentId: 'agentId',
    propertyId: 'propertyId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.FeedbackQuestionScalarFieldEnum = {
    id: 'id',
    key: 'key',
    label: 'label',
    type: 'type',
    category: 'category',
    active: 'active',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.AgentFeedbackQuestionScalarFieldEnum = {
    agentId: 'agentId',
    questionId: 'questionId',
    active: 'active',
    required: 'required',
    sortOrder: 'sortOrder',
    printable: 'printable',
    printableSortOrder: 'printableSortOrder'
};
exports.FeedbackQuestionOptionScalarFieldEnum = {
    id: 'id',
    label: 'label',
    value: 'value',
    sortOrder: 'sortOrder',
    questionId: 'questionId'
};
exports.OpenHouseFeedbackQuestionScalarFieldEnum = {
    openHouseId: 'openHouseId',
    questionId: 'questionId',
    required: 'required',
    sortOrder: 'sortOrder',
    printable: 'printable',
    printableSortOrder: 'printableSortOrder'
};
exports.FeedbackSubmissionScalarFieldEnum = {
    id: 'id',
    openHouseId: 'openHouseId',
    createdAt: 'createdAt',
    leadId: 'leadId'
};
exports.FeedbackAnswerScalarFieldEnum = {
    id: 'id',
    submissionId: 'submissionId',
    questionId: 'questionId',
    value: 'value'
};
exports.LeadScalarFieldEnum = {
    id: 'id',
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phone: 'phone',
    agentId: 'agentId',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.NoteScalarFieldEnum = {
    id: 'id',
    body: 'body',
    subjectType: 'subjectType',
    subjectId: 'subjectId',
    agentId: 'agentId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.NoteMentionScalarFieldEnum = {
    id: 'id',
    noteId: 'noteId',
    targetType: 'targetType',
    targetId: 'targetId',
    label: 'label',
    createdAt: 'createdAt'
};
exports.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.NullableJsonNullValueInput = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull
};
exports.QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
exports.NullsOrder = {
    first: 'first',
    last: 'last'
};
exports.JsonNullValueFilter = {
    DbNull: exports.DbNull,
    JsonNull: exports.JsonNull,
    AnyNull: exports.AnyNull
};
//# sourceMappingURL=prismaNamespaceBrowser.js.map