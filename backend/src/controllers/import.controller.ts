import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportResult } from '../generated/models';
import { ImportApiImpl } from '../services/import-api.impl';

@Controller()
export class ImportController {
  constructor(private readonly importApi: ImportApiImpl) {}

  @Post('/import')
  @UseInterceptors(FileInterceptor('file'))
  async importMalXml(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Pass the XML content as string directly
    const xmlContent = file.buffer.toString('utf-8');

    return this.importApi.importFromXmlString(xmlContent);
  }
}
