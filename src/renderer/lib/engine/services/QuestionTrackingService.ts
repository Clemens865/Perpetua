/**
 * Question Tracking Service
 *
 * Systematic tracking of questions from QUESTIONING stage through to SEARCHING stage answers.
 * This service ensures questions are never lost and answers are properly attributed.
 *
 * Key Features:
 * - Track question lifecycle (unanswered -> partial -> answered)
 * - Priority scoring for most important questions
 * - Answer detection with confidence levels
 * - Stage attribution for both questions and answers
 * - Deduplication to prevent redundant questions
 */

import type {
  TrackedQuestion,
  QuestionStatus,
  ImportanceLevel,
  ConfidenceLevel,
  StageType,
} from '../types/optimization-types';

export interface QuestionTrackingMetrics {
  totalQuestions: number;
  unansweredCount: number;
  partialCount: number;
  answeredCount: number;
  highPriorityUnanswered: number;
  averageConfidence: number;
}

export class QuestionTrackingService {
  private questions: Map<string, TrackedQuestion> = new Map();
  private questionsByStage: Map<number, string[]> = new Map();
  private questionsByPriority: Map<ImportanceLevel, string[]> = new Map();

  constructor() {
    // Initialize priority maps
    this.questionsByPriority.set('critical', []);
    this.questionsByPriority.set('high', []);
    this.questionsByPriority.set('medium', []);
    this.questionsByPriority.set('low', []);
  }

