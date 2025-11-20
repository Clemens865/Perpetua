/**
 * Artifact Validation Service
 * Provides rich metadata extraction and validation for artifacts
 *
 * Features:
 * - Intelligent artifact extraction from building stage content
 * - Type detection (code, markdown, table, diagram, guide, framework)
 * - Syntax validation for code artifacts
 * - Completeness assessment
 * - Rich metadata generation
 */

import type { RichArtifact, ArtifactType, CompletenessLevel, StageType } from '../types/optimization-types';
import { claudeService } from '../../../services/claude/ClaudeService';

interface ArtifactExtractionResult {
  artifacts: RichArtifact[];
  totalFound: number;
  byType: Record<ArtifactType, number>;
}

export class ArtifactValidationService {
  /**
   * Extract and enrich artifacts from building stage content
   */
  async extractArtifacts(
    buildingContent: string,
    stageNumber: number,
    stageType: StageType = 'building'
  ): Promise<RichArtifact[]> {
    console.log(`🔍 Extracting artifacts from stage ${stageNumber} content...`);

    // Use Claude Sonnet 4.5 to intelligently extract artifacts
    const extractionPrompt = this.buildExtractionPrompt(buildingContent);

    try {
      const response = await claudeService.execute({
        model: 'claude-sonnet-4-5-20250929',
        prompt: extractionPrompt,
        extendedThinking: false,
        maxTokens: 8000,
      });

      // Parse the structured JSON response
      const extractedData = this.parseExtractionResponse(response.content);

      // Convert to RichArtifact objects
      const artifacts = await Promise.all(
        extractedData.artifacts.map((artifact, index) =>
          this.enrichArtifact(artifact, stageNumber, stageType, index)
        )
      );

      console.log(`✅ Extracted ${artifacts.length} artifacts:`, {
        code: artifacts.filter(a => a.type === 'code').length,
        markdown: artifacts.filter(a => a.type === 'markdown').length,
        table: artifacts.filter(a => a.type === 'table').length,
        diagram: artifacts.filter(a => a.type === 'diagram').length,
        guide: artifacts.filter(a => a.type === 'guide').length,
        framework: artifacts.filter(a => a.type === 'framework').length,
        other: artifacts.filter(a => a.type === 'other').length,
      });

      return artifacts;

    } catch (error) {
      console.error('❌ Failed to extract artifacts with Claude:', error);
      // Fallback to pattern-based extraction
      return this.fallbackExtraction(buildingContent, stageNumber, stageType);
    }
  }

  /**
   * Build extraction prompt for Claude
   */
  private buildExtractionPrompt(content: string): string {
    return `You are an expert artifact extractor. Analyze the following content from a BUILDING stage and identify ALL artifacts created.

<content>
${content}
</content>

<task>
Extract and classify every artifact in this content. An artifact is any tangible output like:
- Code snippets or full programs
- Markdown documents or reports
- Data tables or matrices
- Diagrams (mermaid, flowcharts, etc.)
- Step-by-step guides or tutorials
- Mental models or frameworks
- Presentations or slide content
- Any other structured output

For each artifact provide:
1. **Type**: code, markdown, table, diagram, guide, framework, or other
2. **Title**: A descriptive title (5-10 words)
3. **Content**: The complete artifact content
4. **Language**: Programming language (for code) or format type
5. **Completeness**: complete, partial, or skeleton
6. **Quality Notes**: Any syntax errors, missing pieces, or issues

Be thorough - extract ALL artifacts, not just code blocks.
</task>

<output_format>
Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "artifacts": [
    {
      "type": "code",
      "title": "User Authentication Service",
      "content": "...",
      "language": "typescript",
      "completeness": "complete",
      "notes": "Syntax valid, includes error handling"
    },
    {
      "type": "markdown",
      "title": "API Documentation",
      "content": "...",
      "language": "markdown",
      "completeness": "partial",
      "notes": "Missing endpoint examples"
    }
  ]
}
</output_format>

Extract all artifacts now:`;
  }

