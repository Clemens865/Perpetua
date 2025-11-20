/**
 * Test script for Quality Scoring Service
 * Tests the evaluation of stage quality across different stage types
 */

import { qualityScoringService } from '../src/renderer/lib/engine/services/QualityScoringService';
import type { Stage } from '../src/types';

// Mock stages for testing
const mockStages: Stage[] = [
  {
    id: 'test-stage-1',
    journeyId: 'test-journey',
    type: 'discovering',
    status: 'complete',
    prompt: 'Research AI applications in healthcare',
    result: `
# Deep Exploration: AI in Healthcare

## Core Concepts
Artificial Intelligence in healthcare encompasses machine learning algorithms, natural language processing,
and computer vision systems designed to improve patient outcomes, streamline operations, and accelerate
medical research. Key applications include:

1. **Diagnostic Imaging**: AI-powered systems analyze medical images (X-rays, CT scans, MRIs) with accuracy
   matching or exceeding human radiologists. For example, Google's DeepMind achieved 94% accuracy in
   detecting breast cancer from mammograms.

2. **Drug Discovery**: AI accelerates pharmaceutical research by predicting molecular interactions and
   identifying promising drug candidates. This reduces development time from 10+ years to potentially 2-3 years.

3. **Personalized Treatment**: Machine learning models analyze patient data to recommend individualized
   treatment plans based on genetics, medical history, and response patterns.

## Historical Context
Medical AI dates back to the 1970s with MYCIN, an early expert system for bacterial infection diagnosis.
Modern deep learning breakthroughs (2012+) enabled quantum leaps in capability.

## Current State Analysis
As of 2025, AI is actively deployed in:
- Radiology departments (image analysis)
- Emergency rooms (triage prioritization)
- Research institutions (genomics, drug discovery)
- Administrative systems (billing, scheduling)

## Interdisciplinary Connections
Healthcare AI intersects with:
- **Ethics**: Patient privacy, algorithmic bias, accountability
- **Regulatory**: FDA approval processes, clinical validation
- **Economics**: Cost-effectiveness, reimbursement models
- **Sociology**: Patient trust, doctor-AI relationships

## Specific Examples
- IBM Watson for Oncology: Treatment recommendations for cancer patients
- PathAI: Pathology image analysis with 96% accuracy
- Babylon Health: Symptom checker chatbot serving 10M+ users
    `,
    artifacts: [],
    createdAt: Date.now(),
  },
  {
    id: 'test-stage-2',
    journeyId: 'test-journey',
    type: 'chasing',
    status: 'complete',
    prompt: 'Find deeper problems',
    result: `
## Surface Symptoms
- AI adoption slow despite proven benefits
- Doctors resistant to AI recommendations

## Root Causes
Not specific enough. Needs deeper analysis and concrete examples.

## Assumptions
Some assumptions mentioned but vague.
    `,
    artifacts: [],
    createdAt: Date.now(),
  },
  {
    id: 'test-stage-3',
    journeyId: 'test-journey',
    type: 'building',
    status: 'complete',
    prompt: 'Create artifacts',
    result: `
# AI Healthcare Implementation Guide

## Overview
This guide helps hospitals adopt AI systems.

## Steps
1. Assess current infrastructure
2. Select AI vendors
3. Train staff
4. Deploy systems
5. Monitor performance

## Code Example
\`\`\`python
import ai_healthcare

model = ai_healthcare.DiagnosticModel()
model.load('chest_xray_v2')
result = model.predict(patient_image)
print(f"Diagnosis: {result.diagnosis}, Confidence: {result.confidence}")
\`\`\`

## Metadata
- Created: 2025-01-15
- Target Audience: Hospital IT directors, CTOs
- Usage: Reference guide for AI adoption process

This is a complete implementation guide with code examples, clear structure,
and actionable steps that can be followed immediately.
    `,
    artifacts: [],
    createdAt: Date.now(),
  },
];

