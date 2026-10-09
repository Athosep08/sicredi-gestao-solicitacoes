import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Area } from '../areas/area.entity';
import { RequestComment } from '../requests/entities/request-comment.entity';
import { RequestStatusHistory } from '../requests/entities/request-status-history.entity';
import { RequestEntity } from '../requests/entities/request.entity';
import { User } from '../users/user.entity';
import { Init1760000000000 } from './migrations/1760000000000-Init';

dotenv.config({ quiet: true });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'requests',
  password: process.env.DB_PASSWORD ?? 'requests',
  database: process.env.DB_NAME ?? 'requests',
  entities: [User, Area, RequestEntity, RequestStatusHistory, RequestComment],
  migrations: [Init1760000000000],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
};

// Usado pelo CLI do TypeORM (migration:run / migration:revert).
export default new DataSource(dataSourceOptions);
