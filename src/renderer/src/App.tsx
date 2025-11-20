/**
 * Main Application Component
 * Entry point for Perpetua React application
 */

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import { History, Menu } from 'lucide-react';
import { Stream } from '@/components/journey/Stream';
import { ControlPanel } from '@/components/journey/ControlPanel';
import { JourneyList } from '@/components/journey/JourneyList';
import { ArtifactViewer } from '@/components/artifact/ArtifactViewer';
import { NewJourneyDialog } from '@/components/journey/NewJourneyDialog';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { PageGeneratorDialog } from '@/components/pages/PageGeneratorDialog';
import { PageViewer } from '@/components/pages/PageViewer';
import { LoadingOverlay } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { ipcClient } from '@/services/ipc/IPCClient';
import { claudeService } from '@/services/claude/ClaudeService';
import type { Artifact, Journey, Page } from '@/types';

export function App(): React.ReactElement {
  const [isLoading, setIsLoading] = React.useState(true);
  const [showNewJourney, setShowNewJourney] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showPageDialog, setShowPageDialog] = React.useState(false);
  const [viewingPage, setViewingPage] = React.useState<Page | null>(null);
  const [allJourneys, setAllJourneys] = React.useState<Journey[]>([]);

  const currentJourney = useAppStore((state) => state.currentJourney);
  const selectedArtifact = useAppStore((state) => state.selectedArtifact);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);

  const setCurrentJourney = useAppStore((state) => state.setCurrentJourney);
  const setSelectedArtifact = useAppStore((state) => state.setSelectedArtifact);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const removeJourney = useAppStore((state) => state.removeJourney);

  // Initialize app
  React.useEffect(() => {
    async function initialize() {
      try {
        // Initialize IPC if available
        if (ipcClient.isAvailable()) {
          // Load settings
          const settings = await ipcClient.getSettings();
          updateSettings(settings);

          // Load API key and initialize Claude
          try {
            // @ts-expect-error - Using internal invoke for settings:get
            const apiKeyResult = await ipcClient.ipc?.invoke('settings:get', 'anthropic_api_key');
            if (apiKeyResult?.value) {
              console.log('✅ Anthropic API key loaded, initializing ClaudeService...');
              claudeService.initialize(apiKeyResult.value);
            } else {
              console.warn('⚠️  No Anthropic API key found. Please add one in Settings.');
            }
          } catch (error) {
            console.warn('Failed to load API key:', error);
          }

          // Load all journeys
          const journeys = await ipcClient.listJourneys();
          setAllJourneys(journeys);
          if (journeys.length > 0) {
            setCurrentJourney(journeys[0]);
          }
        } else {
          console.warn('Running outside Electron - IPC not available');
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, [setCurrentJourney, updateSettings]);

  // Refresh journey list when a new journey is created
  const refreshJourneyList = React.useCallback(async () => {
    if (!ipcClient.isAvailable()) return;

    try {
      const journeys = await ipcClient.listJourneys();
      setAllJourneys(journeys);
    } catch (error) {
      console.error('Failed to refresh journey list:', error);
    }
  }, []);

  // Listen for journey updates from main process
  React.useEffect(() => {
    if (!ipcClient.isAvailable()) return;

    const unsubscribe = ipcClient.on('journey:updated', (journey) => {
      setCurrentJourney(journey as typeof currentJourney);
    });

    return () => {
      unsubscribe?.();
    };
  }, [setCurrentJourney]);

  // Poll for journey updates when status is 'running'
  React.useEffect(() => {
    if (!currentJourney || currentJourney.status !== 'running' || !ipcClient.isAvailable()) {
      return;
    }

    console.log(`🔄 Starting real-time polling for journey: ${currentJourney.id}`);

    const intervalId = setInterval(async () => {
      try {
        const updated = await ipcClient.getJourney(currentJourney.id);
        if (updated) {
          // Only update if there are actual changes
          if (updated.stages.length !== currentJourney.stages.length ||
              updated.status !== currentJourney.status) {
            console.log(`📥 Journey updated: ${updated.stages.length} stages, status: ${updated.status}`);
            setCurrentJourney(updated);
          }
        }
      } catch (error) {
        console.error('Failed to poll journey updates:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      console.log(`⏹️  Stopped polling for journey: ${currentJourney.id}`);
      clearInterval(intervalId);
    };
  }, [currentJourney?.id, currentJourney?.status, currentJourney?.stages.length, setCurrentJourney]);

  // Handlers
  const handleNewJourney = React.useCallback(() => {
    setShowNewJourney(true);
    // Refresh journey list after dialog closes (will be triggered by dialog)
    refreshJourneyList();
  }, [refreshJourneyList]);

  const handleSelectJourney = React.useCallback((journey: Journey) => {
    setCurrentJourney(journey);
    setShowHistory(false);
  }, [setCurrentJourney]);

  const handlePauseJourney = React.useCallback(async () => {
    if (!currentJourney) return;

    try {
      await ipcClient.pauseJourney(currentJourney.id);
    } catch (error) {
      console.error('Failed to pause journey:', error);
    }
  }, [currentJourney]);

  const handleResumeJourney = React.useCallback(async () => {
    if (!currentJourney) return;

    try {
      await ipcClient.resumeJourney(currentJourney.id);
    } catch (error) {
      console.error('Failed to resume journey:', error);
    }
  }, [currentJourney]);

  const handleStopJourney = React.useCallback(async () => {
    if (!currentJourney) return;

    try {
      await ipcClient.stopJourney(currentJourney.id);
    } catch (error) {
      console.error('Failed to stop journey:', error);
    }
  }, [currentJourney]);

  const handleArtifactClick = React.useCallback(
    (artifact: Artifact) => {
      setSelectedArtifact(artifact);
    },
    [setSelectedArtifact]
  );

  const handleCloseArtifact = React.useCallback(() => {
    setSelectedArtifact(null);
  }, [setSelectedArtifact]);

  const handleGeneratePage = React.useCallback(() => {
    setShowPageDialog(true);
  }, []);

  const handlePageGenerated = React.useCallback((page: Page) => {
    // Close the dialog and open the viewer
    setShowPageDialog(false);
    setViewingPage(page);
  }, []);

  const handleClosePage = React.useCallback(() => {
    setViewingPage(null);
  }, []);

  const handleDeleteJourney = React.useCallback(async (journeyId: string) => {
    if (!ipcClient.isAvailable()) return;

    try {
      console.log(`🗑️  Deleting journey: ${journeyId}`);
      await ipcClient.deleteJourney(journeyId);

      // Remove from state
      removeJourney(journeyId);

      // Refresh journey list
      await refreshJourneyList();

      console.log('✅ Journey deleted successfully');
    } catch (error) {
      console.error('Failed to delete journey:', error);
    }
  }, [removeJourney, refreshJourneyList]);

  if (isLoading) {
    return <LoadingOverlay message="Initializing Perpetua..." />;
  }

  return (
    <div className="flex h-screen bg-base-canvas">
      {/* Journey History Sidebar (left) */}
      <AnimatePresence>
        {showHistory && (
          <JourneyList
            journeys={allJourneys}
            currentJourneyId={currentJourney?.id || null}
            onSelectJourney={handleSelectJourney}
            onNewJourney={handleNewJourney}
            onDeleteJourney={handleDeleteJourney}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with toggle */}
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            aria-label="Toggle history"
          >
            <History className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle control panel"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Stream */}
        <div className="flex-1">
          <Stream journey={currentJourney} onArtifactClick={handleArtifactClick} />
        </div>
      </div>

      {/* Control panel sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <ControlPanel
            journey={currentJourney}
            onPause={handlePauseJourney}
            onResume={handleResumeJourney}
            onStop={handleStopJourney}
            onNewJourney={handleNewJourney}
            onGeneratePage={handleGeneratePage}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Artifact viewer modal */}
      <AnimatePresence>
        {selectedArtifact && (
          <ArtifactViewer artifact={selectedArtifact} onClose={handleCloseArtifact} />
        )}
      </AnimatePresence>

      {/* New journey dialog */}
      <NewJourneyDialog open={showNewJourney} onOpenChange={setShowNewJourney} />

      {/* Page generator dialog */}
      {currentJourney && (
        <PageGeneratorDialog
          journey={currentJourney}
          isOpen={showPageDialog}
          onClose={() => setShowPageDialog(false)}
          onPageGenerated={handlePageGenerated}
        />
      )}

      {/* Page viewer */}
      <AnimatePresence>
        {viewingPage && (
          <PageViewer page={viewingPage} onClose={handleClosePage} />
        )}
      </AnimatePresence>

      {/* Settings dialog */}
      <div className="fixed top-4 right-4 z-50">
        <SettingsDialog />
      </div>
    </div>
  );
}