  /**
   * Parse Claude's extraction response
   */
  private parseExtractionResponse(response: string): { artifacts: Array<{
    type: string;
    title: string;
    content: string;
    language?: string;
    completeness: string;
    notes?: string;
  }> } {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
      }

      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (error) {
      console.error('Failed to parse extraction response:', error);
      return { artifacts: [] };
    }
  }

  /**
   * Enrich extracted artifact with full metadata and validation
   */
  private async enrichArtifact(
    extracted: {
      type: string;
      title: string;
      content: string;
      language?: string;
      completeness: string;
      notes?: string;
    },
    stageNumber: number,
    stageType: StageType,
    index: number
  ): Promise<RichArtifact> {
    const artifactType = this.normalizeArtifactType(extracted.type);
    const completeness = this.normalizeCompleteness(extracted.completeness);

    // Validate code artifacts
    const validation = artifactType === 'code'
      ? await this.validateCodeArtifact(extracted.content, extracted.language || 'unknown')
      : this.validateNonCodeArtifact(extracted.content, artifactType);

    return {
      id: `artifact_${Date.now()}_${Math.random().toString(36).substring(7)}_${index}`,
      type: artifactType,
      title: extracted.title,
      content: extracted.content,
      stageNumber,
      stageType,
      relatedInsightIds: [], // Will be populated by engine
      relatedQuestionIds: [], // Will be populated by engine
      metadata: {
        language: extracted.language,
        format: this.detectFormat(extracted.content, artifactType),
        size: extracted.content.length,
        targetAudience: this.inferTargetAudience(extracted.content, artifactType),
        usageInstructions: this.generateUsageInstructions(extracted.content, artifactType),
        tags: this.extractTags(extracted.content, artifactType),
      },
      validation: {
        completeness,
        validated: true,
        validationMethod: artifactType === 'code' ? 'syntax-check' : 'structure-check',
        validationNotes: extracted.notes || validation.notes,
        syntaxValid: validation.syntaxValid,
        errors: validation.errors,
        warnings: validation.warnings,
        qualityScore: this.calculateQualityScore(validation, completeness),
      },
      createdAt: Date.now(),
    };
  }

  /**
   * Validate code artifact syntax
   */
  private async validateCodeArtifact(
    content: string,
    language: string
  ): Promise<{
    syntaxValid: boolean;
    notes: string;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic syntax checks by language
    switch (language.toLowerCase()) {
      case 'typescript':
      case 'javascript':
        this.validateJavaScript(content, errors, warnings);
        break;
      case 'python':
        this.validatePython(content, errors, warnings);
        break;
      case 'json':
        this.validateJSON(content, errors, warnings);
        break;
      default:
        warnings.push(`No syntax validator available for ${language}`);
    }

    // Check for common issues
    if (content.includes('TODO') || content.includes('FIXME')) {
      warnings.push('Contains TODO or FIXME comments');
    }
    if (content.includes('...') && content.split('...').length > 2) {
      warnings.push('Contains placeholder ellipsis (...) - may be incomplete');
    }

    const syntaxValid = errors.length === 0;
    const notes = syntaxValid
      ? (warnings.length > 0 ? `Syntax valid with ${warnings.length} warnings` : 'Syntax valid')
      : `${errors.length} syntax errors found`;

    return { syntaxValid, notes, errors, warnings };
  }

  /**
   * Validate JavaScript/TypeScript syntax
   */
  private validateJavaScript(content: string, errors: string[], warnings: string[]): void {
    // Check for unclosed brackets
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`Mismatched parentheses: ${openParens} opening, ${closeParens} closing`);
    }

    // Check for common syntax errors
    if (content.match(/function\s+\w+\s*\(/)) {
      // Function declarations look ok
    } else if (content.match(/const\s+\w+\s*=/)) {
      // Const declarations look ok
    } else if (!content.trim().startsWith('//') && !content.trim().startsWith('/*')) {
      warnings.push('No clear function or variable declarations found');
    }
  }

  /**
   * Validate Python syntax
   */
  private validatePython(content: string, errors: string[], warnings: string[]): void {
    // Check for basic indentation consistency
    const lines = content.split('\n').filter(l => l.trim());
    const indentLevels = lines.map(l => l.match(/^\s*/)?.[0].length || 0);
    const hasInconsistentIndent = indentLevels.some((level, i) => {
      if (i === 0) return false;
      const diff = Math.abs(level - indentLevels[i - 1]);
      return diff !== 0 && diff !== 4 && diff !== 2;
    });

    if (hasInconsistentIndent) {
      warnings.push('Potentially inconsistent indentation');
    }

    // Check for function definitions
    if (!content.match(/def\s+\w+\s*\(/)) {
      warnings.push('No function definitions found');
    }
  }

  /**
   * Validate JSON syntax
   */
  private validateJSON(content: string, errors: string[], warnings: string[]): void {
    try {
      JSON.parse(content);
    } catch (error) {
      errors.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Parse failed'}`);
    }
  }

  /**
   * Validate non-code artifacts
   */
  private validateNonCodeArtifact(
    content: string,
    type: ArtifactType
  ): {
    syntaxValid: boolean;
    notes: string;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check length
    if (content.length < 100) {
      warnings.push('Very short artifact - may be incomplete');
    }

    // Type-specific validation
    switch (type) {
      case 'table':
        if (!content.includes('|') && !content.includes(',')) {
          warnings.push('No table delimiters found');
        }
        break;
      case 'diagram':
        if (!content.includes('graph') && !content.includes('flowchart') && !content.includes('```')) {
          warnings.push('No diagram syntax detected');
        }
        break;
      case 'markdown':
        if (!content.includes('#') && !content.includes('*') && !content.includes('-')) {
          warnings.push('No markdown formatting detected');
        }
        break;
    }

    const notes = warnings.length > 0
      ? `Structure check passed with ${warnings.length} warnings`
      : 'Structure check passed';

    return {
      syntaxValid: true,
      notes,
      errors,
      warnings,
    };
  }

  /**
   * Normalize artifact type to valid ArtifactType
   */
  private normalizeArtifactType(type: string): ArtifactType {
    const normalized = type.toLowerCase();
    const validTypes: ArtifactType[] = [
      'code', 'markdown', 'table', 'diagram', 'guide', 'framework', 'report', 'presentation', 'other'
    ];

    if (validTypes.includes(normalized as ArtifactType)) {
      return normalized as ArtifactType;
    }

    // Map common variants
    if (normalized.includes('code') || normalized.includes('script')) return 'code';
    if (normalized.includes('doc') || normalized.includes('md')) return 'markdown';
    if (normalized.includes('table') || normalized.includes('matrix')) return 'table';
    if (normalized.includes('diagram') || normalized.includes('chart')) return 'diagram';
    if (normalized.includes('guide') || normalized.includes('tutorial')) return 'guide';
    if (normalized.includes('framework') || normalized.includes('model')) return 'framework';
    if (normalized.includes('report')) return 'report';
    if (normalized.includes('slide') || normalized.includes('presentation')) return 'presentation';

    return 'other';
  }

  /**
   * Normalize completeness level
   */
  private normalizeCompleteness(completeness: string): CompletenessLevel {
    const normalized = completeness.toLowerCase();
    if (normalized.includes('complete') || normalized.includes('full')) return 'complete';
    if (normalized.includes('partial') || normalized.includes('incomplete')) return 'partial';
    if (normalized.includes('skeleton') || normalized.includes('stub') || normalized.includes('outline')) return 'skeleton';
    return 'partial'; // Default
  }

  /**
   * Detect file format
   */
  private detectFormat(content: string, type: ArtifactType): string {
    if (type === 'code') {
      if (content.includes('import ') || content.includes('export ')) return 'esm';
      if (content.includes('require(')) return 'commonjs';
      return 'script';
    }
    if (type === 'markdown') return 'md';
    if (type === 'table') {
      if (content.includes('|')) return 'markdown-table';
      if (content.includes(',')) return 'csv';
      return 'table';
    }
    if (type === 'diagram') {
      if (content.includes('mermaid')) return 'mermaid';
      if (content.includes('flowchart')) return 'flowchart';
      return 'diagram';
    }
    return 'text';
  }

  /**
   * Infer target audience from content
   */
  private inferTargetAudience(content: string, type: ArtifactType): string {
    if (type === 'code') {
      if (content.includes('async') && content.includes('await')) return 'Developers familiar with async programming';
      if (content.includes('class ') || content.includes('interface ')) return 'Object-oriented programmers';
      return 'Developers';
    }
    if (type === 'guide') return 'General audience following step-by-step instructions';
    if (type === 'framework') return 'Strategic thinkers and decision makers';
    if (type === 'report') return 'Stakeholders and decision makers';
    return 'General audience';
  }

  /**
   * Generate usage instructions
   */
  private generateUsageInstructions(content: string, type: ArtifactType): string {
    if (type === 'code') {
      const hasImports = content.includes('import ') || content.includes('require(');
      const hasExports = content.includes('export ') || content.includes('module.exports');

      if (hasImports && hasExports) {
        return 'This is a module. Import it into your project and use the exported functions/classes.';
      }
      if (hasExports) {
        return 'This module exports functions/classes. Import them as needed in your code.';
      }
      return 'Copy this code into your project and integrate as needed.';
    }
    if (type === 'guide') return 'Follow the steps in order for best results.';
    if (type === 'framework') return 'Use this framework to structure your thinking and decision-making.';
    if (type === 'table') return 'Reference this table for data lookup and comparison.';
    if (type === 'diagram') return 'View this diagram to understand relationships and flows.';
    return 'Use as reference material.';
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string, type: ArtifactType): string[] {
    const tags: string[] = [type];

    // Add language/framework tags
    if (content.includes('React') || content.includes('useState')) tags.push('react');
    if (content.includes('Vue') || content.includes('ref(')) tags.push('vue');
    if (content.includes('async') && content.includes('await')) tags.push('async');
    if (content.includes('class ')) tags.push('oop');
    if (content.includes('interface ') || content.includes(': ')) tags.push('typescript');
    if (content.includes('def ')) tags.push('python');
    if (content.includes('SQL') || content.includes('SELECT')) tags.push('sql');
    if (content.includes('API') || content.includes('endpoint')) tags.push('api');
    if (content.includes('test') || content.includes('expect')) tags.push('testing');

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Calculate quality score (0-10)
   */
  private calculateQualityScore(
    validation: { syntaxValid: boolean; errors: string[]; warnings: string[] },
    completeness: CompletenessLevel
  ): number {
    let score = 10;

    // Deduct for syntax errors
    score -= validation.errors.length * 2;

    // Deduct for warnings
    score -= validation.warnings.length * 0.5;

    // Deduct for incompleteness
    if (completeness === 'partial') score -= 2;
    if (completeness === 'skeleton') score -= 4;

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Fallback pattern-based extraction
   */
  private fallbackExtraction(
    content: string,
    stageNumber: number,
    stageType: StageType
  ): RichArtifact[] {
    console.log('⚠️  Using fallback pattern-based extraction');
    const artifacts: RichArtifact[] = [];

    // Extract code blocks
    const codeBlockPattern = /```(\w+)?\n([\s\S]+?)```/g;
    let match;
    let index = 0;

    while ((match = codeBlockPattern.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2];

      artifacts.push({
        id: `artifact_${Date.now()}_${Math.random().toString(36).substring(7)}_${index++}`,
        type: 'code',
        title: `Code Snippet (${language})`,
        content: code,
        stageNumber,
        stageType,
        relatedInsightIds: [],
        relatedQuestionIds: [],
        metadata: {
          language,
          size: code.length,
        },
        validation: {
          completeness: 'partial',
          validated: false,
          validationMethod: 'pattern-match',
          validationNotes: 'Extracted via pattern matching - not validated',
        },
        createdAt: Date.now(),
      });
    }

    return artifacts;
  }

  /**
   * Get extraction statistics
   */
  getExtractionStats(artifacts: RichArtifact[]): ArtifactExtractionResult {
    const byType: Record<ArtifactType, number> = {
      code: 0,
      markdown: 0,
      table: 0,
      diagram: 0,
      guide: 0,
      framework: 0,
      report: 0,
      presentation: 0,
      other: 0,
    };

    artifacts.forEach(artifact => {
      byType[artifact.type]++;
    });

    return {
      artifacts,
      totalFound: artifacts.length,
      byType,
    };
  }
}

// Export singleton instance
export const artifactValidationService = new ArtifactValidationService();
