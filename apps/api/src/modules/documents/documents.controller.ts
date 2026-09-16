import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '@ems/shared';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'List uploaded employee and organizational documents' })
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('category') category?: string,
  ) {
    return this.service.findAll(employeeId, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details and storage URL' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Record metadata for a newly uploaded document' })
  create(
    @Body()
    body: {
      title: string;
      fileName: string;
      fileKey: string;
      mimeType: string;
      fileSize: number;
      category?: string;
      employeeId?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.recordDocument({
      ...body,
      uploadedById: user.sub,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
