import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export async function validateDTO(dto: any, DTOClass: any): Promise<void> {
  const object = plainToClass(DTOClass, dto);
  const errors = await validate(object);

  if (errors.length > 0) {
    const errorMessages = errors.map(error => {
      return Object.values(error.constraints || {}).join(', ');
    });
    throw new Error(errorMessages.join('; '));
  }
}