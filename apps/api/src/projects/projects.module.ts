import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CreateProjectsService } from './create-projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ProjectsController],
  providers: [CreateProjectsService],
  exports: [CreateProjectsService],
})
export class ProjectsModule {}
