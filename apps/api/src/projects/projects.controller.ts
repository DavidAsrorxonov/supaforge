import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { OrgRoleGuard } from '../auth/guards/org-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectsService } from './create-projects.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '@supaforge/types';
import { RequireOrgRole } from '../auth/decorators/require-org-role.decorator';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('orgs/:slug/projects')
@UseGuards(JwtAuthGuard, OrgRoleGuard)
export class ProjectsController {
  constructor(private projectService: CreateProjectsService) {}

  @Get()
  getProjects(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {
    return this.projectService.getProjectsForOrg(slug, user.sub);
  }

  @Get(':projectSlug')
  getProject(
    @Param('slug') slug: string,
    @Param('projectSlug') projectSlug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectService.getProjectBySlug(slug, projectSlug, user.sub);
  }

  @Post()
  @RequireOrgRole('admin')
  createProject(@Param('slug') slug: string, @Body() dto: CreateProjectDto) {
    return this.projectService.createProject(slug, dto);
  }
}
