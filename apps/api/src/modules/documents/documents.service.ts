import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(employeeId?: string, category?: string) {
    return this.prisma.document.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(category && { category }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async recordDocument(data: {
    title: string;
    fileName: string;
    fileKey: string;
    mimeType: string;
    fileSize: number;
    category?: string;
    employeeId?: string;
    uploadedById?: string;
  }) {
    const endpoint = this.configService.get<string>('s3.endpoint');
    const port = this.configService.get<number>('s3.port');
    const bucket = this.configService.get<string>('s3.bucket');
    const fileUrl = `http://${endpoint}:${port}/${bucket}/${data.fileKey}`;

    return this.prisma.document.create({
      data: {
        title: data.title,
        fileName: data.fileName,
        fileKey: data.fileKey,
        fileUrl,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        category: data.category || 'GENERAL',
        employeeId: data.employeeId,
        uploadedById: data.uploadedById,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.document.delete({ where: { id } });
  }
}
