/**
 * Quick test for Artifact Validation Service
 * This tests the rich artifact extraction and validation
 */

import { artifactValidationService } from '../src/renderer/lib/engine/services/ArtifactValidationService';

const testBuildingContent = `
# API Implementation Summary

I've created a complete REST API implementation with authentication.

**ARTIFACT 1: Authentication Service**

\`\`\`typescript
import express from 'express';
import jwt from 'jsonwebtoken';

export class AuthService {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  async generateToken(userId: string): Promise<string> {
    return jwt.sign({ userId }, this.secret, { expiresIn: '24h' });
  }

  async verifyToken(token: string): Promise<{ userId: string }> {
    try {
      const payload = jwt.verify(token, this.secret) as { userId: string };
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
\`\`\`

**ARTIFACT 2: API Documentation**

# REST API Documentation

## Authentication Endpoints

### POST /auth/login
Login with username and password.

**Request:**
\`\`\`json
{
  "username": "user@example.com",
  "password": "secret"
}
\`\`\`

**Response:**
\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
\`\`\`

### GET /auth/verify
Verify authentication token.

**Headers:**
\`\`\`
Authorization: Bearer <token>
\`\`\`

**ARTIFACT 3: Comparison Table**

| Feature | Implementation | Status |
|---------|----------------|--------|
| JWT Auth | jsonwebtoken | Complete |
| Password Hash | bcrypt | Complete |
| Rate Limiting | express-rate-limit | Partial |
| API Docs | Swagger | Skeleton |

**Usage Notes:**
- The authentication service is production-ready
- Remember to set JWT_SECRET environment variable
- Rate limiting needs configuration tuning
`;

async function runTest() {
  console.log('🧪 Testing Artifact Validation Service\n');

  try {
    const artifacts = await artifactValidationService.extractArtifacts(
      testBuildingContent,
      1,
      'building'
    );

    console.log(`✅ Extracted ${artifacts.length} artifacts:\n`);

    artifacts.forEach((artifact, i) => {
      console.log(`Artifact ${i + 1}:`);
      console.log(`  Type: ${artifact.type}`);
      console.log(`  Title: ${artifact.title}`);
      console.log(`  Completeness: ${artifact.validation.completeness}`);
      console.log(`  Quality Score: ${artifact.validation.qualityScore}/10`);
      console.log(`  Syntax Valid: ${artifact.validation.syntaxValid}`);
      console.log(`  Language: ${artifact.metadata.language || 'N/A'}`);
      console.log(`  Size: ${artifact.metadata.size} bytes`);
      console.log(`  Errors: ${artifact.validation.errors?.length || 0}`);
      console.log(`  Warnings: ${artifact.validation.warnings?.length || 0}`);
      console.log('');
    });

    // Validate we got expected artifact types
    const types = artifacts.map(a => a.type);
    console.log('📊 Artifact type distribution:', {
      code: types.filter(t => t === 'code').length,
      markdown: types.filter(t => t === 'markdown').length,
      table: types.filter(t => t === 'table').length,
    });

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runTest().catch(console.error);
}

export { runTest };
