import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as path from 'path';
import * as crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';

@Injectable()
export class UploadsService {
  constructor() {
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({
        cloudinary_url: process.env.CLOUDINARY_URL,
      });
    }
  }

  private async countPdfPages(buffer: Buffer): Promise<number> {
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();
      if (count > 0) return count;
    } catch (err: any) {
      console.warn(`[pdf-lib Warning] Could not parse PDF with pdf-lib: ${err?.message}`);
    }

    try {
      const str = buffer.toString('binary');
      const countMatches = str.match(/\/Count\s+(\d+)/g);
      if (countMatches && countMatches.length > 0) {
        const counts = countMatches
          .map(m => parseInt(m.replace(/\/Count\s+/, ''), 10))
          .filter(n => !isNaN(n) && n > 0);
        if (counts.length > 0) return Math.max(...counts);
      }
      const pageMatches = str.match(/\/Type\s*\/Page\b/g);
      if (pageMatches && pageMatches.length > 0) return pageMatches.length;
    } catch (err: any) {
      // Ignore fallback regex error
    }

    return 1;
  }

  private async uploadToCloudinary(
    buffer: Buffer,
    shopId: string,
    ext: string,
  ): Promise<{ publicId: string; secureUrl: string }> {
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.bmp'].includes(ext);
    const publicId = isImage ? `${uuid}-${timestamp}` : `${uuid}-${timestamp}${ext}`;
    const resourceType = isImage ? 'image' : 'raw';

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `printloo/${shopId}`,
          public_id: publicId,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary upload failed'));
          }
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
          });
        },
      );
      uploadStream.end(buffer);
    });
  }

  async uploadFile(file: Express.Multer.File, userId: string, shopId: string) {
    if (!file) throw new BadRequestException('File is required');
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [
      '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.rtf', '.csv',
      '.jpg', '.jpeg', '.png', '.webp', '.svg', '.bmp'
    ];
    if (!allowedExts.includes(ext)) {
      throw new BadRequestException(`Invalid file type (${ext}). Allowed formats: PDF, DOCX, DOC, PPTX, XLSX, TXT, PNG, JPG, WEBP`);
    }

    let pageCount = 1;
    if (ext === '.pdf') {
      pageCount = await this.countPdfPages(file.buffer);
    } else if (ext === '.docx' || ext === '.doc') {
      try {
        const content = file.buffer.toString('binary');
        const pageBreaks = (content.match(/<w:lastRenderedPageBreak\/>|<w:br[^>]*w:type="page"/g) || []).length;
        if (pageBreaks > 0) {
          pageCount = pageBreaks + 1;
        }
      } catch (err: any) {
        pageCount = 1;
      }
    }

    try {
      const cloudinaryResult = await this.uploadToCloudinary(file.buffer, shopId, ext);

      return {
        fileId: cloudinaryResult.publicId,
        fileUrl: cloudinaryResult.secureUrl,
        pageCount,
        fileSize: file.size,
        fileName: file.originalname,
      };
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Failed to upload file to Cloudinary');
    }
  }

  async uploadFiles(files: Express.Multer.File[], userId: string, shopId: string) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const uploadedFiles: Array<{ fileId: string; fileUrl: string; pageCount: number; fileSize: number; fileName: string }> = [];
    let totalPageCount = 0;
    let totalSize = 0;

    // Upload all files in parallel for maximum throughput
    const results = await Promise.all(
      files.map(file => this.uploadFile(file, userId, shopId))
    );

    for (const result of results) {
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
    if (fileId.startsWith('http')) {
      return { url: fileId };
    }
    const isImage = !fileId.match(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|rtf|csv)$/i);
    const resourceType = isImage ? 'image' : 'raw';
    const url = cloudinary.url(fileId, { resource_type: resourceType, secure: true });
    return { url };
  }
}

