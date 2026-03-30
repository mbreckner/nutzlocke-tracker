/**
 * Fetches all Pokémon data (Gen 1–9, IDs 1–1025) from PokéAPI
 * and writes the result to src/data/pokemon.json.
 *
 * Run once with: node scripts/fetch-pokemon-data.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProxyAgent } from 'undici';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'pokemon.json');

const TOTAL_POKEMON = 1025;
const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 300;

// Use corporate proxy if available, otherwise direct
const PROXY_URL = process.env.HTTPS_PROXY || process.env.https_proxy || 'http://proxy-bvcol.admin.ch:8080';
let dispatcher;
try {
  dispatcher = new ProxyAgent(PROXY_URL);
} catch {
  dispatcher = undefined;
}

const TYPE_DE = {
  normal: 'Normal',
  fire: 'Feuer',
  water: 'Wasser',
  electric: 'Elektro',
  grass: 'Pflanze',
  ice: 'Eis',
  fighting: 'Kampf',
  poison: 'Gift',
  ground: 'Boden',
  flying: 'Flug',
  psychic: 'Psycho',
  bug: 'Käfer',
  rock: 'Gestein',
  ghost: 'Geist',
  dragon: 'Drache',
  dark: 'Unlicht',
  steel: 'Stahl',
  fairy: 'Fee',
  stellar: 'Stellar',
};

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const opts = dispatcher ? { dispatcher } : {};
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function fetchPokemon(id) {
  const [pokemon, species] = await Promise.all([
    fetchWithRetry(`https://pokeapi.co/api/v2/pokemon/${id}`),
    fetchWithRetry(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
  ]);

  const name_de =
    species.names.find((n) => n.language.name === 'de')?.name ??
    species.names.find((n) => n.language.name === 'en')?.name ??
    pokemon.name;

  const name_en =
    species.names.find((n) => n.language.name === 'en')?.name ?? pokemon.name;

  const generationUrl = species.generation.url;
  const generation = parseInt(generationUrl.split('/').filter(Boolean).pop(), 10);

  const types = pokemon.types
    .sort((a, b) => a.slot - b.slot)
    .map((t) => TYPE_DE[t.type.name] ?? t.type.name);

  const bst = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);

  const paddedId = String(id).padStart(3, '0');
  const bisafans_url = `https://www.bisafans.de/pokedex/${paddedId}/`;

  return { id, name_de, name_en, generation, types, bst, bisafans_url };
}

async function main() {
  console.log(`Fetching ${TOTAL_POKEMON} Pokémon from PokéAPI…`);
  const results = [];

  for (let start = 1; start <= TOTAL_POKEMON; start += BATCH_SIZE) {
    const ids = Array.from(
      { length: Math.min(BATCH_SIZE, TOTAL_POKEMON - start + 1) },
      (_, i) => start + i,
    );
    process.stdout.write(`  #${ids[0]}–#${ids[ids.length - 1]}… `);

    const batch = await Promise.all(
      ids.map((id) =>
        fetchPokemon(id).catch((err) => {
          console.error(`\n  ⚠ Failed #${id}: ${err.message}`);
          return null;
        }),
      ),
    );

    const valid = batch.filter(Boolean);
    results.push(...valid);
    console.log(`✓ (${valid.length}/${ids.length})`);

    if (start + BATCH_SIZE <= TOTAL_POKEMON) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  results.sort((a, b) => a.id - b.id);
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n✅ Saved ${results.length} Pokémon to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
