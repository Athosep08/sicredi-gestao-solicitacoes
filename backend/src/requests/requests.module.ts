import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestComment } from './entities/request-comment.entity';
import { RequestStatusHistory } from './entities/request-status-history.entity';
import { RequestEntity } from './entities/request.entity';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([RequestEntity, RequestStatusHistory, RequestComment])],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
