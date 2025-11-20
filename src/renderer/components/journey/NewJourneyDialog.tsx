/**
 * NewJourneyDialog Component
 * Modal for creating a new exploration journey
 */

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ipcClient } from '@/services/ipc/IPCClient';
import { useAppStore } from '@/store/useAppStore';
import { ExplorationEngine } from '@/lib/engine/ExplorationEngine';

interface NewJourneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewJourneyDialog({ open, onOpenChange }: NewJourneyDialogProps): React.ReactElement {
  const [input, setInput] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [stageLimit, setStageLimit] = React.useState<number>(8); // Default: 8 stages
  const [manualMode, setManualMode] = React.useState(false); // Continue until user stops

  const addJourney = useAppStore((state) => state.addJourney);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      setError('Please enter a topic or question');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Create journey in database with custom settings
      const journey = await ipcClient.createJourney(input.trim());

      // Update journey settings based on user selection
      const updatedSettings = {
        ...journey.settings,
        maxStages: manualMode ? 999 : stageLimit, // 999 for manual mode (effectively unlimited)
        autoContinue: !manualMode, // Auto-continue unless in manual mode
      };

      // Update in database (only send the settings that changed)
      const updatedJourney = await ipcClient.updateJourney({
        ...journey,
        settings: updatedSettings,
      });

      addJourney(updatedJourney);

      // Start the ExplorationEngine to execute the journey
      console.log(`🚀 Starting ExplorationEngine for journey: ${journey.id} (maxStages: ${updatedJourney.settings.maxStages}, manual: ${manualMode})`);
      const engine = new ExplorationEngine(journey.id, {
        maxDepth: updatedJourney.settings.maxStages,
        autoProgress: updatedJourney.settings.autoContinue,
        extendedThinking: updatedJourney.settings.extendedThinking,
      });

      // Start the first stage asynchronously (don't await - let it run in background)
      engine.start(input.trim()).catch((err) => {
        console.error('ExplorationEngine failed:', err);
      });

      onOpenChange(false);
      setInput('');
      setStageLimit(8); // Reset to default
      setManualMode(false); // Reset to default
    } catch (err) {
      console.error('Failed to create journey:', err);
      setError('Failed to create journey. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm"
          />
        </Dialog.Overlay>

        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg max-h-[70vh] rounded-lg bg-white shadow-xl flex flex-col overflow-hidden">

            {/* Fixed Header */}
            <div className="p-6 pb-4 flex-shrink-0">
              <div className="mb-4 flex items-center justify-between">
                <Dialog.Title className="text-2xl font-semibold text-gray-900">
                  Start New Journey
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" aria-label="Close">
                    <X className="h-5 w-5" />
                  </Button>
                </Dialog.Close>
              </div>

              <Dialog.Description className="text-sm text-gray-600">
                Enter a topic, question, or problem to explore. Perpetua will guide you through
                an intelligent exploration journey with multiple stages of discovery.
                <span className="block mt-2 text-xs text-primary-600 font-medium">
                  ✨ The final stage will be a comprehensive summary with actionable insights
                </span>
              </Dialog.Description>
            </div>

            {/* Scrollable Content */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="px-6 overflow-y-auto flex-1 space-y-4">
              <Input
                label="What should we explore?"
                placeholder="e.g., How can AI improve healthcare accessibility?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                error={error}
                autoFocus
                disabled={isCreating}
              />

              {/* Journey Length Options */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Journey Length
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setStageLimit(4); setManualMode(false); }}
                    disabled={isCreating}
                    className={`px-3 py-2 text-sm font-medium rounded-md border-2 transition-colors ${
                      !manualMode && stageLimit === 4
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    Quick (4 stages)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStageLimit(8); setManualMode(false); }}
                    disabled={isCreating}
                    className={`px-3 py-2 text-sm font-medium rounded-md border-2 transition-colors ${
                      !manualMode && stageLimit === 8
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    Standard (8 stages)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStageLimit(12); setManualMode(false); }}
                    disabled={isCreating}
                    className={`px-3 py-2 text-sm font-medium rounded-md border-2 transition-colors ${
                      !manualMode && stageLimit === 12
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    Deep (12 stages)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStageLimit(16); setManualMode(false); }}
                    disabled={isCreating}
                    className={`px-3 py-2 text-sm font-medium rounded-md border-2 transition-colors ${
                      !manualMode && stageLimit === 16
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    Thorough (16 stages)
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setManualMode(!manualMode)}
                  disabled={isCreating}
                  className={`w-full px-3 py-2 text-sm font-medium rounded-md border-2 transition-colors ${
                    manualMode
                      ? 'border-accent-500 bg-accent-50 text-accent-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  } disabled:opacity-50`}
                >
                  {manualMode ? '✓ Manual Mode: Continue until I stop' : 'Manual Mode: Continue until I stop'}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  {manualMode
                    ? 'Journey will continue until you stop it. A summary will be created when you stop.'
                    : `Journey will include ${stageLimit - 1} exploration stages + 1 summary stage = ${stageLimit} total`}
                </p>
              </div>
              </div>

              {/* Fixed Footer with Buttons */}
              <div className="p-6 pt-4 border-t border-gray-100 flex-shrink-0 flex justify-end gap-2">
                <Dialog.Close asChild>
                  <Button type="button" variant="ghost" disabled={isCreating}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button type="submit" disabled={isCreating || !input.trim()}>
                  {isCreating ? 'Starting...' : 'Start Journey'}
                </Button>
              </div>
            </form>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
