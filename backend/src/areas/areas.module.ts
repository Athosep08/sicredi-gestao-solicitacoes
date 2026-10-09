import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './area.entity';

@Injectable()
export class AreasService {
  constructor(@InjectRepository(Area) private readonly repo: Repository<Area>) {}
  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }
}

@Controller('areas')
export class AreasController {
  constructor(private readonly service: AreasService) {}
  @Get()
  findAll() {
    return this.service.findAll();
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Area])],
  controllers: [AreasController],
  providers: [AreasService],
})
export class AreasModule {}
