'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from './ui/Button';
import { getAnimeMissingData, fetchSingleAnimeData, revalidateAnimePage } from '@/app/actions';

interface AnimeToFetch {
  id: number;
  malId: number;
  title: string;
}

interface FetchedAnime {
  title: string;
  titleEnglish?: string | null;
  titleJapanese?: string | null;
  imageUrl?: string | null;
  success: boolean;
}

type FetchState = 'idle' | 'loading-list' | 'fetching' | 'paused' | 'complete';

// Persist fetch state across hot reloads (dev only)
interface PersistedState {
  isOpen: boolean;
  state: FetchState;
  animeToFetch: AnimeToFetch[];
  currentIndex: number;
  fetchedCount: number;
  failedCount: number;
  recentImages: FetchedAnime[];
  currentAnime: string | null;
}

// Module-level state that survives hot reloads
let persistedState: PersistedState | null = null;

export const FetchTitlesButton: React.FC = () => {
  // Initialize from persisted state if available (for hot reload recovery)
  const [isOpen, setIsOpen] = useState(persistedState?.isOpen ?? false);
  const [state, setState] = useState<FetchState>(persistedState?.state ?? 'idle');
  const [animeToFetch, setAnimeToFetch] = useState<AnimeToFetch[]>(persistedState?.animeToFetch ?? []);
  const [currentIndex, setCurrentIndex] = useState(persistedState?.currentIndex ?? 0);
  const [fetchedCount, setFetchedCount] = useState(persistedState?.fetchedCount ?? 0);
  const [failedCount, setFailedCount] = useState(persistedState?.failedCount ?? 0);
  const [recentImages, setRecentImages] = useState<FetchedAnime[]>(persistedState?.recentImages ?? []);
  const [currentAnime, setCurrentAnime] = useState<string | null>(persistedState?.currentAnime ?? null);

  // Persist state for hot reload recovery
  useEffect(() => {
    persistedState = {
      isOpen,
      state,
      animeToFetch,
      currentIndex,
      fetchedCount,
      failedCount,
      recentImages,
      currentAnime,
    };
  }, [isOpen, state, animeToFetch, currentIndex, fetchedCount, failedCount, recentImages, currentAnime]);

  // Use refs to track current values in async callbacks without causing re-renders
  const stateRef = useRef(state);
  const indexRef = useRef(currentIndex);
  const listRef = useRef(animeToFetch);
  const isFetchingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { indexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { listRef.current = animeToFetch; }, [animeToFetch]);

  // Load the list of anime that need fetching
  const loadAnimeList = useCallback(async () => {
    setState('loading-list');
    try {
      const list = await getAnimeMissingData();
      setAnimeToFetch(list);
      listRef.current = list;
      setCurrentIndex(0);
      indexRef.current = 0;
      setFetchedCount(0);
      setFailedCount(0);
      setRecentImages([]);
      if (list.length === 0) {
        setState('complete');
      } else {
        setState('idle');
      }
    } catch (error) {
      console.error('Failed to load anime list:', error);
      setState('idle');
    }
  }, []);

  // Fetch a single anime and schedule next
  const fetchNext = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    
    // Check if we should still be fetching
    if (stateRef.current !== 'fetching') return;
    
    const list = listRef.current;
    const idx = indexRef.current;
    
    if (idx >= list.length) {
      setState('complete');
      // Don't revalidate during fetch - user can close modal to refresh
      return;
    }

    isFetchingRef.current = true;
    const anime = list[idx];
    setCurrentAnime(anime.title);

    try {
      const result = await fetchSingleAnimeData(anime.id);
      
      // Check if still fetching (user might have paused/cancelled)
      if (stateRef.current !== 'fetching') {
        isFetchingRef.current = false;
        return;
      }
      
      if (result?.success) {
        setFetchedCount(prev => prev + 1);
        // Add to recent images (keep last 5)
        setRecentImages(prev => {
          const newImages = [...prev, {
            title: result.title || anime.title,
            titleEnglish: result.titleEnglish,
            titleJapanese: result.titleJapanese,
            imageUrl: result.imageUrl,
            success: true,
          }];
          return newImages.slice(-5);
        });
      } else {
        setFailedCount(prev => prev + 1);
      }
    } catch (error) {
      console.error(`Failed to fetch ${anime.title}:`, error);
      setFailedCount(prev => prev + 1);
    }

    // Update index
    const nextIdx = idx + 1;
    setCurrentIndex(nextIdx);
    indexRef.current = nextIdx;
    isFetchingRef.current = false;
    
    // Schedule next fetch if still fetching
    if (stateRef.current === 'fetching' && nextIdx < list.length) {
      setTimeout(() => {
        fetchNext();
      }, 1500);
    } else if (nextIdx >= list.length) {
      setState('complete');
    }
  }, []);

  // Start fetching when state changes to 'fetching'
  useEffect(() => {
    if (state === 'fetching' && !isFetchingRef.current) {
      fetchNext();
    }
  }, [state, fetchNext]);

  // Start fetching
  const handleStart = () => {
    setState('fetching');
  };

  // Pause fetching
  const handlePause = () => {
    setState('paused');
  };

  // Resume fetching
  const handleResume = () => {
    setState('fetching');
  };

  // Close and reset
  const handleClose = async () => {
    const hadProgress = fetchedCount > 0 || failedCount > 0;
    setState('idle');
    stateRef.current = 'idle';
    isFetchingRef.current = false;
    setIsOpen(false);
    setAnimeToFetch([]);
    listRef.current = [];
    setCurrentIndex(0);
    indexRef.current = 0;
    setFetchedCount(0);
    setFailedCount(0);
    setRecentImages([]);
    setCurrentAnime(null);
    
    // Clear persisted state
    persistedState = null;
    
    // Revalidate page if we fetched any data
    if (hadProgress) {
      await revalidateAnimePage();
    }
  };

  // Load list when modal opens
  useEffect(() => {
    if (isOpen && animeToFetch.length === 0 && state === 'idle') {
      loadAnimeList();
    }
  }, [isOpen, animeToFetch.length, state, loadAnimeList]);

  const total = animeToFetch.length;
  const processed = fetchedCount + failedCount;
  const remaining = total - processed;
  const progressPercent = total > 0 ? (processed / total) * 100 : 0;

  // Estimated time remaining
  const estimatedSeconds = remaining * 1.5;
  const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        Fetch MAL Data
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-lg w-[500px] border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Fetch MAL Data</h2>

            {state === 'loading-list' && (
              <div className="text-center py-8">
                <LoadingIcon className="w-8 h-8 mx-auto mb-4 text-blue-400" />
                <p className="text-slate-400">Loading anime list...</p>
              </div>
            )}

            {state === 'idle' && total === 0 && (
              <div className="text-center py-8">
                <CheckIcon className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                <p className="text-emerald-400 mb-4">All anime data is up to date!</p>
                <Button variant="secondary" onClick={handleClose}>
                  Close
                </Button>
              </div>
            )}

            {state === 'idle' && total > 0 && (
              <div>
                <p className="text-slate-300 mb-4">
                  Found <span className="text-white font-bold">{total}</span> anime that need data from MyAnimeList.
                </p>
                <p className="text-slate-400 text-sm mb-4">
                  This will fetch English titles, Japanese titles, and cover images.
                </p>
                <p className="text-amber-400 text-sm mb-4">
                  ⚠️ Estimated time: ~{estimatedMinutes} minute{estimatedMinutes !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleStart}>
                    Start Fetch
                  </Button>
                </div>
              </div>
            )}

            {(state === 'fetching' || state === 'paused') && (
              <div>
                {/* Progress Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{fetchedCount}</div>
                    <div className="text-xs text-slate-400">Fetched</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-400">{failedCount}</div>
                    <div className="text-xs text-slate-400">Failed</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-slate-300">{remaining}</div>
                    <div className="text-xs text-slate-400">Remaining</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-slate-300">{processed} / {total}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    ~{estimatedMinutes} minute{estimatedMinutes !== 1 ? 's' : ''} remaining
                  </div>
                </div>

                {/* Featured Image with Slideshow */}
                <div className="mb-4">
                  {recentImages.length > 0 ? (
                    <div className="flex gap-4">
                      {/* Main Featured Image */}
                      <div className="flex-shrink-0">
                        <div className="relative w-24 h-36 bg-slate-800 rounded-lg overflow-hidden border-2 border-blue-500/50 shadow-lg shadow-blue-500/20">
                          {recentImages.map((anime, idx) => (
                            <div
                              key={anime.title + idx}
                              className="absolute inset-0 transition-all duration-500 ease-in-out"
                              style={{
                                opacity: idx === recentImages.length - 1 ? 1 : 0,
                                transform: idx === recentImages.length - 1 ? 'scale(1)' : 'scale(0.95)',
                              }}
                            >
                              {anime.imageUrl ? (
                                <img
                                  src={anime.imageUrl}
                                  alt={anime.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                  <ImagePlaceholderIcon />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {/* Fetch Progress Bar under image */}
                        {state === 'fetching' && (
                          <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 animate-progress-bar"
                              style={{ animationDuration: '1.5s' }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Info Panel */}
                      <div className="flex-1 min-w-0">
                        {/* Current/Last Fetched Info */}
                        <div className="mb-3">
                          <div className="text-xs text-slate-500 mb-1">
                            {state === 'fetching' && currentAnime ? 'Now fetching:' : 'Last fetched:'}
                          </div>
                          <div className="text-sm font-medium text-white truncate">
                            {state === 'fetching' && currentAnime 
                              ? currentAnime 
                              : recentImages[recentImages.length - 1]?.titleEnglish || recentImages[recentImages.length - 1]?.title}
                          </div>
                          {recentImages[recentImages.length - 1] && (
                            <div className="text-xs text-slate-400 truncate mt-0.5">
                              {recentImages[recentImages.length - 1]?.titleJapanese}
                            </div>
                          )}
                        </div>

                        {/* Thumbnail History */}
                        <div className="text-xs text-slate-500 mb-1.5">Recent:</div>
                        <div className="flex gap-1.5">
                          {recentImages.slice(0, -1).map((anime, idx) => (
                            <div 
                              key={anime.title + idx}
                              className="relative group transition-all duration-300 ease-out"
                              style={{
                                opacity: 0.4 + (idx / Math.max(recentImages.length - 1, 1)) * 0.5,
                                transform: `scale(${0.85 + (idx / Math.max(recentImages.length - 1, 1)) * 0.15})`,
                              }}
                            >
                              <div className="w-10 h-14 bg-slate-800 rounded overflow-hidden border border-slate-700">
                                {anime.imageUrl ? (
                                  <img
                                    src={anime.imageUrl}
                                    alt={anime.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                                    ?
                                  </div>
                                )}
                              </div>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-[120px] truncate">
                                {anime.titleEnglish || anime.title}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Placeholder when no images yet */
                    state === 'fetching' && currentAnime && (
                      <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="w-12 h-16 bg-slate-700 rounded flex items-center justify-center">
                          <LoadingIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-500 mb-1">Fetching:</div>
                          <div className="text-sm text-slate-300 truncate">{currentAnime}</div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Controls */}
                <div className="flex gap-2 justify-end">
                  {state === 'fetching' ? (
                    <Button variant="secondary" onClick={handlePause}>
                      Pause
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={handleResume}>
                      Resume
                    </Button>
                  )}
                  <Button variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {state === 'complete' && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-600 flex items-center justify-center">
                  <CheckIcon className="w-8 h-8" />
                </div>
                <p className="text-emerald-400 text-lg mb-4">Fetch Complete!</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-800 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-400">{fetchedCount}</div>
                    <div className="text-sm text-slate-400">Successfully Updated</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-amber-400">{failedCount}</div>
                    <div className="text-sm text-slate-400">Failed</div>
                  </div>
                </div>

                {/* Final Image Gallery */}
                {recentImages.length > 0 && (
                  <div className="mb-6">
                    <div className="text-xs text-slate-500 mb-2">Last fetched:</div>
                    <div className="flex gap-2 justify-center">
                      {recentImages.map((anime, idx) => (
                        <div key={idx} className="w-12 h-16 bg-slate-800 rounded overflow-hidden border border-slate-700">
                          {anime.imageUrl ? (
                            <img
                              src={anime.imageUrl}
                              alt={anime.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                              ?
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={handleClose}>
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const CheckIcon = ({ className = "w-6 h-6 text-white" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const LoadingIcon = ({ className = "w-6 h-6 text-white" }: { className?: string }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const ImagePlaceholderIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