async function runTests() {
  console.log('🧪 Testing Quality Scoring Service\n');
  console.log('=' .repeat(70));

  try {
    // Test 1: Evaluate high-quality discovering stage
    console.log('\n📝 TEST 1: High-Quality DISCOVERING Stage');
    console.log('-'.repeat(70));
    const report1 = await qualityScoringService.evaluateStageQuality(mockStages[0]);
    console.log(`✅ Overall Score: ${report1.overallScore}/10`);
    console.log(`   Dimensions:`);
    console.log(`   - Completeness: ${report1.scores.completeness}/10`);
    console.log(`   - Depth: ${report1.scores.depth}/10`);
    console.log(`   - Specificity: ${report1.scores.specificity}/10`);
    console.log(`   - Actionability: ${report1.scores.actionability}/10`);
    console.log(`   - Coherence: ${report1.scores.coherence}/10`);
    console.log(`   - Novelty: ${report1.scores.novelty}/10`);
    console.log(`   Strengths: ${report1.strengths.join(', ')}`);
    console.log(`   Should Revise: ${report1.shouldRevise ? 'Yes' : 'No'}`);

    // Test 2: Evaluate low-quality chasing stage
    console.log('\n📝 TEST 2: Low-Quality CHASING Stage');
    console.log('-'.repeat(70));
    const report2 = await qualityScoringService.evaluateStageQuality(mockStages[1]);
    console.log(`✅ Overall Score: ${report2.overallScore}/10`);
    console.log(`   Dimensions:`);
    console.log(`   - Completeness: ${report2.scores.completeness}/10`);
    console.log(`   - Depth: ${report2.scores.depth}/10`);
    console.log(`   - Specificity: ${report2.scores.specificity}/10`);
    console.log(`   Weaknesses: ${report2.weaknesses.join(', ')}`);
    console.log(`   Should Revise: ${report2.shouldRevise ? 'Yes ⚠️' : 'No'}`);
    if (report2.revisionSuggestions.length > 0) {
      console.log(`   Revision Suggestions:`);
      report2.revisionSuggestions.forEach(s => console.log(`      - ${s}`));
    }

    // Test 3: Evaluate building stage with artifacts
    console.log('\n📝 TEST 3: BUILDING Stage with Artifacts');
    console.log('-'.repeat(70));
    const report3 = await qualityScoringService.evaluateStageQuality(mockStages[2]);
    console.log(`✅ Overall Score: ${report3.overallScore}/10`);
    console.log(`   Actionability: ${report3.scores.actionability}/10`);
    console.log(`   Coherence: ${report3.scores.coherence}/10`);
    console.log(`   Should Revise: ${report3.shouldRevise ? 'Yes' : 'No'}`);

    // Test 4: Batch evaluation
    console.log('\n📝 TEST 4: Batch Evaluation');
    console.log('-'.repeat(70));
    const batchReports = await qualityScoringService.evaluateMultipleStages(mockStages);
    console.log(`✅ Evaluated ${batchReports.length} stages`);

    const stats = qualityScoringService.getQualityStatistics(batchReports);
    console.log(`   Average Score: ${stats.average}/10`);
    console.log(`   Score Range: ${stats.min} - ${stats.max}`);
    console.log(`   Stages Needing Revision: ${stats.needsRevision}/${stats.totalStages}`);
    console.log(`   Dimension Averages:`);
    console.log(`   - Completeness: ${stats.scoresByDimension.completeness.toFixed(1)}`);
    console.log(`   - Depth: ${stats.scoresByDimension.depth.toFixed(1)}`);
    console.log(`   - Specificity: ${stats.scoresByDimension.specificity.toFixed(1)}`);
    console.log(`   - Actionability: ${stats.scoresByDimension.actionability.toFixed(1)}`);
    console.log(`   - Coherence: ${stats.scoresByDimension.coherence.toFixed(1)}`);
    console.log(`   - Novelty: ${stats.scoresByDimension.novelty.toFixed(1)}`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ All tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
