'use client';

import { useState, useRef, useTransition } from 'react';
import { Button } from './ui/Button';
import { importMalXml } from '@/app/actions';
import type { ImportResult } from '@/lib/prisma';

interface ImportButtonProps {
  onImportComplete?: (result: ImportResult) => void;
}

export const ImportButton: React.FC<ImportButtonProps> = ({ onImportComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    
    if (!file || file.size === 0) {
      setError('Please select a file');
      return;
    }

    startTransition(async () => {
      try {
        const res = await importMalXml(formData);
        setResult(res);
        onImportComplete?.(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed');
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setResult(null);
    setError(null);
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Import MAL XML
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-lg w-96 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Import MAL Export</h2>

            {result ? (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-600 flex items-center justify-center">
                  <CheckIcon />
                </div>
                <p className="text-emerald-400 mb-4">Import complete!</p>
                <div className="text-slate-300 space-y-1 mb-4">
                  <p>Created: {result.created}</p>
                  <p>Updated: {result.updated}</p>
                  {result.failed > 0 && <p className="text-red-400">Failed: {result.failed}</p>}
                </div>
                <Button variant="secondary" onClick={handleClose}>
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-2">
                    Select your MAL export XML file
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    name="file"
                    accept=".xml"
                    className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Importing...' : 'Import'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const CheckIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
