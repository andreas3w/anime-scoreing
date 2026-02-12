import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    await this.seedStatusTags();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Seed the default status tags if they don't exist
   */
  private async seedStatusTags() {
    const statusTags = [
      { name: 'Watching', color: '#3b82f6', isStatus: true },
      { name: 'Completed', color: '#10b981', isStatus: true },
      { name: 'On-Hold', color: '#f59e0b', isStatus: true },
      { name: 'Dropped', color: '#ef4444', isStatus: true },
      { name: 'Plan to Watch', color: '#64748b', isStatus: true },
    ];

    for (const tag of statusTags) {
      await this.tag.upsert({
        where: { name: tag.name },
        update: {},
        create: tag,
      });
    }
  }
}
