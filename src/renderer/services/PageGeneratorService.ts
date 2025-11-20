/**
 * Page Generator Service
 * Generates interactive HTML pages from journey data
 * Supports three modes: Template, Architect, and Multi-Agent
 * Phase 2A: Integrated with ClaudePageAnalyzer for intelligent visualization
 */

import type { Journey, Stage, Page, PageType, PageMetadata } from '@/types';
import { claudePageAnalyzer, type JourneyAnalysis } from './claude/ClaudePageAnalyzer';
import { claudePageGenerator } from './claude/ClaudePageGenerator';
import { chunkedPageGenerator } from './claude/ChunkedPageGenerator';
import type { ProgressCallback } from './claude/types/generation-progress';
import { claudeService } from './claude/ClaudeService';
import { ipcClient } from './ipc/IPCClient';
import { escapeHtml, formatForTTS, formatContentAsParagraphs } from './page-generator/utils/text-formatters';
import { transformStageToSpeech, getChapterTitle, toNarrativeProse, addConversationalFlow, generateLiteratureTitle } from './page-generator/utils/narrative-helpers';
import type { DesignStyle } from '@/types/design-language';

export interface GeneratePageOptions {
  type: PageType;
  templateType?: 'report' | 'wiki' | 'presentation' | 'timeline' | 'mindmap' | 'website' | 'literature' | 'carousel' | 'linkedin-content';
  designStyle?: DesignStyle; // Optional design style override (undefined = auto)
  title?: string;
  skipAnalysis?: boolean; // Skip Claude analysis (for testing)
  useAIGeneration?: boolean; // Use Claude to generate custom code (default: true)
  onProgress?: ProgressCallback; // Progress callback for chunked generation
  useChunkedGeneration?: boolean; // Use chunked generation (default: true for reliability)
}

export class PageGeneratorService {
  /**
   * Generate a page from a journey (Phase 2A: with intelligent analysis)
   */
  async generatePage(journey: Journey, options: GeneratePageOptions): Promise<Page> {
    const timestamp = Date.now();
    const id = `page_${timestamp}_${Math.random().toString(36).substring(7)}`;

    let analysis: JourneyAnalysis | null = null;

    // Step 1: Analyze journey with Claude (or use cache)
    if (!options.skipAnalysis && ipcClient.isAvailable()) {
      try {
        console.log('🔍 Checking for cached analysis...');
        const cachedResult = await ipcClient.readPageAnalysis(journey.id);

        if (cachedResult?.analysis && this.isAnalysisFresh(cachedResult.analysis, journey)) {
          console.log('✅ Using cached analysis');
          analysis = cachedResult.analysis;
        } else {
          console.log('🧠 Running new Claude analysis...');
          analysis = await claudePageAnalyzer.analyzeJourney(journey);

          // Cache the analysis
          await ipcClient.savePageAnalysis(journey.id, analysis);
          console.log('💾 Analysis cached');
        }
      } catch (error) {
        console.warn('Failed to get/cache analysis:', error);
        // Continue without analysis
      }
    }

    // Step 2: Determine template type (use recommendation or user choice)
    const templateType = options.templateType || analysis?.recommendations.primary || 'report';
    console.log(`📄 Using template: ${templateType}`);

    // Step 3: Generate page content
    let content: string;
    let metadata: PageMetadata;

    switch (options.type) {
      case 'template':
        ({ content, metadata } = await this.generateFromTemplate(journey, templateType, analysis, options));
        break;
      case 'architect':
        ({ content, metadata } = await this.generateWithArchitect(journey));
        break;
      case 'multi-agent':
        ({ content, metadata } = await this.generateWithMultiAgent(journey));
        break;
      default:
        throw new Error(`Unknown page type: ${options.type}`);
    }

    // Step 4: Save to file system (if IPC available)
    let filePath: string | undefined;
    let fileSize: number | undefined;

    if (ipcClient.isAvailable()) {
      try {
        const result = await ipcClient.savePageFile(journey.id, id, content, templateType);
        filePath = result.filePath;
        fileSize = result.fileSize;
        console.log(`💾 Saved to file: ${filePath} (${(fileSize / 1024).toFixed(1)} KB)`);
      } catch (error) {
        console.warn('Failed to save page file:', error);
        // Continue without file storage
      }
    }

    // Step 5: Create page object with all metadata
    const page: Page = {
      id,
      journeyId: journey.id,
      type: options.type,
      templateName: templateType,
      title: options.title || journey.input,
      content,
      metadata,
      filePath,
      fileSize,
      analysisData: analysis ? JSON.stringify(analysis) : undefined,
      analysisTimestamp: analysis?.analyzedAt,
      version: 1,
      createdAt: timestamp,
    };

    return page;
  }

  /**
   * Check if cached analysis is still fresh
   */
  private isAnalysisFresh(analysis: JourneyAnalysis, journey: Journey): boolean {
    if (!analysis?.analyzedAt) return false;

    // Analysis is stale if journey was updated after analysis
    if (journey.updatedAt && journey.updatedAt > analysis.analyzedAt) {
      return false;
    }

    // Analysis is stale if more than 24 hours old
    const ageMs = Date.now() - analysis.analyzedAt;
    const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours

    return ageMs < maxAgeMs;
  }

  /**
   * Get cached analysis for a journey
   */
  async getCachedAnalysis(journeyId: string): Promise<JourneyAnalysis | null> {
    if (!ipcClient.isAvailable()) return null;

    try {
      const result = await ipcClient.readPageAnalysis(journeyId);
      return result?.analysis || null;
    } catch (error) {
      console.warn('Failed to read cached analysis:', error);
      return null;
    }
  }

