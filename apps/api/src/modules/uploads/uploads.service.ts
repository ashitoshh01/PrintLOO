import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
const pdfParse = require('pdf-parse');

@Injectable()
export class UploadsService {
  async uploadFile(file: Express.Multer.File, userId: string, shopId: string) {
    if (!file) throw new BadRequestException('File is required');
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (!allowedExts.includes(ext)) {
      throw new BadRequestException('Invalid file type');
    }

    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    const newFileName = `${uuid}-${timestamp}${ext}`;
    
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const shopDir = path.join(uploadDir, shopId);
    
    if (!fs.existsSync(shopDir)) {
      fs.mkdirSync(shopDir, { recursive: true });
    }
    
    const filePath = path.join(shopDir, newFileName);
    fs.writeFileSync(filePath, file.buffer);
    
    let pageCount = 1;
    if (ext === '.pdf') {
      try {
        const data = await pdfParse(file.buffer);
        pageCount = data.numpages;
      } catch (err) {
        throw new BadRequestException('Failed to parse PDF file');
      }
    }
    
    return {
      fileId: newFileName,
      fileUrl: `http://localhost:3001/files/${shopId}/${newFileName}`,
      pageCount,
      fileSize: file.size,
      fileName: file.originalname,
    };
  }

  async getPreviewUrl(fileId: string, shopId: string, userId: string) {
    // Basic verification - checking if file exists
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, shopId, fileId);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }
    return { url: `${process.env.FRONTEND_URL}/files/${shopId}/${fileId}` };
  }
}
