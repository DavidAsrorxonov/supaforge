import { BadRequestException } from '@nestjs/common';

export function assertSafeIdentifier(name: string, label: string): void {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new BadRequestException(`Invalid ${label}`);
  }
}
