import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RunScenarioDto {
  @ApiProperty({
    enum: ['success', 'validation_error', 'system_error', 'slow_request', 'teapot'],
    description: 'Type of scenario to run',
  })
  @IsString()
  @IsIn(['success', 'validation_error', 'system_error', 'slow_request', 'teapot'])
  type!: string;

  @ApiPropertyOptional({ description: 'Optional name for the run' })
  @IsOptional()
  @IsString()
  name?: string;
}