#!/usr/bin/env ts-node
/**
 * Wine-Searcher PoC Script
 *
 * Purpose: Test Wine-Searcher HTML structure analysis
 * This script will help us understand the HTML structure before implementing the parser
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Test wine search parameters
const TEST_WINE = {
  winery: 'Opus One',
  region: 'Napa Valley',
  variety: 'Cabernet Sauvignon',
  vintage: 2018,
};

// Construct Wine-Searcher URL
const constructSearchUrl = (wine: typeof TEST_WINE): string => {
  // Wine-Searcher URL format (example):
  // https://www.wine-searcher.com/find/{winery}+{variety}+{vintage}+{region}
  const query = `${wine.winery} ${wine.variety} ${wine.vintage} ${wine.region}`
    .toLowerCase()
    .replace(/\s+/g, '+');
  return `https://www.wine-searcher.com/find/${query}`;
};

async function runPoC() {
  console.log('🍷 Wine-Searcher PoC Starting...\n');

  const url = constructSearchUrl(TEST_WINE);
  console.log('📍 Target URL:', url);
  console.log('🔍 Test Wine:', TEST_WINE);
  console.log('');

  try {
    // Use curl-impersonate to fetch the page
    console.log('⚡ Fetching page with curl-impersonate (chrome116)...');

    const command = `curl_chrome116 -L -s "${url}" --max-time 10`;
    const html = execSync(command, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    console.log('✅ Page fetched successfully');
    console.log('📊 HTML size:', (html.length / 1024).toFixed(2), 'KB');
    console.log('');

    // Save HTML to file for analysis
    const fixtureDir = path.join(__dirname, '../test/fixtures');
    if (!fs.existsSync(fixtureDir)) {
      fs.mkdirSync(fixtureDir, { recursive: true });
    }

    const fixtureFile = path.join(
      fixtureDir,
      `wine-searcher-${Date.now()}.html`,
    );
    fs.writeFileSync(fixtureFile, html, 'utf-8');
    console.log('💾 HTML saved to:', fixtureFile);
    console.log('');

    // Basic HTML structure analysis
    console.log('🔍 Quick HTML Analysis:');
    console.log('─'.repeat(60));

    // Check if it's SSR or CSR
    const hasHydrationScript = html.includes('__NEXT_DATA__') || html.includes('window.__INITIAL_STATE__');
    const hasMainContent = html.includes('wine') || html.includes('rating') || html.includes('price');

    console.log('Page Type:', hasHydrationScript ? '⚠️  Hybrid (SSR + CSR)' : '✅ Pure SSR');
    console.log('Has Wine Content:', hasMainContent ? '✅ Yes' : '❌ No');
    console.log('');

    // Look for key data indicators
    const indicators = {
      'Rating/Score': /rating|score|points?/i.test(html),
      'Price': /price|USD|EUR|\$/i.test(html),
      'Robert Parker': /parker|rp\s*\d+/i.test(html),
      'Vintage': new RegExp(TEST_WINE.vintage.toString()).test(html),
      'Winery': new RegExp(TEST_WINE.winery, 'i').test(html),
    };

    console.log('🎯 Data Indicators Found:');
    Object.entries(indicators).forEach(([key, found]) => {
      console.log(`  ${found ? '✅' : '❌'} ${key}`);
    });
    console.log('');

    // Extract potential CSS selectors (basic heuristic)
    console.log('📋 Potential CSS Selectors to Investigate:');
    const selectorPatterns = [
      { name: 'Wine Name', pattern: /<h1[^>]*>(.*?)<\/h1>/gi },
      { name: 'Rating Score', pattern: /class="[^"]*rating[^"]*"[^>]*>([^<]+)/gi },
      { name: 'Price', pattern: /class="[^"]*price[^"]*"[^>]*>([^<]+)/gi },
    ];

    selectorPatterns.forEach(({ name, pattern }) => {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        console.log(`  🔹 ${name}: Found ${matches.length} potential matches`);
        console.log(`     Sample: ${matches[0].substring(0, 100)}...`);
      } else {
        console.log(`  ⚪ ${name}: No obvious matches`);
      }
    });
    console.log('');

    // Recommendations
    console.log('📝 Next Steps:');
    console.log('─'.repeat(60));
    console.log('1. Manually inspect the saved HTML file');
    console.log('2. Use browser DevTools to identify CSS selectors');
    console.log('3. Document selectors in a configuration file');
    console.log('4. Implement CheerioParserAdapter with the identified selectors');
    console.log('');

    console.log('✅ PoC Completed Successfully!');

  } catch (error) {
    console.error('❌ PoC Failed:', error instanceof Error ? error.message : error);

    if (error instanceof Error && error.message.includes('curl_chrome116')) {
      console.log('');
      console.log('⚠️  curl-impersonate not found!');
      console.log('💡 Run this inside the Docker crawler container:');
      console.log('   docker compose --profile development up crawler-dev');
      console.log('   docker exec -it <crawler-container> pnpm run poc');
    }

    process.exit(1);
  }
}

// Run PoC
runPoC().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