  /**
   * Generate page from template (Phase 2B: AI-generated custom pages)
   */
  private async generateFromTemplate(
    journey: Journey,
    templateType: 'report' | 'wiki' | 'presentation' | 'timeline' | 'mindmap' | 'website' | 'literature' | 'carousel' | 'linkedin-content',
    analysis?: JourneyAnalysis | null,
    options?: GeneratePageOptions
  ): Promise<{ content: string; metadata: PageMetadata }> {
    // Static templates (report, wiki, literature) - fast generation, no API calls
    // UNLESS a design style is explicitly selected (then always use AI generation)
    const staticTemplates = ['report', 'wiki', 'literature'];
    const useStaticTemplate = staticTemplates.includes(templateType) && !options?.designStyle;

    // AI Generation: Use Claude to generate custom, interactive pages (like Lovable)
    // Only for interactive templates: website, presentation, timeline, mindmap
    if (analysis && !useStaticTemplate) {
      try {
        console.log('🎨 Using AI generation for custom page...');

        // Default to MONOLITHIC generation for design language support
        // Chunked generation doesn't support design languages yet
        const useChunked = options?.useChunkedGeneration === true;

        if (useChunked) {
          console.log('✨ Using CHUNKED generation (resilient to network issues)...');
          const generated = await chunkedPageGenerator.generateWithProgress(
            journey,
            analysis,
            templateType,
            options?.onProgress,
            options?.designStyle
          );

          return {
            content: generated.html,
            metadata: {
              templateType,
              generationTime: generated.metadata.generationTime,
              hasAnalysis: true,
              aiGenerated: true,
              model: generated.metadata.model,
              tokensUsed: generated.metadata.tokensUsed,
              chunked: true, // Mark as chunked generation
            },
          };
        } else {
          console.log('⚡ Using MONOLITHIC generation (original approach)...');
          const generated = await claudePageGenerator.generateCustomPage(
            journey,
            analysis,
            templateType,
            options?.designStyle
          );

          return {
            content: generated.html,
            metadata: {
              templateType,
              generationTime: generated.metadata.generationTime,
              hasAnalysis: true,
              aiGenerated: true,
              model: generated.metadata.model,
              tokensUsed: generated.metadata.tokensUsed,
            },
          };
        }
      } catch (error) {
        console.error('❌ AI generation failed, falling back to static template:');
        console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Full error object:', error);
        // Fall through to static templates
      }
    }

    // Static templates - instant generation
    if (useStaticTemplate) {
      console.log('⚡ Using fast static template (no API call)...');
    } else {
      console.log('📄 Using static template as fallback...');
    }

    switch (templateType) {
      case 'website':
        return this.generateWebsiteTemplate(journey, analysis);
      case 'report':
        return this.generateReportTemplate(journey, analysis);
      case 'wiki':
        return this.generateWikiTemplate(journey, analysis);
      case 'presentation':
        return this.generatePresentationTemplate(journey, analysis);
      case 'timeline':
        return this.generateTimelineTemplate(journey, analysis);
      case 'mindmap':
        return this.generateMindmapTemplate(journey, analysis);
      case 'literature':
        return this.generateLiteratureTemplate(journey, analysis);
      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }
  }

  /**
   * Generate website template - comprehensive multi-section website
   */
  private async generateWebsiteTemplate(
    journey: Journey,
    analysis?: JourneyAnalysis | null
  ): Promise<{ content: string; metadata: PageMetadata }> {
    // Website template is the same as wiki template for now
    // This ensures backwards compatibility
    return this.generateWikiTemplate(journey, analysis);
  }

  /**
   * Generate report template (Phase 2A: enhanced with analysis)
   */
  private async generateReportTemplate(
    journey: Journey,
    analysis?: JourneyAnalysis | null
  ): Promise<{ content: string; metadata: PageMetadata }> {
    const startTime = Date.now();

    // Generate stage IDs for navigation
    const stageIds = journey.stages.map((_, i) => `stage-${i + 1}`);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(journey.input)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --primary: #6366f1;
      --primary-dark: #4f46e5;
      --primary-light: #818cf8;
      --background: #f8fafc;
      --surface: #ffffff;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-tertiary: #94a3b8;
      --border: #e2e8f0;
      --accent-discovering: #ec4899;
      --accent-chasing: #8b5cf6;
      --accent-solving: #3b82f6;
      --accent-challenging: #f59e0b;
      --accent-questioning: #06b6d4;
      --accent-searching: #10b981;
      --accent-imagining: #a855f7;
      --accent-building: #f97316;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.7;
      color: var(--text-primary);
      background: var(--background);
      display: flex;
      min-height: 100vh;
    }

