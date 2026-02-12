import { AnimeApi, TagsApi, ImportApi, Configuration } from '../generated/api';

const configuration = new Configuration({
  basePath: '/api',
});

export const animeApi = new AnimeApi(configuration);
export const tagsApi = new TagsApi(configuration);
export const importApi = new ImportApi(configuration);
