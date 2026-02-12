import { Injectable, BadRequestException } from '@nestjs/common';
import { ImportApi } from '../generated/api';
import { ImportResult } from '../generated/models';
import { PrismaService } from '../prisma/prisma.service';
import { XMLParser } from 'fast-xml-parser';

interface MalAnimeEntry {
  series_animedb_id: number;
  series_title: string;
  series_type: string;
  series_episodes: number;
  my_watched_episodes: number;
  my_start_date: string;
  my_finish_date: string;
  my_score: number;
  my_status: string;
  my_rewatching: number;
  my_rewatching_ep: number;
  update_on_import: number;
}

interface MalExport {
  myanimelist: {
    anime: MalAnimeEntry | MalAnimeEntry[];
  };
}

@Injectable()
export class ImportApiImpl extends ImportApi {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async importMalXml(file: Blob, request: Request): Promise<ImportResult> {
    // This method is called by the generated controller but won't work properly
    // Use importFromXmlString instead via the custom controller
    const xmlContent = await file.text();
    return this.importFromXmlString(xmlContent);
  }

  async importFromXmlString(xmlContent: string): Promise<ImportResult> {
    const result: ImportResult = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        parseAttributeValue: true,
      });

      const parsed: MalExport = parser.parse(xmlContent);

      if (!parsed.myanimelist?.anime) {
        throw new BadRequestException('Invalid MAL XML format: no anime data found');
      }

      // Normalize to array
      const animeList = Array.isArray(parsed.myanimelist.anime)
        ? parsed.myanimelist.anime
        : [parsed.myanimelist.anime];

      for (const entry of animeList) {
        try {
          await this.importAnimeEntry(entry);
          
          // Check if it was created or updated
          const existing = await this.prisma.anime.findUnique({
            where: { malId: entry.series_animedb_id },
          });
          
          if (existing) {
            result.updated++;
          } else {
            result.created++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(
            `Failed to import "${entry.series_title}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to parse XML: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return result;
  }

  private async importAnimeEntry(entry: MalAnimeEntry): Promise<void> {
    const statusTagName = this.mapMalStatus(entry.my_status);
    
    // Get or verify status tag exists
    const statusTag = await this.prisma.tag.findFirst({
      where: { name: statusTagName, isStatus: true },
    });

    if (!statusTag) {
      throw new Error(`Status tag "${statusTagName}" not found`);
    }

    // Upsert the anime
    const anime = await this.prisma.anime.upsert({
      where: { malId: entry.series_animedb_id },
      update: {
        title: entry.series_title,
        type: entry.series_type,
        episodes: entry.series_episodes || null,
        myScore: entry.my_score || 0,
        myWatchedEpisodes: entry.my_watched_episodes || 0,
        myStartDate: this.parseDate(entry.my_start_date),
        myFinishDate: this.parseDate(entry.my_finish_date),
        myRewatching: entry.my_rewatching === 1,
        myRewatchingEp: entry.my_rewatching_ep || 0,
        myLastUpdated: new Date(),
      },
      create: {
        malId: entry.series_animedb_id,
        title: entry.series_title,
        type: entry.series_type,
        episodes: entry.series_episodes || null,
        myScore: entry.my_score || 0,
        myWatchedEpisodes: entry.my_watched_episodes || 0,
        myStartDate: this.parseDate(entry.my_start_date),
        myFinishDate: this.parseDate(entry.my_finish_date),
        myRewatching: entry.my_rewatching === 1,
        myRewatchingEp: entry.my_rewatching_ep || 0,
        myLastUpdated: new Date(),
      },
    });

    // Update status tag (remove old status tags, add new one)
    // First, get current status tag
    const currentStatusTags = await this.prisma.animeTag.findMany({
      where: {
        animeId: anime.id,
        tag: { isStatus: true },
      },
    });

    // Remove all current status tags
    if (currentStatusTags.length > 0) {
      await this.prisma.animeTag.deleteMany({
        where: {
          animeId: anime.id,
          tagId: { in: currentStatusTags.map((at) => at.tagId) },
        },
      });
    }

    // Add the new status tag
    await this.prisma.animeTag.create({
      data: {
        animeId: anime.id,
        tagId: statusTag.id,
      },
    });
  }

  private mapMalStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'Watching': 'Watching',
      'Completed': 'Completed',
      'On-Hold': 'On-Hold',
      'Dropped': 'Dropped',
      'Plan to Watch': 'Plan to Watch',
      // Handle variations
      'Currently Watching': 'Watching',
      'PlanToWatch': 'Plan to Watch',
      'OnHold': 'On-Hold',
    };

    return statusMap[status] || 'Plan to Watch';
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr || dateStr === '0000-00-00') {
      return null;
    }

    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
}
