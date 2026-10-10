"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOpenHouseDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_open_houses_dto_1 = require("./create-open-houses.dto");
class UpdateOpenHouseDto extends (0, mapped_types_1.PartialType)(create_open_houses_dto_1.CreateOpenHousesDto) {
}
exports.UpdateOpenHouseDto = UpdateOpenHouseDto;
//# sourceMappingURL=update-open-houses.dto.js.map