import { Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleService } from '../db/drizzle.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import slugify from 'slugify';
import { randomBytes } from 'crypto';
import { organizations, orgMembers, projects } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { CreateProjectDto } from './dto/create-project.dto';
import { PROJECT_KEY_ROLES } from '@supaforge/constants';

@Injectable()
export class CreateProjectsService {
  constructor(
    private drizzle: DrizzleService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private generateProjectSlug(name: string): string {
    const base = slugify(name, { lower: true, strict: true });
    const suffix = randomBytes(3).toString('hex');
    return `${base}-${suffix}`;
  }

  private generateDbSchema(): string {
    return `proj_${randomBytes(4).toString('hex')}`;
  }

  private signProjectKey(projectId: string, role: string): string {
    return this.jwtService.sign(
      { projectId, role },
      {
        secret: this.configService.get('PROJECT_JWT_SECRET'),
        expiresIn: '100y',
      },
    );
  }

  private async provisionSchema(dbSchema: string): Promise<void> {
    await this.drizzle.db.execute(`CREATE SCHEMA IF NOT EXISTS "${dbSchema}"`);
  }

  async getProjectsForOrg(orgSlug: string, userId: string) {
    return this.drizzle.db
      .select({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .innerJoin(organizations, eq(projects.orgId, organizations.id))
      .innerJoin(
        orgMembers,
        and(
          eq(orgMembers.orgId, organizations.id),
          eq(orgMembers.userId, userId),
          isNull(orgMembers.removedAt),
        ),
      )
      .where(eq(organizations.slug, orgSlug));
  }

  async getProjectBySlug(orgSlug: string, projectSlug: string, userId: string) {
    const [row] = await this.drizzle.db
      .select()
      .from(projects)
      .innerJoin(organizations, eq(projects.orgId, organizations.id))
      .innerJoin(
        orgMembers,
        and(
          eq(orgMembers.orgId, organizations.id),
          eq(orgMembers.userId, userId),
          isNull(orgMembers.removedAt),
        ),
      )
      .where(
        and(eq(organizations.slug, orgSlug), eq(projects.slug, projectSlug)),
      )
      .limit(1);

    if (!row) throw new NotFoundException('Project not found');
    return row;
  }

  async createProject(orgSlug: string, dto: CreateProjectDto) {
    const [org] = await this.drizzle.db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1);

    if (!org) throw new NotFoundException('Organization not found');

    const projectSlug = this.generateProjectSlug(dto.name);
    const dbSchema = this.generateDbSchema();
    const projectUrl = `${this.configService.get<string>('API_URL')}/projects/${projectSlug}`;

    await this.provisionSchema(dbSchema);

    const [project] = await this.drizzle.db
      .insert(projects)
      .values({
        orgId: org.id,
        name: dto.name,
        slug: projectSlug,
        dbSchema,
        projectUrl,
        anonKey: '',
        serviceRoleKey: '',
      })
      .returning();

    const anonKey = this.signProjectKey(project.id, PROJECT_KEY_ROLES.ANON);
    const serviceRoleKey = this.signProjectKey(
      project.id,
      PROJECT_KEY_ROLES.SERVICE_ROLE,
    );

    const [updated] = await this.drizzle.db
      .update(projects)
      .set({ anonKey, serviceRoleKey })
      .where(eq(projects.id, project.id))
      .returning();

    if (!updated) throw new NotFoundException('Project not found');

    return updated;
  }
}
