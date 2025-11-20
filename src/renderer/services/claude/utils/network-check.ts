/**
 * Network quality detection for page generation
 */

import type { NetworkQuality } from '../types/generation-progress';

export interface NetworkCheckResult {
  quality: NetworkQuality;
  latency: number;
  timestamp: number;
  online: boolean;
}

/**
 * Check network quality by measuring latency to Anthropic API
 */
export async function checkNetworkQuality(): Promise<NetworkCheckResult> {
  const timestamp = Date.now();

  // First check if we're online at all
  if (!navigator.onLine) {
    console.log('❌ Network check: Offline');
    return {
      quality: 'poor',
      latency: -1,
      timestamp,
      online: false
    };
  }

  try {
    const start = Date.now();

    // Make a lightweight request to Anthropic API
    // Note: This will fail with auth error but we only care about connection latency
    await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ test: 'ping' }),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    const latency = Date.now() - start;

    // Classify quality based on latency
    let quality: NetworkQuality;
    if (latency < 500) {
      quality = 'good';
    } else if (latency < 1500) {
      quality = 'fair';
    } else {
      quality = 'poor';
    }

    console.log(`✅ Network quality: ${quality} (${latency}ms)`);

    return {
      quality,
      latency,
      timestamp,
      online: true
    };

  } catch (error) {
    // Even auth errors mean we connected successfully
    const latency = Date.now() - timestamp;

    if (latency < 500) {
      console.log(`✅ Network quality: good (${latency}ms, auth expected)`);
      return {
        quality: 'good',
        latency,
        timestamp,
        online: true
      };
    }

    // Connection failed
    console.error('❌ Network check failed:', error);
    return {
      quality: 'poor',
      latency: -1,
      timestamp,
      online: false
    };
  }
}

/**
 * Wait for network to become available
 */
export async function waitForNetwork(
  maxWaitMs: number = 30000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const result = await checkNetworkQuality();

    if (result.online && result.quality !== 'poor') {
      return true;
    }

    console.log('⏳ Waiting for network... checking again in 5s');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  return false;
}
