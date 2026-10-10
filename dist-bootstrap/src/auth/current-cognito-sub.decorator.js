"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentCognitoSub = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentCognitoSub = (0, common_1.createParamDecorator)((_data, context) => {
    const request = context.switchToHttp().getRequest();
    return request.user.cognitoSub;
});
//# sourceMappingURL=current-cognito-sub.decorator.js.map