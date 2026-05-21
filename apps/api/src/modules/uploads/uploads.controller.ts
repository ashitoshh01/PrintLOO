import { Controller, Post, Get, Param, UseGuards, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('shopId') shopId: string,
    @CurrentUser() user: any,
  ) {
    return this.uploadsService.uploadFile(file, user.id, shopId);
  }

  @Get(':id/preview')
  async getPreviewUrl(
    @Param('id') fileId: string,
    @Body('shopId') shopId: string,
    @CurrentUser() user: any,
  ) {
    return this.uploadsService.getPreviewUrl(fileId, shopId, user.id);
  }
}
