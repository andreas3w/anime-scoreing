'use client';

import type { AnimeWithTags, Tag } from '@/lib/prisma';
import { AnimeRow } from './AnimeRow';

interface AnimeTableProps {
  anime: AnimeWithTags[];
  tags: Tag[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort: (field: string) => void;
}

const columns = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'myScore', label: 'Score', sortable: true },
  { key: 'episodes', label: 'Progress', sortable: false },
  { key: 'tags', label: 'Tags', sortable: false },
  { key: 'updatedAt', label: 'Updated', sortable: true },
  { key: 'actions', label: '', sortable: false },
];

export const AnimeTable: React.FC<AnimeTableProps> = ({
  anime,
  tags,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <SortIcon />;
    return sortOrder === 'asc' ? <SortAscIcon /> : <SortDescIcon />;
  };

  if (anime.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <EmptyIcon />
        <p className="mt-4 text-lg">No anime found</p>
        <p className="text-sm">Import your MAL XML to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full">
        <thead className="bg-slate-900 text-left">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-sm font-semibold text-slate-300 ${
                  col.sortable ? 'cursor-pointer hover:text-white select-none' : ''
                }`}
                onClick={() => col.sortable && onSort(col.key)}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {col.sortable && getSortIcon(col.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {anime.map((item) => (
            <AnimeRow key={item.id} anime={item} allTags={tags} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SortIcon = () => (
  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const SortAscIcon = () => (
  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
);

const SortDescIcon = () => (
  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
  </svg>
);

const EmptyIcon = () => (
  <svg className="w-16 h-16 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);
