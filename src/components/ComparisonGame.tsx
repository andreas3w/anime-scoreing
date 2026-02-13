'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from './ui/Button';
import type { AnimeWithTags } from '@/lib/prisma';

interface ComparisonGameProps {
  anime: AnimeWithTags[];
}

interface GameRound {
  left: AnimeWithTags;
  right: AnimeWithTags;
}

interface GameResult {
  left: AnimeWithTags;
  right: AnimeWithTags;
  choice: 'left' | 'right';
  isConsistent: boolean; // Did user's choice match their scores?
}

export const ComparisonGame: React.FC<ComparisonGameProps> = ({ anime }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [results, setResults] = useState<GameResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Filter anime with scores for the game
  const scoredAnime = useMemo(() => 
    anime.filter((a) => a.myScore > 0),
    [anime]
  );

  // Get a random pair of anime with different scores
  const getRandomPair = useCallback((): GameRound | null => {
    if (scoredAnime.length < 2) return null;

    // Try to find a pair with different scores
    let attempts = 0;
    while (attempts < 50) {
      const leftIndex = Math.floor(Math.random() * scoredAnime.length);
      let rightIndex = Math.floor(Math.random() * scoredAnime.length);
      
      // Make sure we pick different anime
      while (rightIndex === leftIndex) {
        rightIndex = Math.floor(Math.random() * scoredAnime.length);
      }

      const left = scoredAnime[leftIndex];
      const right = scoredAnime[rightIndex];

      // Prefer pairs with different scores for more interesting comparisons
      if (left.myScore !== right.myScore || attempts > 30) {
        return { left, right };
      }
      attempts++;
    }

    return null;
  }, [scoredAnime]);

  const startGame = useCallback(() => {
    setResults([]);
    setShowResults(false);
    setCurrentRound(getRandomPair());
    setIsOpen(true);
  }, [getRandomPair]);

  const handleChoice = useCallback((choice: 'left' | 'right') => {
    if (!currentRound) return;

    const { left, right } = currentRound;
    const chosenAnime = choice === 'left' ? left : right;
    const otherAnime = choice === 'left' ? right : left;

    // Check if choice is consistent with scores
    // Consistent if: chosen anime has higher or equal score
    const isConsistent = chosenAnime.myScore >= otherAnime.myScore;

    const result: GameResult = {
      left,
      right,
      choice,
      isConsistent,
    };

    setResults((prev) => [...prev, result]);

    // After 10 rounds, show results
    if (results.length >= 9) {
      setShowResults(true);
      setCurrentRound(null);
    } else {
      setCurrentRound(getRandomPair());
    }
  }, [currentRound, results.length, getRandomPair]);

  const handleClose = () => {
    setIsOpen(false);
    setCurrentRound(null);
    setResults([]);
    setShowResults(false);
  };

  const inconsistentResults = results.filter((r) => !r.isConsistent);
  const consistentCount = results.filter((r) => r.isConsistent).length;

  if (scoredAnime.length < 2) {
    return null; // Don't show button if not enough scored anime
  }

  return (
    <>
      <Button variant="secondary" onClick={startGame}>
        🎮 Comparison Game
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg w-full max-w-4xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white">Which one do you prefer?</h2>
                <p className="text-sm text-slate-400">
                  Round {results.length + 1} of 10
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                ✕
              </Button>
            </div>

            {/* Game Content */}
            <div className="p-6">
              {showResults ? (
                <ResultsView
                  results={results}
                  consistentCount={consistentCount}
                  inconsistentResults={inconsistentResults}
                  onPlayAgain={() => {
                    setResults([]);
                    setShowResults(false);
                    setCurrentRound(getRandomPair());
                  }}
                  onClose={handleClose}
                />
              ) : currentRound ? (
                <div className="grid grid-cols-2 gap-6">
                  <AnimeCard
                    anime={currentRound.left}
                    onClick={() => handleChoice('left')}
                  />
                  <AnimeCard
                    anime={currentRound.right}
                    onClick={() => handleChoice('right')}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400">Loading...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Anime card component for the game
interface AnimeCardProps {
  anime: AnimeWithTags;
  onClick: () => void;
  showScore?: boolean;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onClick, showScore = false }) => {
  return (
    <button
      onClick={onClick}
      className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-500 hover:bg-slate-750 transition-all cursor-pointer text-left group"
    >
      <div className="flex gap-4">
        {/* Cover Image */}
        <div className="flex-shrink-0 w-24 h-36 bg-slate-700 rounded overflow-hidden">
          {anime.imageUrl ? (
            <img
              src={anime.imageUrl}
              alt={anime.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              No Image
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
            {anime.title}
          </h3>
          {anime.titleEnglish && anime.titleEnglish !== anime.title && (
            <p className="text-sm text-slate-400 mt-1 line-clamp-1">
              {anime.titleEnglish}
            </p>
          )}
          
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
            {anime.type && <span>{anime.type}</span>}
            {anime.episodes && <span>• {anime.episodes} eps</span>}
            {anime.year && <span>• {anime.year}</span>}
          </div>

          {anime.synopsis && (
            <p className="mt-2 text-sm text-slate-400 line-clamp-3">
              {anime.synopsis}
            </p>
          )}

          {showScore && (
            <div className="mt-3">
              <span className="text-amber-400 font-bold text-lg">
                Score: {anime.myScore}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Click hint */}
      <div className="mt-4 text-center text-sm text-slate-500 group-hover:text-blue-400 transition-colors">
        Click to choose this one
      </div>
    </button>
  );
};

// Results view component
interface ResultsViewProps {
  results: GameResult[];
  consistentCount: number;
  inconsistentResults: GameResult[];
  onPlayAgain: () => void;
  onClose: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({
  results,
  consistentCount,
  inconsistentResults,
  onPlayAgain,
  onClose,
}) => {
  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <div className="text-center">
        <div className="text-4xl font-bold text-white mb-2">
          {consistentCount} / {results.length}
        </div>
        <p className="text-slate-400">
          {consistentCount === results.length
            ? '🎉 Perfect! Your scores are consistent!'
            : consistentCount >= results.length * 0.7
            ? '👍 Pretty good! Most of your scores match your preferences.'
            : '🤔 Interesting! You might want to revisit some scores.'}
        </p>
      </div>

      {/* Inconsistent Choices */}
      {inconsistentResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Potential scoring inconsistencies:
          </h3>
          <div className="space-y-6">
            {inconsistentResults.map((result, index) => {
              const chosen = result.choice === 'left' ? result.left : result.right;
              const notChosen = result.choice === 'left' ? result.right : result.left;
              
              return (
                <div
                  key={index}
                  className="bg-slate-800/50 rounded-lg p-4 border border-amber-700/50"
                >
                  <p className="text-sm text-amber-400 mb-4 text-center">
                    You preferred the lower-scored anime
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-emerald-400 mb-2 text-center font-medium">✓ You chose</p>
                      <AnimeCardStatic anime={chosen} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2 text-center font-medium">Over</p>
                      <AnimeCardStatic anime={notChosen} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-center pt-4">
        <Button onClick={onPlayAgain}>
          Play Again
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

// Static anime card for results (non-clickable, always shows score)
interface AnimeCardStaticProps {
  anime: AnimeWithTags;
}

const AnimeCardStatic: React.FC<AnimeCardStaticProps> = ({ anime }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
      <div className="flex gap-3">
        {/* Cover Image */}
        <div className="flex-shrink-0 w-16 h-24 bg-slate-700 rounded overflow-hidden">
          {anime.imageUrl ? (
            <img
              src={anime.imageUrl}
              alt={anime.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
              No Image
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <a
            href={`https://myanimelist.net/anime/${anime.malId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white text-sm line-clamp-2 hover:text-blue-400 transition-colors"
          >
            {anime.title}
          </a>
          {anime.titleEnglish && anime.titleEnglish !== anime.title && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {anime.titleEnglish}
            </p>
          )}
          
          <div className="mt-1 flex flex-wrap gap-1 text-xs text-slate-400">
            {anime.type && <span>{anime.type}</span>}
            {anime.episodes && <span>• {anime.episodes} eps</span>}
            {anime.year && <span>• {anime.year}</span>}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-amber-400 font-bold">
              Score: {anime.myScore}
            </span>
            <a
              href={`https://myanimelist.net/ownlist/anime/${anime.malId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Edit on MAL →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
