import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SearchService } from './search.service';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('location') location?: string,
    @Query('experienceLevel') experienceLevel?: string,
    @Query('skill') skill?: string,
    @Query('sort') sort?: string,
  ) {
    return this.searchService.search(query ?? '', {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      location,
      experienceLevel,
      skill,
      sort,
    });
  }

  @Get('autocomplete')
  autocomplete(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.autocomplete(query ?? '', limit ? parseInt(limit, 10) : 10);
  }

  @Get('projects')
  searchProjects(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
    @Query('skill') skill?: string,
    @Query('sort') sort?: string,
  ) {
    return this.searchService.searchProjects(query ?? '', {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      status,
      skill,
      sort,
    });
  }
}
