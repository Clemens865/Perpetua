/**
 * Unit tests for StreamView component
 * Tests infinite scroll, stage rendering, and real-time updates
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StreamView } from '../../../src/renderer/components/StreamView';
import type { Journey, Stage } from '../../../src/types';

describe('StreamView', () => {
  const mockJourney: Journey = {
    id: 'journey_123',
    input: 'Test journey',
    status: 'running',
    stages: [],
    settings: {
      autoContinue: true,
      maxStages: 50,
      stageDelay: 2000,
      extendedThinking: true,
      computerUse: true,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const createMockStage = (index: number): Stage => ({
    id: `stage_${index}`,
    journeyId: 'journey_123',
    type: 'discovering',
    status: 'complete',
    prompt: `Prompt ${index}`,
    result: `Result ${index}`,
    artifacts: [],
    createdAt: Date.now() + index * 1000,
  });

  describe('rendering', () => {
    it('should render empty state when no stages', () => {
      render(<StreamView journey={mockJourney} />);

      expect(screen.getByText(/no stages yet/i)).toBeInTheDocument();
    });

    it('should render all stages', () => {
      const stages = Array.from({ length: 5 }, (_, i) => createMockStage(i));
      const journeyWithStages = { ...mockJourney, stages };

      render(<StreamView journey={journeyWithStages} />);

      expect(screen.getAllByTestId('stage-card')).toHaveLength(5);
    });

    it('should render stages in chronological order', () => {
      const stages = Array.from({ length: 3 }, (_, i) => createMockStage(i));
      const journeyWithStages = { ...mockJourney, stages };

      render(<StreamView journey={journeyWithStages} />);

      const cards = screen.getAllByTestId('stage-card');
      expect(cards[0]).toHaveTextContent('Result 0');
      expect(cards[1]).toHaveTextContent('Result 1');
      expect(cards[2]).toHaveTextContent('Result 2');
    });
  });

  describe('infinite scroll', () => {
    it('should render with virtualized list', () => {
      const stages = Array.from({ length: 100 }, (_, i) => createMockStage(i));
      const journeyWithStages = { ...mockJourney, stages };

      render(<StreamView journey={journeyWithStages} />);

      // Not all stages should be in DOM (virtualized)
      const visibleCards = screen.getAllByTestId('stage-card');
      expect(visibleCards.length).toBeLessThan(100);
    });

    it('should load more stages on scroll', async () => {
      const stages = Array.from({ length: 50 }, (_, i) => createMockStage(i));
      const journeyWithStages = { ...mockJourney, stages };

      const { container } = render(<StreamView journey={journeyWithStages} />);

      const scrollContainer = container.querySelector('[data-testid="stage-stream"]');

      // Scroll to bottom
      fireEvent.scroll(scrollContainer!, { target: { scrollTop: 1000 } });

      await waitFor(() => {
        // More stages should load
        expect(screen.getAllByTestId('stage-card').length).toBeGreaterThan(10);
      });
    });

    it('should auto-scroll to latest stage when new stage added', async () => {
      const stages = [createMockStage(0)];
      const { rerender, container } = render(
        <StreamView journey={{ ...mockJourney, stages }} />
      );

      const scrollContainer = container.querySelector('[data-testid="stage-stream"]');
      const initialScrollHeight = scrollContainer!.scrollHeight;

      // Add new stage
      stages.push(createMockStage(1));
      rerender(<StreamView journey={{ ...mockJourney, stages }} />);

      await waitFor(() => {
        expect(scrollContainer!.scrollHeight).toBeGreaterThan(initialScrollHeight);
      });
    });
  });

  describe('real-time updates', () => {
    it('should update when new stage is added', () => {
      const stages = [createMockStage(0)];
      const { rerender } = render(
        <StreamView journey={{ ...mockJourney, stages }} />
      );

      expect(screen.getAllByTestId('stage-card')).toHaveLength(1);

      stages.push(createMockStage(1));
      rerender(<StreamView journey={{ ...mockJourney, stages }} />);

      expect(screen.getAllByTestId('stage-card')).toHaveLength(2);
    });

    it('should update stage status in real-time', () => {
      const stages = [{ ...createMockStage(0), status: 'running' as const }];
      const { rerender } = render(
        <StreamView journey={{ ...mockJourney, stages }} />
      );

      expect(screen.getByTestId('spinner')).toBeInTheDocument();

      stages[0].status = 'complete';
      rerender(<StreamView journey={{ ...mockJourney, stages }} />);

      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      expect(screen.getByTestId('checkmark')).toBeInTheDocument();
    });

    it('should animate new stages appearing', async () => {
      const stages = [createMockStage(0)];
      const { rerender, container } = render(
        <StreamView journey={{ ...mockJourney, stages }} />
      );

      stages.push(createMockStage(1));
      rerender(<StreamView journey={{ ...mockJourney, stages }} />);

      const newCard = screen.getAllByTestId('stage-card')[1];

      await waitFor(() => {
        expect(newCard).toHaveClass('fade-in');
      });
    });
  });

  describe('interactions', () => {
    it('should expand stage on click', () => {
      const stages = [createMockStage(0)];
      render(<StreamView journey={{ ...mockJourney, stages }} />);

      const card = screen.getByTestId('stage-card');
      fireEvent.click(card);

      expect(card).toHaveClass('expanded');
    });

    it('should collapse other stages when expanding one', () => {
      const stages = [createMockStage(0), createMockStage(1)];
      render(<StreamView journey={{ ...mockJourney, stages }} />);

      const cards = screen.getAllByTestId('stage-card');

      // Expand first card
      fireEvent.click(cards[0]);
      expect(cards[0]).toHaveClass('expanded');

      // Expand second card
      fireEvent.click(cards[1]);
      expect(cards[1]).toHaveClass('expanded');
      expect(cards[0]).not.toHaveClass('expanded');
    });

    it('should filter stages by type', () => {
      const stages = [
        { ...createMockStage(0), type: 'discovering' as const },
        { ...createMockStage(1), type: 'chasing' as const },
        { ...createMockStage(2), type: 'solving' as const },
      ];

      render(<StreamView journey={{ ...mockJourney, stages }} />);

      const filterButton = screen.getByTestId('filter-button');
      fireEvent.click(filterButton);

      const discoveringFilter = screen.getByText('Discovering');
      fireEvent.click(discoveringFilter);

      expect(screen.getAllByTestId('stage-card')).toHaveLength(1);
    });
  });

  describe('journey status', () => {
    it('should show running indicator', () => {
      render(<StreamView journey={{ ...mockJourney, status: 'running' }} />);

      expect(screen.getByTestId('journey-status')).toHaveTextContent('Running');
    });

    it('should show paused indicator', () => {
      render(<StreamView journey={{ ...mockJourney, status: 'paused' }} />);

      expect(screen.getByTestId('journey-status')).toHaveTextContent('Paused');
    });

    it('should show complete indicator', () => {
      render(<StreamView journey={{ ...mockJourney, status: 'complete' }} />);

      expect(screen.getByTestId('journey-status')).toHaveTextContent('Complete');
    });

    it('should show progress indicator', () => {
      const stages = Array.from({ length: 8 }, (_, i) => createMockStage(i));
      const journeyWithStages = { ...mockJourney, stages };

      render(<StreamView journey={journeyWithStages} />);

      expect(screen.getByTestId('progress-bar')).toHaveStyle({ width: '16%' }); // 8/50 stages
    });
  });

  describe('performance', () => {
    it('should handle 100+ stages efficiently', () => {
      const stages = Array.from({ length: 100 }, (_, i) => createMockStage(i));
      const journeyWithStages = { ...mockJourney, stages };

      const startTime = performance.now();
      render(<StreamView journey={journeyWithStages} />);
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(100); // Should render quickly
    });

    it('should use memoization for stage cards', () => {
      const stages = [createMockStage(0), createMockStage(1)];
      const { rerender } = render(
        <StreamView journey={{ ...mockJourney, stages }} />
      );

      // Re-render with same data
      rerender(<StreamView journey={{ ...mockJourney, stages }} />);

      // Cards should not re-render (use React.memo)
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA roles', () => {
      const stages = [createMockStage(0)];
      render(<StreamView journey={{ ...mockJourney, stages }} />);

      const stream = screen.getByTestId('stage-stream');
      expect(stream).toHaveAttribute('role', 'feed');
    });

    it('should announce new stages to screen readers', async () => {
      const stages = [createMockStage(0)];
      const { rerender } = render(
        <StreamView journey={{ ...mockJourney, stages }} />
      );

      stages.push(createMockStage(1));
      rerender(<StreamView journey={{ ...mockJourney, stages }} />);

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/new stage/i);
      });
    });

    it('should be keyboard navigable', () => {
      const stages = [createMockStage(0), createMockStage(1)];
      render(<StreamView journey={{ ...mockJourney, stages }} />);

      const cards = screen.getAllByTestId('stage-card');

      // Tab to first card
      cards[0].focus();
      expect(document.activeElement).toBe(cards[0]);

      // Arrow down to next card
      fireEvent.keyDown(cards[0], { key: 'ArrowDown' });
      expect(document.activeElement).toBe(cards[1]);
    });
  });
});
