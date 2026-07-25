import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InviteService } from './invite.service';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MembersController],
  providers: [MembersService, InviteService],
  exports: [InviteService],
})
export class MembersModule {}
