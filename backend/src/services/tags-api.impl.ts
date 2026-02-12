import { Injectable, NotFoundException } from '@nestjs/common';
import { TagsApi } from '../generated/api';
import { Tag, UpdateTag } from '../generated/models';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsApiImpl extends TagsApi {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async deleteTag(id: number, request: Request): Promise<void> {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    // Don't allow deleting status tags
    if (tag.isStatus) {
      throw new Error('Cannot delete status tags');
    }

    await this.prisma.tag.delete({ where: { id } });
  }

  async getTags(includeStatus: boolean, request: Request): Promise<Array<Tag>> {
    const tags = await this.prisma.tag.findMany({
      where: includeStatus ? {} : { isStatus: false },
      orderBy: [
        { isStatus: 'desc' },
        { name: 'asc' },
      ],
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      isStatus: tag.isStatus,
    }));
  }

  async updateTag(
    id: number,
    updateTag: UpdateTag,
    request: Request,
  ): Promise<Tag> {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    const updated = await this.prisma.tag.update({
      where: { id },
      data: {
        ...(updateTag.name && { name: updateTag.name }),
        ...(updateTag.color && { color: updateTag.color }),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      color: updated.color,
      isStatus: updated.isStatus,
    };
  }
}