  /**
   * Track a new question from the QUESTIONING stage
   */
  trackQuestion(
    question: string,
    stageNumber: number,
    stageType: StageType,
    priority?: ImportanceLevel
  ): TrackedQuestion {
    // Check for duplicates
    const existingQuestion = this.findSimilarQuestion(question);
    if (existingQuestion) {
      console.log(`⚠️ Duplicate question detected, returning existing: ${existingQuestion.id}`);
      return existingQuestion;
    }

    // Determine priority based on question content if not provided
    const determinedPriority = priority || this.determinePriority(question);

    const trackedQuestion: TrackedQuestion = {
      id: `question_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      question: question.trim(),
      askedInStage: stageNumber,
      stageType,
      priority: determinedPriority,
      status: 'unanswered',
      relatedInsightIds: [],
      metadata: {
        requiresResearch: this.requiresResearch(question),
        researchAttempts: 0,
        category: this.categorizeQuestion(question),
      },
      createdAt: Date.now(),
    };

    // Store question
    this.questions.set(trackedQuestion.id, trackedQuestion);

    // Index by stage
    if (!this.questionsByStage.has(stageNumber)) {
      this.questionsByStage.set(stageNumber, []);
    }
    this.questionsByStage.get(stageNumber)!.push(trackedQuestion.id);

    // Index by priority
    this.questionsByPriority.get(determinedPriority)!.push(trackedQuestion.id);

    console.log(
      `✅ Tracked question [${determinedPriority.toUpperCase()}]: ${question.substring(0, 60)}...`
    );

    return trackedQuestion;
  }

  /**
   * Mark a question as answered with evidence
   */
  markAnswered(
    questionId: string,
    answer: string,
    confidence: ConfidenceLevel,
    answeredInStage?: number,
    evidence?: string[]
  ): void {
    const question = this.questions.get(questionId);
    if (!question) {
      console.warn(`⚠️ Question not found: ${questionId}`);
      return;
    }

    question.status = 'answered';
    question.answer = answer.trim();
    question.confidence = confidence;
    question.answeredInStage = answeredInStage;
    question.evidence = evidence || [];
    question.updatedAt = Date.now();

    console.log(
      `✅ Question answered [${confidence}]: ${question.question.substring(0, 60)}...`
    );
  }

  /**
   * Mark a question as partially answered
   */
  markPartial(
    questionId: string,
    partialAnswer: string,
    confidence: ConfidenceLevel,
    answeredInStage?: number
  ): void {
    const question = this.questions.get(questionId);
    if (!question) {
      console.warn(`⚠️ Question not found: ${questionId}`);
      return;
    }

    question.status = 'partial';
    question.answer = partialAnswer.trim();
    question.confidence = confidence;
    question.answeredInStage = answeredInStage;
    question.updatedAt = Date.now();

    // Increment research attempts if in metadata
    if (question.metadata.researchAttempts !== undefined) {
      question.metadata.researchAttempts++;
    }

    console.log(
      `⚠️ Question partially answered [${confidence}]: ${question.question.substring(0, 60)}...`
    );
  }

  /**
   * Mark a question as obsolete (no longer relevant)
   */
  markObsolete(questionId: string): void {
    const question = this.questions.get(questionId);
    if (!question) {
      console.warn(`⚠️ Question not found: ${questionId}`);
      return;
    }

    question.status = 'obsolete';
    question.updatedAt = Date.now();

    console.log(`🗑️ Question marked obsolete: ${question.question.substring(0, 60)}...`);
  }

  /**
   * Get all unanswered questions
   */
  getUnansweredQuestions(): TrackedQuestion[] {
    return Array.from(this.questions.values()).filter(
      (q) => q.status === 'unanswered' || q.status === 'partial'
    );
  }

  /**
   * Get priority questions up to a limit
   */
  getPriorityQuestions(limit: number = 10): TrackedQuestion[] {
    const priorities: ImportanceLevel[] = ['critical', 'high', 'medium', 'low'];
    const results: TrackedQuestion[] = [];

    for (const priority of priorities) {
      const questionIds = this.questionsByPriority.get(priority) || [];

      for (const id of questionIds) {
        const question = this.questions.get(id);
        if (question && (question.status === 'unanswered' || question.status === 'partial')) {
          results.push(question);
          if (results.length >= limit) {
            return results;
          }
        }
      }
    }

    return results;
  }

  /**
   * Get questions that require research
   */
  getQuestionsRequiringResearch(): TrackedQuestion[] {
    return Array.from(this.questions.values()).filter(
      (q) =>
        (q.status === 'unanswered' || q.status === 'partial') &&
        q.metadata.requiresResearch === true
    );
  }

  /**
   * Get all questions from a specific stage
   */
  getQuestionsByStage(stageNumber: number): TrackedQuestion[] {
    const questionIds = this.questionsByStage.get(stageNumber) || [];
    return questionIds
      .map((id) => this.questions.get(id))
      .filter((q): q is TrackedQuestion => q !== undefined);
  }

  /**
   * Get all tracked questions
   */
  getAllQuestions(): TrackedQuestion[] {
    return Array.from(this.questions.values());
  }

  /**
   * Get question by ID
   */
  getQuestion(questionId: string): TrackedQuestion | undefined {
    return this.questions.get(questionId);
  }

  /**
   * Link a question to an insight
   */
  linkToInsight(questionId: string, insightId: string): void {
    const question = this.questions.get(questionId);
    if (!question) {
      console.warn(`⚠️ Question not found: ${questionId}`);
      return;
    }

    if (!question.relatedInsightIds.includes(insightId)) {
      question.relatedInsightIds.push(insightId);
      question.updatedAt = Date.now();
    }
  }

  /**
   * Get tracking metrics
   */
  getMetrics(): QuestionTrackingMetrics {
    const allQuestions = Array.from(this.questions.values());
    const unanswered = allQuestions.filter((q) => q.status === 'unanswered');
    const partial = allQuestions.filter((q) => q.status === 'partial');
    const answered = allQuestions.filter((q) => q.status === 'answered');

    const highPriorityUnanswered = unanswered.filter(
      (q) => q.priority === 'critical' || q.priority === 'high'
    );

    const answeredWithConfidence = answered.filter((q) => q.confidence);
    const confidenceLevels: Record<ConfidenceLevel, number> = {
      verified: 1.0,
      high: 0.8,
      medium: 0.5,
      low: 0.3,
      speculative: 0.1,
    };

    const averageConfidence =
      answeredWithConfidence.length > 0
        ? answeredWithConfidence.reduce(
            (sum, q) => sum + (confidenceLevels[q.confidence!] || 0),
            0
          ) / answeredWithConfidence.length
        : 0;

    return {
      totalQuestions: allQuestions.length,
      unansweredCount: unanswered.length,
      partialCount: partial.length,
      answeredCount: answered.length,
      highPriorityUnanswered: highPriorityUnanswered.length,
      averageConfidence,
    };
  }

  /**
   * Export questions as array (for context)
   */
  exportAsArray(): TrackedQuestion[] {
    return Array.from(this.questions.values());
  }

  /**
   * Clear all questions (for new journey)
   */
  clear(): void {
    this.questions.clear();
    this.questionsByStage.clear();
    this.questionsByPriority.forEach((arr) => arr.splice(0));
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Determine question priority based on content
   */
  private determinePriority(question: string): ImportanceLevel {
    const lowerQuestion = question.toLowerCase();

    // Critical: Questions about core assumptions, fundamental problems
    if (
      lowerQuestion.includes('why') ||
      lowerQuestion.includes('root cause') ||
      lowerQuestion.includes('fundamental') ||
      lowerQuestion.includes('assumption') ||
      lowerQuestion.includes('critical')
    ) {
      return 'critical';
    }

    // High: Questions about mechanisms, evidence, impact
    if (
      lowerQuestion.includes('how') ||
      lowerQuestion.includes('what if') ||
      lowerQuestion.includes('evidence') ||
      lowerQuestion.includes('impact') ||
      lowerQuestion.includes('consequence')
    ) {
      return 'high';
    }

    // Low: Clarifying questions, definitions
    if (
      lowerQuestion.includes('what is') ||
      lowerQuestion.includes('define') ||
      lowerQuestion.includes('example')
    ) {
      return 'low';
    }

    // Default: medium
    return 'medium';
  }

  /**
   * Determine if question requires research
   */
  private requiresResearch(question: string): boolean {
    const lowerQuestion = question.toLowerCase();

    // Questions that need external research
    return (
      lowerQuestion.includes('evidence') ||
      lowerQuestion.includes('data') ||
      lowerQuestion.includes('study') ||
      lowerQuestion.includes('research') ||
      lowerQuestion.includes('statistics') ||
      lowerQuestion.includes('source') ||
      lowerQuestion.includes('example') ||
      lowerQuestion.includes('case')
    );
  }

  /**
   * Categorize question type
   */
  private categorizeQuestion(question: string): string {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.startsWith('why')) {
      return 'probing';
    }
    if (lowerQuestion.startsWith('what if')) {
      return 'hypothetical';
    }
    if (lowerQuestion.startsWith('how')) {
      return 'clarifying';
    }
    if (lowerQuestion.includes('challenge') || lowerQuestion.includes('disagree')) {
      return 'challenge';
    }
    if (lowerQuestion.includes('future') || lowerQuestion.includes('will')) {
      return 'future';
    }
    if (lowerQuestion.includes('should we') || lowerQuestion.includes('are we')) {
      return 'meta';
    }

    return 'clarifying';
  }

  /**
   * Find similar question to avoid duplicates
   */
  private findSimilarQuestion(question: string): TrackedQuestion | undefined {
    const normalizedQuestion = this.normalizeQuestion(question);

    for (const existing of this.questions.values()) {
      const normalizedExisting = this.normalizeQuestion(existing.question);

      // Exact match
      if (normalizedQuestion === normalizedExisting) {
        return existing;
      }

      // High similarity (simple word overlap check)
      const similarity = this.calculateSimilarity(normalizedQuestion, normalizedExisting);
      if (similarity > 0.85) {
        return existing;
      }
    }

    return undefined;
  }

  /**
   * Normalize question for comparison
   */
  private normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Calculate simple similarity score between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(' '));
    const words2 = new Set(str2.split(' '));

    const intersection = new Set([...words1].filter((word) => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}
