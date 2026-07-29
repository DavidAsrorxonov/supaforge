import { Injectable } from '@nestjs/common';
import { DrizzleService } from '../db/drizzle.service';

@Injectable()
export class ProjectAPIService {
  constructor(private drizzle: DrizzleService) {}
}
