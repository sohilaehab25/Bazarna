"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDTO = validateDTO;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
async function validateDTO(dto, DTOClass) {
    const object = (0, class_transformer_1.plainToClass)(DTOClass, dto);
    const errors = await (0, class_validator_1.validate)(object);
    if (errors.length > 0) {
        const errorMessages = errors.map(error => {
            return Object.values(error.constraints || {}).join(', ');
        });
        throw new Error(errorMessages.join('; '));
    }
}
