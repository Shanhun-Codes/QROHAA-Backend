"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentAgentId = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentAgentId = (0, common_1.createParamDecorator)((_data, context) => {
    const request = context.switchToHttp().getRequest();
    return request.user.agentId;
});
//# sourceMappingURL=current-agent-id.decorator.js.map