    /* Navigation Sidebar */
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      width: 280px;
      height: 100vh;
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 2rem 1.5rem;
      overflow-y: auto;
      z-index: 100;
    }

    .sidebar-header { margin-bottom: 2rem; }

    .sidebar-title {
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
      margin-bottom: 1rem;
    }

    .nav-links { list-style: none; }

    .nav-link {
      display: block;
      padding: 0.75rem 1rem;
      margin-bottom: 0.25rem;
      color: var(--text-secondary);
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s;
      font-size: 0.875rem;
      border-left: 3px solid transparent;
    }

    .nav-link:hover {
      background: var(--background);
      color: var(--primary);
      border-left-color: var(--primary);
      transform: translateX(4px);
    }

    .nav-link.active {
      background: #eef2ff;
      color: var(--primary);
      border-left-color: var(--primary);
      font-weight: 600;
    }

    .stage-type-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      background: var(--background);
      border-radius: 4px;
      font-size: 0.75rem;
      margin-left: 0.5rem;
      text-transform: capitalize;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      margin-left: 280px;
      padding: 3rem;
      max-width: 1200px;
    }

    /* Header */
    .header {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid var(--border);
    }

    .title {
      font-size: 3rem;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 1rem;
      line-height: 1.2;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Stage Sections */
    .stage-section {
      margin-bottom: 4rem;
      scroll-margin-top: 2rem;
    }

    .stage-card {
      background: var(--surface);
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stage-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .stage-header-bar {
      padding: 1.5rem 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .stage-number {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
      color: white;
      flex-shrink: 0;
    }

    .stage-header-content { flex: 1; }

    .stage-type-label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.875rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: white;
      margin-bottom: 0.5rem;
    }

    .stage-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Stage type colors */
    .stage-discovering { background: var(--accent-discovering); }
    .stage-chasing { background: var(--accent-chasing); }
    .stage-solving { background: var(--accent-solving); }
    .stage-challenging { background: var(--accent-challenging); }
    .stage-questioning { background: var(--accent-questioning); }
    .stage-searching { background: var(--accent-searching); }
    .stage-imagining { background: var(--accent-imagining); }
    .stage-building { background: var(--accent-building); }

    .stage-body { padding: 2rem; }

    .thinking-section {
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
      border-left: 4px solid var(--accent-challenging);
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      border-radius: 8px;
    }

    .thinking-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      color: #9a3412;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }

    .thinking-content {
      color: #7c2d12;
      font-style: italic;
      line-height: 1.6;
    }

    .content-section {
      color: var(--text-secondary);
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.8;
      font-size: 1rem;
    }

    .artifacts-section {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
    }

    .artifacts-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .artifacts-grid { display: grid; gap: 1rem; }

    .artifact-card {
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      transition: all 0.2s;
    }

    .artifact-card:hover {
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
    }

    .artifact-type {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: var(--primary);
      color: white;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .artifact-title {
      color: var(--text-primary);
      font-weight: 600;
      font-size: 0.875rem;
    }

    /* Footer */
    .footer {
      margin-top: 4rem;
      padding: 2rem;
      background: var(--surface);
      border-radius: 12px;
      text-align: center;
      color: var(--text-tertiary);
      font-size: 0.875rem;
    }

    .footer-title {
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    html { scroll-behavior: smooth; }

    /* PDF Download Button */
    .pdf-download-btn {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      transition: all 0.2s;
      z-index: 1000;
    }

    .pdf-download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    }

    .pdf-download-btn:active {
      transform: translateY(0);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s;
      }
      .sidebar.open { transform: translateX(0); }
      .main-content {
        margin-left: 0;
        padding: 2rem 1.5rem;
      }
      .title { font-size: 2rem; }
      .pdf-download-btn {
        bottom: 1rem;
        right: 1rem;
        padding: 0.75rem 1.25rem;
        font-size: 0.8125rem;
      }
    }

    /* PDF/Print Styles */
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      @page {
        size: A4;
        margin: 1.5cm 1cm;
      }

      body {
        background: white;
        font-size: 10pt;
      }

      .sidebar,
      .pdf-download-btn {
        display: none !important;
      }

      .main-content {
        margin-left: 0;
        padding: 0;
        max-width: 100%;
      }

      .header {
        page-break-after: avoid;
        border-bottom: 2px solid #000;
      }

      .title {
        font-size: 24pt;
        color: #000 !important;
        background: none !important;
        -webkit-text-fill-color: #000 !important;
      }

      .meta {
        color: #333;
        font-size: 9pt;
      }

      .stage-section {
        page-break-before: auto;
        page-break-after: auto;
        page-break-inside: avoid;
        margin-bottom: 1.5rem;
      }

      .stage-card {
        page-break-inside: avoid;
        box-shadow: none;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
      }

      .stage-header-bar {
        page-break-after: avoid;
        background: #f8f9fa !important;
        border-bottom: 1px solid #ddd;
      }

      .stage-number {
        width: 36px;
        height: 36px;
        font-size: 14pt;
      }

      .stage-type-label {
        font-size: 8pt;
      }

      .stage-title {
        font-size: 14pt;
        color: #000;
      }

      .stage-body {
        page-break-before: avoid;
      }

      .thinking-section {
        page-break-inside: avoid;
        background: #fff7ed !important;
        border-left: 3px solid #f59e0b;
      }

      .content-section {
        color: #333;
        font-size: 10pt;
        line-height: 1.6;
      }

      .artifacts-section {
        page-break-before: avoid;
        page-break-inside: avoid;
      }

      .artifact-card {
        page-break-inside: avoid;
        border: 1px solid #ddd;
      }

      .footer {
        page-break-before: auto;
        margin-top: 2rem;
        border-top: 1px solid #ddd;
      }

      /* Avoid orphans and widows */
      p, .content-section {
        orphans: 3;
        widows: 3;
      }

      h1, h2, h3 {
        page-break-after: avoid;
      }
    }
  </style>
  <script>
    // PDF Download function - defined globally
    function downloadPDF() {
      window.print();
    }

    // Navigation and scroll tracking
    (function() {
      'use strict';
      document.addEventListener('DOMContentLoaded', function() {
        var navLinks = document.querySelectorAll('.nav-link');
        var sections = document.querySelectorAll('.stage-section');

        navLinks.forEach(function(link) {
          link.addEventListener('click', function(e) {
            e.preventDefault();
            var targetId = link.getAttribute('href').substring(1);
            var target = document.getElementById(targetId);
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
        });

        var observerOptions = {
          root: null,
          rootMargin: '-20% 0px -70% 0px',
          threshold: 0
        };

        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              navLinks.forEach(function(link) {
                link.classList.remove('active');
              });
              var activeLink = document.querySelector('a[href="#' + entry.target.id + '"]');
              if (activeLink) {
                activeLink.classList.add('active');
              }
            }
          });
        }, observerOptions);

        sections.forEach(function(section) {
          observer.observe(section);
        });
      });
    })();
  </script>
