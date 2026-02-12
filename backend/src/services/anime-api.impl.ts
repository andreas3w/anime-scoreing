import { Injectable, NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AnimeApi } from '../generated/api';
import { Anime, SetTagsRequest, SortBy, SortOrder } from '../generated/models';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnimeApiImpl extends AnimeApi {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async deleteAnime(id: number, request: Request): Promise<void> {
    const anime = await this.prisma.anime.findUnique({ where: { id } });
    if (!anime) {
      throw new NotFoundException(`Anime with ID ${id} not found`);
    }
    await this.prisma.anime.delete({ where: { id } });
  }

  async getAnimeById(id: number, request: Request): Promise<Anime> {
    const anime = await this.prisma.anime.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!anime) {
      throw new NotFoundException(`Anime with ID ${id} not found`);
    }

    return this.mapToAnimeDto(anime);
  }

  async getAnimeList(
    tags: string,
    minScore: number,
    maxScore: number,
    search: string,
    sortBy: SortBy,
    sortOrder: SortOrder,
    request: Request,
  ): Promise<Array<Anime>> {
    const tagIds = tags ? tags.split(',').map((id) => parseInt(id, 10)).filter((id) => !isNaN(id)) : [];

    const anime = await this.prisma.anime.findMany({
      where: {
        ...(search && {
          title: { contains: search },
        }),
        ...(minScore !== undefined && !isNaN(minScore) && {
          myScore: { gte: minScore },
        }),
        ...(maxScore !== undefined && !isNaN(maxScore) && {
          myScore: { lte: maxScore },
        }),
        ...(tagIds.length > 0 && {
          AND: tagIds.map((tagId) => ({
            tags: {
              some: {
                tagId,
              },
            },
          })),
        }),
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        [sortBy || 'title']: sortOrder || 'asc',
      },
    });

    return anime.map((a) => this.mapToAnimeDto(a));
  }

  async setAnimeTags(
    id: number,
    setTagsRequest: SetTagsRequest,
    request: Request,
  ): Promise<Anime> {
    const anime = await this.prisma.anime.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!anime) {
      throw new NotFoundException(`Anime with ID ${id} not found`);
    }

    // Get current custom tags (non-status tags)
    const currentCustomTagIds = anime.tags
      .filter((at) => !at.tag.isStatus)
      .map((at) => at.tagId);

    // Get or create tags for each name
    const targetTags = await Promise.all(
      setTagsRequest.tags.map(async (name) => {
        let tag = await this.prisma.tag.findFirst({
          where: { name, isStatus: false },
        });

        if (!tag) {
          // Create new custom tag with a default color
          tag = await this.prisma.tag.create({
            data: {
              name,
              color: this.generateRandomColor(),
              isStatus: false,
            },
          });
        }

        return tag;
      }),
    );

    const targetTagIds = targetTags.map((t) => t.id);

    // Find tags to remove (in current but not in target)
    const tagsToRemove = currentCustomTagIds.filter(
      (tagId) => !targetTagIds.includes(tagId),
    );

    // Find tags to add (in target but not in current)
    const tagsToAdd = targetTagIds.filter(
      (tagId) => !currentCustomTagIds.includes(tagId),
    );

    // Remove old tags
    if (tagsToRemove.length > 0) {
      await this.prisma.animeTag.deleteMany({
        where: {
          animeId: id,
          tagId: { in: tagsToRemove },
        },
      });
    }

    // Add new tags
    if (tagsToAdd.length > 0) {
      await this.prisma.animeTag.createMany({
        data: tagsToAdd.map((tagId) => ({
          animeId: id,
          tagId,
        })),
      });
    }

    return this.getAnimeById(id, request);
  }

  private mapToAnimeDto(anime: {
    id: number;
    malId: number;
    title: string;
    type: string | null;
    episodes: number | null;
    myScore: number;
    myWatchedEpisodes: number;
    myStartDate: Date | null;
    myFinishDate: Date | null;
    myRewatching: boolean;
    myRewatchingEp: number;
    myLastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
    tags: Array<{
      tag: {
        id: number;
        name: string;
        color: string;
        isStatus: boolean;
      };
    }>;
  }): Anime {
    return {
      id: anime.id,
      malId: anime.malId,
      title: anime.title,
      type: anime.type as Anime.TypeEnum | undefined,
      episodes: anime.episodes,
      myScore: anime.myScore,
      myWatchedEpisodes: anime.myWatchedEpisodes,
      myStartDate: anime.myStartDate?.toISOString().split('T')[0] ?? null,
      myFinishDate: anime.myFinishDate?.toISOString().split('T')[0] ?? null,
      myRewatching: anime.myRewatching,
      myRewatchingEp: anime.myRewatchingEp,
      myLastUpdated: anime.myLastUpdated.toISOString(),
      createdAt: anime.createdAt.toISOString(),
      updatedAt: anime.updatedAt.toISOString(),
      tags: anime.tags.map((at) => ({
        id: at.tag.id,
        name: at.tag.name,
        color: at.tag.color,
        isStatus: at.tag.isStatus,
      })),
    };
  }

  private generateRandomColor(): string {
    const colors = [
      '#ef4444', // red
      '#f97316', // orange
      '#eab308', // yellow
      '#22c55e', // green
      '#14b8a6', // teal
      '#3b82f6', // blue
      '#8b5cf6', // violet
      '#ec4899', // pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
