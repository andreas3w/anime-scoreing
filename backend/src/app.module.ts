import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ApiModule } from './generated/api.module';
import { AnimeApiImpl, TagsApiImpl, ImportApiImpl } from './services';
import { ImportController } from './controllers/import.controller';

@Module({
  imports: [
    PrismaModule,
    ApiModule.forRoot({
      apiImplementations: {
        animeApi: AnimeApiImpl,
        importApi: ImportApiImpl,
        tagsApi: TagsApiImpl,
      },
      providers: [ImportApiImpl],
    }),
  ],
  controllers: [ImportController],
})
export class AppModule {}