</head>
<body>
  <nav class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-title">Table of Contents</div>
    </div>
    <ul class="nav-links">
      <li><a href="#overview" class="nav-link active">Overview</a></li>
      ${journey.stages.map((stage, i) => `
      <li>
        <a href="#${stageIds[i]}" class="nav-link">
          Stage ${i + 1}
          <span class="stage-type-badge">${stage.type}</span>
        </a>
      </li>
      `).join('')}
      <li><a href="#summary" class="nav-link">Summary</a></li>
    </ul>
  </nav>

  <main class="main-content">
    <section id="overview" class="header">
      <h1 class="title">${escapeHtml(journey.input)}</h1>
      <div class="meta">
        <div class="meta-item">
          <span>📅</span>
          <span>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="meta-item">
          <span>🎯</span>
          <span>${journey.stages.length} Exploration Stages</span>
        </div>
        ${analysis ? `
        <div class="meta-item">
          <span>🧠</span>
          <span>Content Type: ${analysis.contentType}</span>
        </div>
        ` : ''}
      </div>
    </section>

    ${journey.stages.map((stage, index) => `
    <section id="${stageIds[index]}" class="stage-section">
      <div class="stage-card">
        <div class="stage-header-bar">
          <div class="stage-number stage-${stage.type}">
            ${index + 1}
          </div>
          <div class="stage-header-content">
            <div class="stage-type-label stage-${stage.type}">
              ${stage.type === 'discovering' ? '🔍' : ''}
              ${stage.type === 'chasing' ? '🎯' : ''}
              ${stage.type === 'solving' ? '💡' : ''}
              ${stage.type === 'challenging' ? '⚡' : ''}
              ${stage.type === 'questioning' ? '❓' : ''}
              ${stage.type === 'searching' ? '🔎' : ''}
              ${stage.type === 'imagining' ? '💭' : ''}
              ${stage.type === 'building' ? '🏗️' : ''}
              ${stage.type}
            </div>
            <h2 class="stage-title">Stage ${index + 1}</h2>
          </div>
        </div>

        <div class="stage-body">
          ${stage.thinking ? `
          <div class="thinking-section">
            <div class="thinking-label">
              <span>💭</span>
              <span>Extended Thinking</span>
            </div>
            <div class="thinking-content">
              ${escapeHtml(stage.thinking.substring(0, 300))}${stage.thinking.length > 300 ? '...' : ''}
            </div>
          </div>
          ` : ''}

          <div class="content-section">${escapeHtml(stage.result)}</div>

          ${stage.artifacts.length > 0 ? `
          <div class="artifacts-section">
            <div class="artifacts-header">
              <span>📦</span>
              <span>Artifacts (${stage.artifacts.length})</span>
            </div>
            <div class="artifacts-grid">
              ${stage.artifacts.map(artifact => `
              <div class="artifact-card">
                <div class="artifact-type">${artifact.type}</div>
                <div class="artifact-title">${escapeHtml(artifact.title)}</div>
              </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    </section>
    `).join('')}

    <section id="summary" class="footer">
      <div class="footer-title">Generated by Perpetua</div>
      <p>The Infinite Thought Engine</p>
      <p style="margin-top: 0.5rem; opacity: 0.7;">Journey ID: ${journey.id}</p>
    </section>
  </main>

  <!-- PDF Download Button -->
  <button class="pdf-download-btn" onclick="downloadPDF()" aria-label="Download as PDF">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    Download PDF
  </button>
</body>
</html>
    `;

    return {
      content: html.trim(),
      metadata: {
        templateType: 'report',
        generationTime: Date.now() - startTime,
        hasAnalysis: !!analysis,
        analysisConfidence: analysis?.recommendations.confidence,
      },
    };
  }

  /**
   * Generate wiki template (Phase 2A: enhanced with analysis)
   */
  private async generateWikiTemplate(
    journey: Journey,
    analysis?: JourneyAnalysis | null
  ): Promise<{ content: string; metadata: PageMetadata }> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(journey.input)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #202122;
      background: #f8f9fa;
    }
    .wiki-container {
      display: grid;
      grid-template-columns: 200px 1fr;
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
    }
    .sidebar {
      background: #f8f9fa;
      border-right: 1px solid #a2a9b1;
      padding: 1.5rem 1rem;
    }
    .sidebar-title {
      font-weight: 600;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      text-transform: uppercase;
      color: #54595d;
    }
    .toc {
      list-style: none;
    }
    .toc li {
      padding: 0.5rem 0;
    }
    .toc a {
      color: #0645ad;
      text-decoration: none;
      font-size: 0.875rem;
    }
    .toc a:hover {
      text-decoration: underline;
    }
    .content {
      background: white;
      padding: 2rem;
      border: 1px solid #a2a9b1;
      border-left: none;
    }
    h1 {
      font-size: 2rem;
      border-bottom: 1px solid #a2a9b1;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }
    h2 {
      font-size: 1.5rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid #eaecf0;
      padding-bottom: 0.25rem;
    }
    .stage-section {
      margin: 1.5rem 0;
    }
    .infobox {
      float: right;
      width: 300px;
      margin: 0 0 1rem 1rem;
      background: #f8f9fa;
      border: 1px solid #a2a9b1;
      padding: 1rem;
    }
    .infobox-title {
      font-weight: 600;
      text-align: center;
      margin-bottom: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="wiki-container">
    <div class="sidebar">
      <div class="sidebar-title">Contents</div>
      <ul class="toc">
        ${journey.stages.map((stage, index) => `
          <li><a href="#stage-${index}">${stage.type}</a></li>
        `).join('')}
      </ul>
    </div>
    <div class="content">
      <h1>${escapeHtml(journey.input)}</h1>
      <div class="infobox">
        <div class="infobox-title">Journey Info</div>
        <div><strong>Stages:</strong> ${journey.stages.length}</div>
        <div><strong>Status:</strong> ${journey.status}</div>
        <div><strong>Created:</strong> ${new Date(journey.createdAt).toLocaleDateString()}</div>
      </div>
      ${journey.stages.map((stage, index) => `
        <div id="stage-${index}" class="stage-section">
          <h2>${stage.type}</h2>
          <p>${escapeHtml(stage.result)}</p>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
    `;

    return {
      content: html.trim(),
      metadata: {
        templateType: 'wiki',
        generationTime: Date.now(),
        hasAnalysis: !!analysis,
        analysisConfidence: analysis?.recommendations.confidence,
      },
    };
  }

  /**
   * Generate presentation template with Reveal.js (Phase 3)
   */
  private async generatePresentationTemplate(
    journey: Journey,
    analysis?: JourneyAnalysis | null
  ): Promise<{ content: string; metadata: PageMetadata }> {
    // Use analysis insights if available
    const insights = analysis?.templateInsights?.presentation;
    const stages = journey.stages;

    // Generate slides from stages
    const slides = stages.map((stage, index) => {
      const stageTitle = stage.type.charAt(0).toUpperCase() + stage.type.slice(1);

      // Extract key points from stage result
      const lines = stage.result.split('\n').filter(l => l.trim());
      const bullets = lines.slice(0, 5).map(line => {
        // Clean up bullet text
        return line.replace(/^[-*•]\s*/, '').substring(0, 150);
      });

      return `
        <section>
          <h2>${escapeHtml(stageTitle)}</h2>
          <p class="stage-number">Stage ${index + 1} of ${stages.length}</p>
          <ul>
            ${bullets.map(bullet => `<li>${escapeHtml(bullet)}</li>`).join('\n            ')}
          </ul>
        </section>
      `;
    });

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(journey.input)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/theme/black.min.css">
  <style>
    .reveal h1 { font-size: 2.5em; text-transform: none; }
    .reveal h2 { font-size: 1.8em; text-transform: none; margin-bottom: 1em; }
    .reveal .stage-number {
      font-size: 0.8em;
      color: #7c7c7c;
      margin-bottom: 1.5em;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .reveal ul { text-align: left; font-size: 0.9em; line-height: 1.6; }
    .reveal li { margin-bottom: 0.8em; }
    .reveal .title-slide {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .reveal .summary-slide {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .reveal .metadata {
      font-size: 0.7em;
      color: #aaa;
      margin-top: 2em;
    }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <!-- Title Slide -->
      <section class="title-slide">
        <h1>${escapeHtml(journey.input)}</h1>
        <p class="metadata">
          Exploration Journey • ${stages.length} Stages •
          ${new Date(journey.createdAt).toLocaleDateString()}
        </p>
      </section>

      <!-- Stage Slides -->
      ${slides.join('\n')}

      <!-- Summary Slide -->
      <section class="summary-slide">
        <h2>Journey Complete</h2>
        <p>Explored through ${stages.length} stages:</p>
        <ul style="font-size: 0.8em;">
          ${stages.map(s => `<li>${escapeHtml(s.type)}</li>`).join('\n          ')}
        </ul>
        <p class="metadata">Generated with Perpetua • The Infinite Thought Engine</p>
      </section>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.min.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      transition: 'slide',
      backgroundTransition: 'fade',
      controls: true,
      progress: true,
      center: true,
      slideNumber: 'c/t',
      keyboard: true,
      overview: true,
      touch: true,
      loop: false,
      rtl: false,
      shuffle: false,
      fragments: true,
      embedded: false,
      help: true,
      showNotes: false,
      autoSlide: 0,
      autoSlideStoppable: true,
      mouseWheel: false,
      hideAddressBar: true,
      previewLinks: false,
      transitionSpeed: 'default',
      width: 960,
      height: 700,
      margin: 0.1,
      minScale: 0.2,
      maxScale: 2.0
    });
  </script>
</body>
</html>
    `;

    return {
      content: html.trim(),
      metadata: {
        templateType: 'presentation',
        generationTime: Date.now(),
        hasAnalysis: !!analysis,
        analysisConfidence: analysis?.recommendations.confidence,
        slideCount: stages.length + 2, // stages + title + summary
      },
    };
  }

  /**
   * Generate timeline template with D3.js (Phase 3)
   */
  private async generateTimelineTemplate(
    journey: Journey,
    analysis?: JourneyAnalysis | null
  ): Promise<{ content: string; metadata: PageMetadata }> {
    // Use analysis insights if available
    const insights = analysis?.templateInsights?.timeline;
    const stages = journey.stages;

    // Convert stages to timeline events
    const events = stages.map((stage, index) => ({
      id: index,
      stage: stage.type,
      title: stage.type.charAt(0).toUpperCase() + stage.type.slice(1),
      description: stage.result.substring(0, 200) + (stage.result.length > 200 ? '...' : ''),
      timestamp: new Date(stage.createdAt).toISOString(),
      artifacts: stage.artifacts.length,
    }));

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(journey.input)} - Timeline</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(to bottom, #0f0c29, #302b63, #24243e);
      color: white;
      min-height: 100vh;
      padding: 2rem;
    }
    .header {
      text-align: center;
      margin-bottom: 3rem;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle {
      color: #aaa;
      font-size: 0.9rem;
    }
    #timeline {
      max-width: 1200px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 2rem;
      backdrop-filter: blur(10px);
    }
    .timeline-line {
      stroke: #667eea;
      stroke-width: 3;
    }
    .event-circle {
      fill: #764ba2;
      stroke: #667eea;
      stroke-width: 2;
      cursor: pointer;
      transition: all 0.3s;
    }
    .event-circle:hover {
      fill: #667eea;
      r: 10;
    }
    .event-label {
      fill: white;
      font-size: 14px;
      font-weight: 600;
      text-anchor: middle;
    }
    .event-date {
      fill: #aaa;
      font-size: 11px;
      text-anchor: middle;
    }
    .tooltip {
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #667eea;
      max-width: 300px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 1000;
    }
    .tooltip.active {
      opacity: 1;
    }
    .tooltip h3 {
      margin-bottom: 0.5rem;
      color: #667eea;
    }
    .tooltip p {
      font-size: 0.9rem;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(journey.input)}</h1>
    <p class="subtitle">${stages.length} stages explored • ${new Date(journey.createdAt).toLocaleDateString()}</p>
  </div>

  <div id="timeline"></div>
  <div class="tooltip" id="tooltip"></div>

  <script>
    const events = ${JSON.stringify(events)};

    const width = 1200;
    const height = 400;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };

    const svg = d3.select('#timeline')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', \`0 0 \${width} \${height}\`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const xScale = d3.scaleLinear()
      .domain([0, events.length - 1])
      .range([margin.left, width - margin.right]);

    const y = height / 2;

    // Draw timeline line
    svg.append('line')
      .attr('class', 'timeline-line')
      .attr('x1', margin.left)
      .attr('y1', y)
      .attr('x2', width - margin.right)
      .attr('y2', y);

    // Draw events
    const eventGroups = svg.selectAll('.event')
      .data(events)
      .enter()
      .append('g')
      .attr('class', 'event')
      .attr('transform', (d, i) => \`translate(\${xScale(i)}, \${y})\`);

    eventGroups.append('circle')
      .attr('class', 'event-circle')
      .attr('r', 8)
      .on('mouseover', function(event, d) {
        const tooltip = d3.select('#tooltip');
        tooltip.classed('active', true)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
          .html(\`
            <h3>\${d.title}</h3>
            <p><strong>Stage:</strong> \${d.stage}</p>
            <p><strong>Artifacts:</strong> \${d.artifacts}</p>
            <p>\${d.description}</p>
          \`);
      })
      .on('mouseout', function() {
        d3.select('#tooltip').classed('active', false);
      });

    eventGroups.append('text')
      .attr('class', 'event-label')
      .attr('y', -20)
      .text(d => d.title);

    eventGroups.append('text')
      .attr('class', 'event-date')
      .attr('y', 30)
      .text((d, i) => \`Stage \${i + 1}\`);
  </script>
</body>
</html>
    `;

    return {
      content: html.trim(),
      metadata: {
        templateType: 'timeline',
        generationTime: Date.now(),
        hasAnalysis: !!analysis,
        analysisConfidence: analysis?.recommendations.confidence,
        eventCount: events.length,
      },
    };
  }

  /**
   * Generate mindmap template with D3.js force graph (Phase 3)
   */
  private async generateMindmapTemplate(
    journey: Journey,
    analysis?: JourneyAnalysis | null
  ): Promise<{ content: string; metadata: PageMetadata }> {
    // Use analysis insights if available
    const insights = analysis?.templateInsights?.mindmap;
    const stages = journey.stages;

    // Create nodes from stages
    const nodes = [
      { id: 'root', label: journey.input.substring(0, 50), type: 'root', group: 0 }
    ];

    stages.forEach((stage, index) => {
      nodes.push({
        id: stage.id,
        label: stage.type,
        type: 'stage',
        group: index + 1,
        artifacts: stage.artifacts.length,
      });
    });

    // Create links connecting stages
    const links = stages.map((stage, index) => ({
      source: index === 0 ? 'root' : stages[index - 1].id,
      target: stage.id,
      value: 1,
    }));

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(journey.input)} - Mind Map</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1e 100%);
      color: white;
      overflow: hidden;
      height: 100vh;
    }
    .header {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 10;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.3rem;
      color: #667eea;
    }
    .subtitle {
      color: #aaa;
      font-size: 0.8rem;
    }
    #mindmap {
      width: 100vw;
      height: 100vh;
    }
    .node-root {
      fill: #667eea;
      stroke: #764ba2;
      stroke-width: 3;
    }
    .node-stage {
      fill: #764ba2;
      stroke: #667eea;
      stroke-width: 2;
    }
    .node:hover {
      fill: #ff6b9d;
      cursor: pointer;
    }
    .node-label {
      fill: white;
      font-size: 12px;
      font-weight: 600;
      text-anchor: middle;
      pointer-events: none;
      text-shadow: 0 0 3px rgba(0,0,0,0.8);
    }
    .link {
      stroke: #667eea;
      stroke-opacity: 0.6;
      stroke-width: 2;
    }
    .controls {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #667eea;
    }
    .controls button {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      margin: 0.2rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .controls button:hover {
      background: #764ba2;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(journey.input)}</h1>
    <p class="subtitle">${stages.length} connected stages</p>
  </div>

  <svg id="mindmap"></svg>

  <div class="controls">
    <button onclick="resetSimulation()">Reset Layout</button>
  </div>

  <script>
    const nodes = ${JSON.stringify(nodes)};
    const links = ${JSON.stringify(links)};

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select('#mindmap')
      .attr('width', width)
      .attr('height', height);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link');

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', d => \`node node-\${d.type}\`)
      .attr('r', d => d.type === 'root' ? 30 : 20)
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    const label = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('class', 'node-label')
      .attr('dy', d => d.type === 'root' ? -35 : -25)
      .text(d => d.label);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function resetSimulation() {
      nodes.forEach(node => {
        node.fx = null;
        node.fy = null;
      });
      simulation.alpha(1).restart();
    }
  </script>
</body>
</html>
    `;

    return {
      content: html.trim(),
      metadata: {
        templateType: 'mindmap',
        generationTime: Date.now(),
        hasAnalysis: !!analysis,
        analysisConfidence: analysis?.recommendations.confidence,
        nodeCount: nodes.length,
        linkCount: links.length,
      },
    };
  }

  /**
   * Generate literature template - book/podcast-style narrative
   * Optimized for TTS (text-to-speech) conversion
   */
  private async generateLiteratureTemplate(
    journey: Journey,
    analysis?: JourneyAnalysis | null
  ): Promise<{ content: string; metadata: PageMetadata }> {
    const startTime = Date.now();

    console.log('📖 Generating Literature with LLM-powered storytelling...');
    console.log(`📊 Journey: "${journey.input}" with ${journey.stages.length} stages`);

    // Generate compelling title and subtitle (Steve Jobs style)
    console.log('🎨 Generating compelling title and subtitle...');
    const { title, subtitle } = await generateLiteratureTitle(
      journey.input,
      journey.stages
    );

    // Transform stages into narrative chapters using Claude
    const chapters = await Promise.all(
      journey.stages.map(async (stage, index) => {
        const chapterNumber = index + 1;
        const chapterTitle = getChapterTitle(stage.type, chapterNumber);

        console.log(`✍️  Chapter ${chapterNumber}: Transforming "${stage.type}" into speech...`);

        // Use Claude to transform this stage into compelling narrative
        const narrativeContent = await transformStageToSpeech(
          stage,
          chapterNumber,
          journey.input,
          journey.stages.length
        );

        return {
          number: chapterNumber,
          title: chapterTitle,
          content: narrativeContent,
          thinking: '', // Thinking is now integrated into the narrative by Claude
          artifacts: '', // Artifacts are now woven into the story by Claude
        };
      })
    );

    console.log(`✅ All ${chapters.length} chapters transformed into compelling speech`);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(journey.input)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --color-bg: #faf9f6;
      --color-text: #2b2b2b;
      --color-text-light: #5a5a5a;
      --color-accent: #8b7355;
      --color-accent-light: #b5a08f;
      --color-divider: #e0ddd7;
      --font-serif: 'Georgia', 'Times New Roman', serif;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    body {
      font-family: var(--font-serif);
      line-height: 1.8;
      color: var(--color-text);
      background: var(--color-bg);
      padding: 0;
      margin: 0;
    }

    .book-container {
      max-width: 720px;
      margin: 0 auto;
      padding: 4rem 2rem;
      min-height: 100vh;
    }

    /* Header / Cover */
    .book-header {
      text-align: center;
      margin-bottom: 6rem;
      padding: 3rem 0;
      border-bottom: 2px solid var(--color-divider);
    }

    .book-title {
      font-size: 3rem;
      font-weight: 700;
      color: var(--color-accent);
      margin-bottom: 1rem;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .book-subtitle {
      font-family: var(--font-sans);
      font-size: 1.125rem;
      color: var(--color-text-light);
      font-weight: 400;
      font-style: italic;
    }

    .book-meta {
      font-family: var(--font-sans);
      font-size: 0.875rem;
      color: var(--color-text-light);
      margin-top: 2rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* Chapters */
    .chapter {
      margin-bottom: 6rem;
      page-break-before: always;
    }

    .chapter-header {
      margin-bottom: 2.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-divider);
    }

    .chapter-number {
      font-family: var(--font-sans);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-accent);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 0.5rem;
    }

    .chapter-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text);
      line-height: 1.3;
    }

    .chapter-content {
      font-size: 1.125rem;
      line-height: 1.9;
      color: var(--color-text);
      text-align: justify;
      hyphens: auto;
    }

    .chapter-content p {
      margin-bottom: 1.5rem;
      text-indent: 2em;
    }

    .chapter-content p:first-child,
    .chapter-content p.no-indent {
      text-indent: 0;
    }

    /* Reflection sections (Extended Thinking) - seamlessly integrated */
    .reflection-section {
      margin: 2rem 0;
      font-style: italic;
      color: var(--color-text-light);
      line-height: 1.9;
    }

    .reflection-section p {
      margin-bottom: 1.5rem;
      text-indent: 0;
    }

    /* Discoveries section (Artifacts) - woven into narrative */
    .discoveries-section {
      margin: 2rem 0;
    }

    .discoveries-section p {
      margin-bottom: 1.5rem;
      text-indent: 0;
    }

    /* Footer */
    .book-footer {
      margin-top: 6rem;
      padding: 3rem 0 2rem;
      border-top: 2px solid var(--color-divider);
      text-align: center;
    }

    .footer-text {
      font-family: var(--font-sans);
      font-size: 0.875rem;
      color: var(--color-text-light);
      line-height: 1.6;
    }

    /* Download Buttons */
    .download-buttons {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      z-index: 1000;
    }

    .download-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: var(--color-accent);
      color: white;
      border: none;
      border-radius: 8px;
      font-family: var(--font-sans);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(139, 115, 85, 0.3);
      transition: all 0.2s;
      text-decoration: none;
    }

    .download-btn:hover {
      background: #7a6349;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(139, 115, 85, 0.4);
    }

    .download-btn:active {
      transform: translateY(0);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .book-container {
        padding: 2rem 1.5rem;
      }

      .book-title {
        font-size: 2rem;
      }

      .chapter-title {
        font-size: 1.5rem;
      }

      .chapter-content {
        font-size: 1rem;
        text-align: left;
      }

      .download-buttons {
        bottom: 1rem;
        right: 1rem;
      }

      .download-btn {
        padding: 0.75rem 1.25rem;
        font-size: 0.8125rem;
      }
    }

    /* Print/PDF Styles */
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      @page {
        size: A4;
        margin: 2cm 1.5cm;
      }

      body {
        background: white;
      }

      .download-buttons {
        display: none !important;
      }

      .book-container {
        max-width: 100%;
        padding: 0;
      }

      .chapter {
        page-break-before: always;
        page-break-inside: avoid;
      }

      .chapter-header {
        page-break-after: avoid;
      }

      .reflection-section,
      .discoveries-section {
        page-break-inside: avoid;
      }

      .chapter-content p {
        orphans: 3;
        widows: 3;
      }

      h1, h2, h3 {
        page-break-after: avoid;
      }
    }
  </style>
  <script>
    // Download as plain text for TTS
    function downloadText() {
      // Extract all chapter text content
      const titleEl = document.querySelector('.book-title');
      const title = titleEl ? titleEl.textContent : 'Journey';

      let textContent = title + '\\n';
      textContent += '='.repeat(title.length) + '\\n\\n';

      const chapters = document.querySelectorAll('.chapter');
      chapters.forEach(function(chapter) {
        const chapterNumber = chapter.querySelector('.chapter-number').textContent;
        const chapterTitle = chapter.querySelector('.chapter-title').textContent;
        const chapterContent = chapter.querySelector('.chapter-content').textContent;

        textContent += chapterNumber + '\\n';
        textContent += chapterTitle + '\\n';
        textContent += '-'.repeat(chapterTitle.length) + '\\n\\n';
        textContent += chapterContent.trim() + '\\n\\n\\n';
      });

      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'literature-' + Date.now() + '.txt';
      a.click();
      URL.revokeObjectURL(url);
    }

    // Download as markdown
    function downloadMarkdown() {
      const titleEl = document.querySelector('.book-title');
      const subtitleEl = document.querySelector('.book-subtitle');
      const title = titleEl ? titleEl.textContent : 'Journey';
      const subtitle = subtitleEl ? subtitleEl.textContent : '';

      let markdown = '# ' + title + '\\n\\n';
      if (subtitle) {
        markdown += '*' + subtitle + '*\\n\\n';
      }
      markdown += '---\\n\\n';

      const chapters = document.querySelectorAll('.chapter');
      chapters.forEach(function(chapter) {
        const chapterNumber = chapter.querySelector('.chapter-number').textContent;
        const chapterTitle = chapter.querySelector('.chapter-title').textContent;
        const chapterContent = chapter.querySelector('.chapter-content').textContent;

        markdown += '## ' + chapterNumber + ': ' + chapterTitle + '\\n\\n';
        markdown += chapterContent.trim() + '\\n\\n';
      });

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'literature-' + Date.now() + '.md';
      a.click();
      URL.revokeObjectURL(url);
    }

    // Print to PDF
    function printPDF() {
      window.print();
    }
  </script>
</head>
<body>
  <div class="book-container">
    <!-- Book Header / Cover -->
    <div class="book-header">
      <h1 class="book-title">${escapeHtml(title)}</h1>
      <p class="book-subtitle">${escapeHtml(subtitle)}</p>
      <div class="book-meta">
        ${new Date(journey.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
    </div>

    <!-- Chapters -->
    ${chapters.map(chapter => `
    <div class="chapter">
      <div class="chapter-header">
        <div class="chapter-number">Chapter ${chapter.number}</div>
        <h2 class="chapter-title">${chapter.title}</h2>
      </div>
      <div class="chapter-content">
        ${formatContentAsParagraphs(chapter.content)}
      </div>

      ${chapter.thinking ? `
      <div class="reflection-section">
        ${formatContentAsParagraphs(chapter.thinking)}
      </div>
      ` : ''}

      ${chapter.artifacts ? `
      <div class="discoveries-section">
        ${formatContentAsParagraphs(chapter.artifacts)}
      </div>
      ` : ''}
    </div>
    `).join('')}

    <!-- Book Footer -->
    <div class="book-footer">
      <div class="footer-text">
        <strong>Generated by Perpetua</strong><br>
        The Infinite Thought Engine<br>
        <span style="opacity: 0.8; font-size: 0.875rem; display: block; margin-top: 0.5rem;">
          Created: ${new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </span><br>
        <span style="opacity: 0.6; font-size: 0.75rem;">Journey: ${journey.id}</span>
      </div>
    </div>
  </div>

  <!-- Download Buttons -->
  <div class="download-buttons">
    <button class="download-btn" onclick="downloadText()" aria-label="Download as plain text for TTS">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
      TTS Text
    </button>
    <button class="download-btn" onclick="downloadMarkdown()" aria-label="Download as Markdown">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      Markdown
    </button>
    <button class="download-btn" onclick="printPDF()" aria-label="Print to PDF">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      PDF
    </button>
  </div>
</body>
</html>
    `;

    return {
      content: html.trim(),
      metadata: {
        templateType: 'literature',
        generationTime: Date.now() - startTime,
        hasAnalysis: !!analysis,
        analysisConfidence: analysis?.recommendations.confidence,
        chapterCount: chapters.length,
      },
    };
  }

  /**
   * Placeholder for architect mode
   */
  private async generateWithArchitect(journey: Journey): Promise<{ content: string; metadata: PageMetadata }> {
    // TODO: Implement architect mode in Phase 3
    throw new Error('Architect mode not yet implemented');
  }

  /**
   * Placeholder for multi-agent mode
   */
  private async generateWithMultiAgent(journey: Journey): Promise<{ content: string; metadata: PageMetadata }> {
    // TODO: Implement multi-agent mode in Phase 4
    throw new Error('Multi-agent mode not yet implemented');
  }
}

// Export singleton instance
export const pageGeneratorService = new PageGeneratorService();
