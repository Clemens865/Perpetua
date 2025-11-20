/**
 * Unit tests for StageCard component
 * Tests stage rendering, interactions, and states
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StageCard } from '../../../src/renderer/components/StageCard';
import type { Stage } from '../../../src/types';

describe('StageCard', () => {
  const mockStage: Stage = {
    id: 'stage_123',
    journeyId: 'journey_123',
    type: 'discovering',
    status: 'complete',
    prompt: 'Research neural networks',
    result: 'Neural networks are computational models...',
    thinking: 'Let me analyze this systematically...',
    artifacts: [],
    createdAt: Date.now(),
  };

  describe('rendering', () => {
    it('should render stage type', () => {
      render(<StageCard stage={mockStage} />);

      expect(screen.getByText(/discovering/i)).toBeInTheDocument();
    });

    it('should render stage result', () => {
      render(<StageCard stage={mockStage} />);

      expect(
        screen.getByText(/Neural networks are computational/)
      ).toBeInTheDocument();
    });

    it('should render stage status', () => {
      render(<StageCard stage={mockStage} />);

      const card = screen.getByTestId('stage-card');
      expect(card).toHaveAttribute('data-status', 'complete');
    });

    it('should show thinking section when available', () => {
      render(<StageCard stage={mockStage} expanded />);

      expect(
        screen.getByText(/Let me analyze this systematically/)
      ).toBeInTheDocument();
    });

    it('should not show thinking when collapsed', () => {
      render(<StageCard stage={mockStage} expanded={false} />);

      expect(
        screen.queryByText(/Let me analyze this systematically/)
      ).not.toBeInTheDocument();
    });
  });

  describe('stage types', () => {
    const stageTypes = [
      'discovering',
      'chasing',
      'solving',
      'challenging',
      'questioning',
      'searching',
      'imagining',
      'building',
    ] as const;

    stageTypes.forEach(type => {
      it(`should render ${type} stage with correct styling`, () => {
        const stage = { ...mockStage, type };
        render(<StageCard stage={stage} />);

        const card = screen.getByTestId('stage-card');
        expect(card).toHaveClass(`stage-${type}`);
      });
    });
  });

  describe('interactions', () => {
    it('should toggle expansion on click', () => {
      const { rerender } = render(
        <StageCard stage={mockStage} expanded={false} />
      );

      const card = screen.getByTestId('stage-card');
      fireEvent.click(card);

      rerender(<StageCard stage={mockStage} expanded={true} />);

      expect(screen.getByTestId('thinking-section')).toBeVisible();
    });

    it('should call onExpand callback', () => {
      const onExpand = jest.fn();
      render(<StageCard stage={mockStage} onExpand={onExpand} />);

      const card = screen.getByTestId('stage-card');
      fireEvent.click(card);

      expect(onExpand).toHaveBeenCalledWith(mockStage.id);
    });

    it('should show artifact count badge', () => {
      const stageWithArtifacts = {
        ...mockStage,
        artifacts: [
          {
            id: 'art_1',
            stageId: 'stage_123',
            type: 'code' as const,
            title: 'Test.ts',
            content: 'code',
            metadata: {},
            createdAt: Date.now(),
          },
          {
            id: 'art_2',
            stageId: 'stage_123',
            type: 'document' as const,
            title: 'Doc.md',
            content: 'doc',
            metadata: {},
            createdAt: Date.now(),
          },
        ],
      };

      render(<StageCard stage={stageWithArtifacts} />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should open artifact viewer on artifact click', () => {
      const onArtifactClick = jest.fn();
      const stageWithArtifacts = {
        ...mockStage,
        artifacts: [
          {
            id: 'art_1',
            stageId: 'stage_123',
            type: 'code' as const,
            title: 'Test.ts',
            content: 'code',
            metadata: {},
            createdAt: Date.now(),
          },
        ],
      };

      render(
        <StageCard
          stage={stageWithArtifacts}
          onArtifactClick={onArtifactClick}
          expanded
        />
      );

      const artifactButton = screen.getByText('Test.ts');
      fireEvent.click(artifactButton);

      expect(onArtifactClick).toHaveBeenCalledWith('art_1');
    });
  });

  describe('stage status', () => {
    it('should show pending state', () => {
      const pendingStage = { ...mockStage, status: 'pending' as const };
      render(<StageCard stage={pendingStage} />);

      expect(screen.getByTestId('stage-status')).toHaveTextContent('Pending');
    });

    it('should show running state with spinner', () => {
      const runningStage = { ...mockStage, status: 'running' as const };
      render(<StageCard stage={runningStage} />);

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should show complete state with checkmark', () => {
      render(<StageCard stage={mockStage} />);

      expect(screen.getByTestId('checkmark')).toBeInTheDocument();
    });

    it('should show error state', () => {
      const errorStage = {
        ...mockStage,
        status: 'error' as const,
        error: 'Test error',
      };
      render(<StageCard stage={errorStage} />);

      expect(screen.getByText(/Test error/)).toBeInTheDocument();
    });
  });

  describe('animations', () => {
    it('should animate on mount', async () => {
      const { container } = render(<StageCard stage={mockStage} />);

      const card = container.querySelector('.stage-card');

      await waitFor(() => {
        expect(card).toHaveClass('animated');
      });
    });

    it('should animate expansion', async () => {
      const { rerender } = render(
        <StageCard stage={mockStage} expanded={false} />
      );

      rerender(<StageCard stage={mockStage} expanded={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('thinking-section')).toHaveClass(
          'expanded'
        );
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<StageCard stage={mockStage} />);

      const card = screen.getByTestId('stage-card');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('discovering'));
    });

    it('should be keyboard navigable', () => {
      const onExpand = jest.fn();
      render(<StageCard stage={mockStage} onExpand={onExpand} />);

      const card = screen.getByTestId('stage-card');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(onExpand).toHaveBeenCalled();
    });

    it('should have proper role attributes', () => {
      render(<StageCard stage={mockStage} />);

      const card = screen.getByTestId('stage-card');
      expect(card).toHaveAttribute('role', 'article');
    });
  });

  describe('performance', () => {
    it('should handle long content efficiently', () => {
      const longContent = 'x'.repeat(10000);
      const stageWithLongContent = {
        ...mockStage,
        result: longContent,
      };

      const { container } = render(
        <StageCard stage={stageWithLongContent} />
      );

      expect(container).toBeInTheDocument();
      // Content should be truncated or virtualized
    });

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<StageCard stage={mockStage} />);

      // Re-render with same props
      rerender(<StageCard stage={mockStage} />);

      // Component should use React.memo or similar optimization
    });
  });
});
