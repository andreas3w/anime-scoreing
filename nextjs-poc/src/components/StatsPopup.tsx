'use client';

import { useState, useMemo } from 'react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import type { AnimeWithTags, Tag } from '@/lib/prisma';
import { getColor } from '@/lib/prisma';

interface StatsPopupProps {
  anime: AnimeWithTags[];
  tags: Tag[];
}

interface TagStats {
  tag: Tag;
  count: number;
  avgScore: number;
}

export const StatsPopup: React.FC<StatsPopupProps> = ({ anime, tags }) => {
  const [isOpen, setIsOpen] = useState(false);

  const stats = useMemo(() => {
    // Filter anime with scores
    const scoredAnime = anime.filter((a) => a.myScore > 0);
    const totalAnime = anime.length;
    const totalScored = scoredAnime.length;

    // Calculate average score
    const avgScore = totalScored > 0
      ? scoredAnime.reduce((sum, a) => sum + a.myScore, 0) / totalScored
      : 0;

    // Calculate score distribution
    const scoreDistribution: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) {
      scoreDistribution[i] = scoredAnime.filter((a) => a.myScore === i).length;
    }

    // Find most common score
    const mostCommonScore = Object.entries(scoreDistribution)
      .sort(([, a], [, b]) => b - a)[0];

    // Calculate tag statistics (excluding status, type, studio)
    const tagStatsMap = new Map<number, { count: number; totalScore: number; scoredCount: number }>();
    
    for (const a of anime) {
      for (const at of a.tags) {
        // Skip status, type, and studio tags
        if (at.tag.isStatus || at.tag.isType || at.tag.isStudio) continue;

        const existing = tagStatsMap.get(at.tag.id) || { count: 0, totalScore: 0, scoredCount: 0 };
        existing.count++;
        if (a.myScore > 0) {
          existing.totalScore += a.myScore;
          existing.scoredCount++;
        }
        tagStatsMap.set(at.tag.id, existing);
      }
    }

    // Calculate studio statistics separately
    const studioStatsMap = new Map<number, { count: number; totalScore: number; scoredCount: number }>();
    
    for (const a of anime) {
      for (const at of a.tags) {
        if (!at.tag.isStudio) continue;

        const existing = studioStatsMap.get(at.tag.id) || { count: 0, totalScore: 0, scoredCount: 0 };
        existing.count++;
        if (a.myScore > 0) {
          existing.totalScore += a.myScore;
          existing.scoredCount++;
        }
        studioStatsMap.set(at.tag.id, existing);
      }
    }

    // Convert to array and calculate averages
    const tagStats: TagStats[] = [];
    for (const [tagId, data] of tagStatsMap) {
      const tag = tags.find((t) => t.id === tagId);
      if (tag) {
        tagStats.push({
          tag,
          count: data.count,
          avgScore: data.scoredCount > 0 ? data.totalScore / data.scoredCount : 0,
        });
      }
    }

    // Calculate studio statistics
    const studioStats: TagStats[] = [];
    for (const [tagId, data] of studioStatsMap) {
      const tag = tags.find((t) => t.id === tagId);
      if (tag && data.scoredCount >= 2) { // Min 2 scored anime
        const studioAvgScore = data.totalScore / data.scoredCount;
        studioStats.push({
          tag,
          count: data.scoredCount,
          avgScore: studioAvgScore,
        });
      }
    }

    // Use Bayesian average to rank studios fairly
    // Formula: (count × avgScore + m × globalAvg) / (count + m)
    // This pulls small sample sizes toward the global average
    const m = 5; // Minimum votes before score is trusted
    const bestStudios = studioStats
      .map((s) => ({
        ...s,
        // Bayesian weighted score - studios with few shows get pulled toward global avg
        weightedScore: (s.count * s.avgScore + m * avgScore) / (s.count + m),
      }))
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, 5);

    // Sort by count and get top 5
    const topTags = tagStats.sort((a, b) => b.count - a.count).slice(0, 5);

    // Get highest rated tags (min 3 anime)
    const highestRatedTags = tagStats
      .filter((t) => t.count >= 3)
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    // Total watch time estimate (assuming ~24 min per episode)
    const totalEpisodes = anime.reduce((sum, a) => sum + (a.myWatchedEpisodes || 0), 0);
    const totalHours = Math.round((totalEpisodes * 24) / 60);
    const totalDays = (totalHours / 24).toFixed(1);

    return {
      totalAnime,
      totalScored,
      avgScore,
      scoreDistribution,
      mostCommonScore: mostCommonScore ? { score: parseInt(mostCommonScore[0]), count: mostCommonScore[1] } : null,
      topTags,
      highestRatedTags,
      bestStudios,
      totalEpisodes,
      totalHours,
      totalDays,
    };
  }, [anime, tags]);

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        📊 Stats
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg w-full max-w-4xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">📊 Your Anime Stats</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                ✕
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Hero Stats */}
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  label="Average Score"
                  value={stats.avgScore.toFixed(2)}
                  icon="⭐"
                  highlight
                />
                <StatCard
                  label="Total Anime"
                  value={stats.totalAnime.toString()}
                  icon="📺"
                />
                <StatCard
                  label="Scored"
                  value={stats.totalScored.toString()}
                  icon="✓"
                />
              </div>

              {/* Watch Time */}
              <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-4 border border-blue-700/50">
                <h3 className="text-sm text-slate-400 mb-2">Total Watch Time</h3>
                <div className="flex items-baseline gap-4">
                  <div>
                    <span className="text-3xl font-bold text-white">{stats.totalEpisodes.toLocaleString()}</span>
                    <span className="text-slate-400 ml-2">episodes</span>
                  </div>
                  <div className="text-slate-500">≈</div>
                  <div>
                    <span className="text-2xl font-semibold text-blue-400">{stats.totalHours.toLocaleString()}</span>
                    <span className="text-slate-400 ml-2">hours</span>
                  </div>
                  <div className="text-slate-500">≈</div>
                  <div>
                    <span className="text-2xl font-semibold text-purple-400">{stats.totalDays}</span>
                    <span className="text-slate-400 ml-2">days</span>
                  </div>
                </div>
              </div>

              {/* Score Distribution */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm text-slate-400 mb-3">Score Distribution</h3>
                <div className="flex gap-1">
                  {Object.entries(stats.scoreDistribution).map(([score, count]) => {
                    const maxCount = Math.max(...Object.values(stats.scoreDistribution));
                    const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    const isHighest = count === maxCount && count > 0;
                    
                    return (
                      <div key={score} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-slate-400">{count}</span>
                        <div className="w-full h-20 flex items-end">
                          <div
                            className={`w-full rounded-t transition-all ${
                              isHighest ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                            style={{ height: `${Math.max(heightPercent, 4)}%` }}
                          />
                        </div>
                        <span className="text-xs text-amber-400 font-semibold">{score}</span>
                      </div>
                    );
                  })}
                </div>
                {stats.mostCommonScore && (
                  <p className="text-center text-sm text-slate-400 mt-3">
                    Most common score: <span className="text-amber-400 font-semibold">{stats.mostCommonScore.score}</span>
                    {' '}({stats.mostCommonScore.count} anime)
                  </p>
                )}
              </div>

              {/* Top Tags */}
              <div className="grid grid-cols-3 gap-6">
                {/* Most Watched */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">🏆 Top Genres/Tags</h3>
                  <div className="space-y-3">
                    {stats.topTags.map((ts, index) => (
                      <div key={ts.tag.id} className="flex items-center gap-3">
                        <span className="text-lg font-bold text-slate-500 w-6">
                          {index + 1}
                        </span>
                        <Badge color={getColor(ts.tag.colorKey)}>
                          {ts.tag.name}
                        </Badge>
                        <span className="text-slate-400 text-sm ml-auto">
                          {ts.count}
                        </span>
                      </div>
                    ))}
                    {stats.topTags.length === 0 && (
                      <p className="text-slate-500 text-sm">No tags found</p>
                    )}
                  </div>
                </div>

                {/* Highest Rated */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">⭐ Highest Rated Tags</h3>
                  <p className="text-xs text-slate-500 -mt-3 mb-3">(min. 3 anime)</p>
                  <div className="space-y-3">
                    {stats.highestRatedTags.map((ts, index) => (
                      <div key={ts.tag.id} className="flex items-center gap-3">
                        <span className="text-lg font-bold text-slate-500 w-6">
                          {index + 1}
                        </span>
                        <Badge color={getColor(ts.tag.colorKey)}>
                          {ts.tag.name}
                        </Badge>
                        <span className="text-amber-400 text-sm ml-auto font-semibold">
                          {ts.avgScore.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {stats.highestRatedTags.length === 0 && (
                      <p className="text-slate-500 text-sm">Not enough data</p>
                    )}
                  </div>
                </div>

                {/* Best Studios */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">🎬 Best Studios</h3>
                  <p className="text-xs text-slate-500 -mt-3 mb-3">(weighted avg)</p>
                  <div className="space-y-3">
                    {stats.bestStudios.map((ts, index) => (
                      <div key={ts.tag.id} className="flex items-center gap-3">
                        <span className="text-lg font-bold text-slate-500 w-6">
                          {index + 1}
                        </span>
                        <Badge color={getColor(ts.tag.colorKey)}>
                          {ts.tag.name}
                        </Badge>
                        <div className="ml-auto text-right">
                          <span className="text-amber-400 text-sm font-semibold">
                            {ts.weightedScore.toFixed(2)}
                          </span>
                          <span className="text-slate-500 text-xs ml-1">
                            ({ts.count})
                          </span>
                        </div>
                      </div>
                    ))}
                    {stats.bestStudios.length === 0 && (
                      <p className="text-slate-500 text-sm">Not enough data</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Stat card component
interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, highlight }) => {
  return (
    <div
      className={`rounded-lg p-4 text-center ${
        highlight
          ? 'bg-gradient-to-br from-amber-900/50 to-orange-900/50 border border-amber-700/50'
          : 'bg-slate-800 border border-slate-700'
      }`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-amber-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
};
