import { IsISO8601, IsOptional, Matches } from 'class-validator';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

// Período opcional sobre a data de criação, em dias inteiros (AAAA-MM-DD, inclusivo nas duas pontas).
export class DashboardQuery {
  @IsOptional()
  @Matches(DAY, { message: 'Data inicial deve estar no formato AAAA-MM-DD.' })
  @IsISO8601({ strict: true }, { message: 'Data inicial inválida.' })
  from?: string;

  @IsOptional()
  @Matches(DAY, { message: 'Data final deve estar no formato AAAA-MM-DD.' })
  @IsISO8601({ strict: true }, { message: 'Data final inválida.' })
  to?: string;
}
