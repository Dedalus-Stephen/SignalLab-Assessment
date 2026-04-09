import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ScenarioService } from './scenario.service';
import { RunScenarioDto } from './scenario.dto';

@Controller('scenarios')
export class ScenarioController {
  constructor(private scenarioService: ScenarioService) {}

  @Post('run')
  @ApiOperation({ summary: 'Run a scenario' })
  @ApiResponse({ status: 200, description: 'Scenario executed successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 500, description: 'System error' })
  async run(@Body() dto: RunScenarioDto) {
    return this.scenarioService.run(dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get scenario run history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async history(@Query('limit') limit?: number) {
    return this.scenarioService.getHistory(limit || 20);
  }
}
