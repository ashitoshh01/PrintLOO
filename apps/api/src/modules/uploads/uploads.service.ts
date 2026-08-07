import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as path from 'path';
import * as crypto from 'crypto';
const pdfParse = require('pdf-parse');

@Injectable()
export class UploadsService {
  constructor() {
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({
        cloudinary_url: process.env.CLOUDINARY_URL,
      });
    }
  }

  private async uploadToCloudinary(
    buffer: Buffer,
    shopId: string,
    ext: string,
  ): Promise<{ publicId: string; secureUrl: string }> {
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    const isPdf = ext === '.pdf';
    const publicId = isPdf ? `${uuid}-${timestamp}${ext}` : `${uuid}-${timestamp}`;
    const resourceType = isPdf ? 'raw' : 'auto';

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
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (!allowedExts.includes(ext)) {
      throw new BadRequestException('Invalid file type. Allowed: PDF, JPG, JPEG, PNG');
    }

    let pageCount = 1;
    if (ext === '.pdf') {
      try {
        const data = await pdfParse(file.buffer);
        pageCount = data.numpages || 1;
      } catch (err) {
        throw new BadRequestException('Failed to parse PDF file');
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
    if (fileId.startsWith('http')) {
      return { url: fileId };
    }
    return { url: `https://res.cloudinary.com/depohq5yg/image/upload/${fileId}` };
  }
}

