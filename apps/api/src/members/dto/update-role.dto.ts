import { ORG_ROLES } from '@supaforge/constants';
import type { OrgRole } from '@supaforge/types';
import { IsEnum } from 'class-validator';

export class UpdateRoleDto {
  @IsEnum(ORG_ROLES)
  role!: OrgRole;
}
