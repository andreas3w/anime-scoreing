'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/Button';
import { parseMalXml, revalidateAnimePage } from '@/app/actions';
import type { ParsedMalEntry } from '@/app/actions';
import type { ImportResult } from '@/lib/colors';

interface ImportButtonProps {
  onImportComplete?: (result: ImportResult) => void;
}

type ImportState = 'idle' | 'parsing' | 'importing' | 'paused' | 'complete';

const BATCH_SIZE = 25;

export const ImportButton: React.FC<ImportButtonProps> = ({ onImportComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<ImportState>('idle');
  const [total, setTotal] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [currentAnime, setCurrentAnime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Refs for async loop
  const stateRef = useRef(state);
  const indexRef = useRef(0);
  const entriesRef = useRef<ParsedMalEntry[]>([]);
  const isImportingRef = useRef(false);

  useEffect(() => { stateRef.current = state; }, [state]);

  // Import entries in batches via API route (avoids RSC overhead)
  const importNextBatch = useCallback(async () => {
    if (isImportingRef.current) return;
    if (stateRef.current !== 'importing') return;

    const list = entriesRef.current;
    const idx = indexRef.current;

    if (idx >= list.length) {
      setState('complete');
      return;
    }

    isImportingRef.current = true;
    const batch = list.slice(idx, idx + BATCH_SIZE);
    const lastEntry = batch[batch.length - 1];
    setCurrentAnime(lastEntry?.title ?? null);

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: batch }),
      });

      if (stateRef.current !== 'importing') {
        isImportingRef.current = false;
        return;
      }

      if (response.ok) {
        const result = await response.json() as { created: number; updated: number; failed: number };
        setCreatedCount(prev => prev + result.created);
        setUpdatedCount(prev => prev + result.updated);
        setFailedCount(prev => prev + result.failed);
      } else {
        setFailedCount(prev => prev + batch.length);
      }
    } catch {
      setFailedCount(prev => prev + batch.length);
    }

    const nextIdx = idx + batch.length;
    indexRef.current = nextIdx;
    isImportingRef.current = false;

    if (stateRef.current === 'importing' && nextIdx < list.length) {
      setTimeout(() => importNextBatch(), 20);
    } else if (nextIdx >= list.length) {
      setState('complete');
    }
  }, []);

  // Start importing when state changes to 'importing'
  useEffect(() => {
    if (state === 'importing' && !isImportingRef.current) {
      importNextBatch();
    }
  }, [state, importNextBatch]);

  // Single click: parse + immediately start importing
  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      setError('Please select a file');
      return;
    }

    // Reset counters
    setCreatedCount(0);
    setUpdatedCount(0);
    setFailedCount(0);
    setCurrentAnime(null);
    indexRef.current = 0;
    isImportingRef.current = false;

    // Show parsing spinner on button
    setState('parsing');

    // Parse first (fast, server action), then start importing
    try {
      const parsed = await parseMalXml(formData);
      if (parsed.length === 0) {
        setError('No anime entries found in the file');
        setState('idle');
        return;
      }
      // Set entries BEFORE setting state to 'importing'
      // so the useEffect sees data when it fires
      entriesRef.current = parsed;
      setTotal(parsed.length);
      setState('importing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setState('idle');
    }
  };

  const handlePause = () => {
    setState('paused');
  };

  const handleResume = () => {
    setState('importing');
  };

  const handleClose = async () => {
    const created = createdCount;
    const updated = updatedCount;
    const failed = failedCount;
    const totalEntries = total;

    setState('idle');
    stateRef.current = 'idle';
    isImportingRef.current = false;
    setIsOpen(false);
    entriesRef.current = [];
    indexRef.current = 0;
    setTotal(0);
    setCreatedCount(0);
    setUpdatedCount(0);
    setFailedCount(0);
    setCurrentAnime(null);
    setError(null);
    if (fileRef.current) {
      fileRef.current.value = '';
    }

    if (created > 0 || updated > 0) {
      onImportComplete?.({ created, updated, failed, total: totalEntries });
      await revalidateAnimePage();
    }
  };

  const processed = createdCount + updatedCount + failedCount;
  const remaining = total - processed;
  const progressPercent = total > 0 ? (processed / total) * 100 : 0;

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Import MAL XML
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-lg w-[500px] border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Import MAL Export</h2>

            {/* Idle / Parsing - File Selection + Import */}
            {(state === 'idle' || state === 'parsing') && (
              <form onSubmit={handleImport}>
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-2">
                    Select your MAL export XML file
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    name="file"
                    accept=".xml"
                    disabled={state === 'parsing'}
                    className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-700 file:text-white hover:file:bg-slate-600 disabled:opacity-50"
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" onClick={handleClose} disabled={state === 'parsing'}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={state === 'parsing'}>
                    {state === 'parsing' ? (
                      <span className="flex items-center gap-2">
                        <LoadingIcon className="w-4 h-4" />
                        Importing...
                      </span>
                    ) : 'Import'}
                  </Button>
                </div>
              </form>
            )}

            {/* Importing / Paused - progress UI */}
            {(state === 'importing' || state === 'paused') && (
              <div>
                {/* Progress Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{createdCount}</div>
                    <div className="text-xs text-slate-400">Created</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{updatedCount}</div>
                    <div className="text-xs text-slate-400">Updated</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-400">{failedCount}</div>
                    <div className="text-xs text-slate-400">Failed</div>
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
                    {remaining} remaining
                  </div>
                </div>

                {/* Currently importing */}
                {currentAnime && (
                  <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                      {state === 'importing' && (
                        <LoadingIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      )}
                      {state === 'paused' && (
                        <PauseIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-500 mb-0.5">
                          {state === 'importing' ? 'Importing:' : 'Paused at:'}
                        </div>
                        <div className="text-sm text-white truncate">{currentAnime}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-2 justify-end">
                  {state === 'importing' ? (
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

            {/* Complete */}
            {state === 'complete' && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-600 flex items-center justify-center">
                  <CheckIcon className="w-8 h-8" />
                </div>
                <p className="text-emerald-400 text-lg mb-4">Import Complete!</p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-400">{createdCount}</div>
                    <div className="text-sm text-slate-400">Created</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-400">{updatedCount}</div>
                    <div className="text-sm text-slate-400">Updated</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-amber-400">{failedCount}</div>
                    <div className="text-sm text-slate-400">Failed</div>
                  </div>
                </div>

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

const PauseIcon = ({ className = "w-6 h-6 text-white" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);
