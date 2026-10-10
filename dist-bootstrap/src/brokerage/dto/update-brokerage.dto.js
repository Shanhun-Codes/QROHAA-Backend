"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBrokerageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_brokerage_dto_1 = require("./create-brokerage.dto");
class UpdateBrokerageDto extends (0, swagger_1.PartialType)(create_brokerage_dto_1.CreateBrokerageDto) {
}
exports.UpdateBrokerageDto = UpdateBrokerageDto;
//# sourceMappingURL=update-brokerage.dto.js.map