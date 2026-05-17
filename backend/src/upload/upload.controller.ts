import { Controller, Post, Get, Param, UploadedFile, UseInterceptors, UseGuards, Res, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';

const ALLOWED_TYPES = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xlsx', '.xls', '.csv'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_TYPES.includes(ext)) {
          return cb(new BadRequestException(`不支持的文件类型: ${ext}，允许: ${ALLOWED_TYPES.join(', ')}`), '');
        }
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + ext);
      },
    }),
    limits: { fileSize: MAX_SIZE },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请选择文件');
    return { code: 0, data: { filename: file.filename, originalName: file.originalname, url: `/uploads/${file.filename}` } };
  }

  @Get(':filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'uploads', filename));
  }
}
