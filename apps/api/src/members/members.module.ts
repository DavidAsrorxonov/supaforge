import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InviteService } from './invite.service';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MembersService, InviteService],
  providers: [MembersController],
  exports: [InviteService],
})
export class MembersModule {}
