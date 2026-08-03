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

  async uploadFiles(files: Express.Multer.File[], userId: string, shopId: string) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const uploadedFiles: Array<{ fileId: string; fileUrl: string; pageCount: number; fileSize: number; fileName: string }> = [];
    let totalPageCount = 0;
    let totalSize = 0;

    for (const file of files) {
      const result = await this.uploadFile(file, userId, shopId);
      uploadedFiles.push(result);
      totalPageCount += result.pageCount;
      totalSize += result.fileSize;
    }

    const fileNames = uploadedFiles.map(f => f.fileName).join(', ');
    const firstUrl = uploadedFiles[0].fileUrl;

    return {
      files: uploadedFiles,
      fileId: uploadedFiles.map(f => f.fileId).join(','),
      fileUrl: uploadedFiles.length === 1 ? firstUrl : JSON.stringify(uploadedFiles.map(f => f.fileUrl)),
      pageCount: totalPageCount,
      fileSize: totalSize,
      fileName: fileNames,
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
