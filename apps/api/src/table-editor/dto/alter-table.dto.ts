import { COLUMN_TYPES } from '@supaforge/constants';
import type { ColumnType } from '@supaforge/types';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class AddColumnDto {
  @IsString()
  name!: string;

  @IsIn(COLUMN_TYPES)
  type!: ColumnType;

  @IsOptional()
  @IsString()
  defaultValue?: string;
}
