import 'dotenv/config';

const API_URL = 'http://localhost:4000/';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMGI0NTI1Mi1hYmI2LTRhYzQtYTA1NC00ZGM5NWJhNzEyM2UiLCJ1c2VybmFtZSI6ImZveHgiLCJpYXQiOjE3ODIxMDU2NDQsImV4cCI6MTc4MjcxMDQ0NH0.sZxANJ284f54BGWOD7FOOudnDJ3npekaImplxdWnpEA';
const DECK_NAME = 'Cats and Dogs';
const DECK_FORMAT = 'commander';

const list = `
1 Giada, Font of Hope (FDN) 141
1 Ajani's Pridemate (FDN) 293
1 Akroma, Vision of Ixidor (CMR) 2
1 Angelic Accord (M14) 3
1 Arcane Signet (SLD) 2464
1 Archangel of Thune (IMA) 8
1 Archangel of Tithes (POTJ) 2p
1 Austere Command (MKC) 56
1 Benalish Marshal (DOM) 6
1 Bishop of Wings (PLST) M20-8
1 Breathkeeper Seraph (VOC) 31
1 Cathars' Crusade (MB2) 6
1 Celestial Mantle (ZEN) 6
1 Cleric Class (AFR) 6
1 Dawn of Hope (WOT) 2
1 Dictate of Heliod (SCD) 19
1 Dolmen Gate (PLST) LRW-256
1 Esper Sentinel (MH2) 328
1 Farewell (FIC) 242
1 Felidar Sovereign (J25) 198
1 Fumigate (MKC) 66
1 Generous Gift (LCC) 128
1 Glorious Anthem (M21) 21
1 Herald of War (J25) 207
1 Honor of the Pure (M12) 23
1 Idol of Oblivion (SCD) 268
1 Intangible Virtue (CMM) 31
1 Kor Celebrant (PLST) ZNR-22
1 Linvala, Keeper of Silence (MM3) 13
1 Linvala, the Preserver (OGW) 25
1 Luminarch Ascension (ZEN) 25
1 Lunarch Veteran / Luminous Phantom (MID) 27
1 Lyra Dawnbringer (FDN) 738
1 Marble Diamond (KHC) 100
1 Martial Coup (MSC) 138
1 Midnight Haunting (ONC) 82
1 Mind Stone (BLC) 280
1 Ojer Taq, Deepest Foundation / Temple of Civilization (LCI) 314
1 Oketra's Monument (AKH) 233
1 Parhelion II (WAR) 24
1 Path to Exile (FIC) 248
1 Pearl Medallion (CMM) 401
35 Plains (J25) 81
1 Planar Cleansing (M13) 26
1 Platinum Angel (CN2) 214
1 Radiant, Archangel (ULG) 20
1 Resplendent Angel (LCI) 334
1 Restoration Seminar (SOS) 30
1 Reya Dawnbringer (10E) 35
1 Righteous Valkyrie (J22) 234
1 Rosa, Resolute White Mage (FIN) 555
1 Sigarda's Summons (VOW) 404 *F*
1 Sol Ring (SOC) 128
1 Soul Warden (HOP) 7
1 Soul's Attendant (PLST) ROE-44
1 Spectral Procession (PLST) SHM-23
1 Starnheim Aspirant (PLST) KHM-380
1 Sun Titan (SOC) 178
1 Sunbond (BNG) 28
1 Swords to Plowshares (SOC) 179
1 Timely Reinforcements (M12) 40
1 Tocasia's Welcome (SOC) 181
1 Vanquisher's Banner (LCC) 316
1 Wayfarer's Bauble (TDC) 335
1 Weathered Wayfarer (LTC) 183
1 Well of Lost Dreams (BRR) 62
`;

type Result = {
  name: string;
  quantity: number;
  status: 'imported' | 'not_found' | 'fallback' | 'name_only';
  note?: string;
};

async function gql(query: string, variables?: Record<string, any>) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

function parseLine(line: string) {
  const match = line.match(/^(\d+)\s+(.+?)\s+\(([^)]+)\)\s+(.+)$/);
  if (!match) return null;
  return {
    quantity: parseInt(match[1]),
    name: match[2].trim(),
    setCode: match[3].trim().toUpperCase(),
    number: match[4].trim(),
  };
}

function normalizeNumber(number: string): string {
  return number
    .replace(/^[A-Z0-9]+-/, '')  // strip PLST-style prefixes e.g. C18-65 → 65
    .replace(/\s*\*F\*/gi, '')    // strip foil marker *F*
    .replace(/[sp]$/i, '')        // strip trailing s or p (promo/special suffixes)
    .trim();
}

async function addCardToDeck(deckId: string, cardUuid: string, quantity: number) {
  await gql(`
    mutation AddCard($deckId: String!, $cardUuid: String!, $quantity: Int) {
      addCardToDeck(deckId: $deckId, cardUuid: $cardUuid, quantity: $quantity) {
        id
      }
    }
  `, { deckId, cardUuid, quantity });
}

async function importDeck() {
  const lines = list.trim().split('\n');
  const results: Result[] = [];

  // Create deck
  const { createDeck: deck } = await gql(`
    mutation CreateDeck($name: String!, $format: String) {
      createDeck(name: $name, format: $format) {
        id
        name
      }
    }
  `, { name: DECK_NAME, format: DECK_FORMAT });
  console.log(`Created deck: ${deck.name} (${deck.id})\n`);

  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) {
      console.warn(`Skipping malformed line: ${line}`);
      continue;
    }

    const { quantity, name, setCode, number } = parsed;
    const normalizedNumber = normalizeNumber(number);

    // Fetch all cards in the set
    const { cards } = await gql(`
      query FindCard($setCode: String) {
        cards(filter: { setCode: $setCode }, limit: 500) {
          uuid
          name
          number
        }
      }
    `, { setCode });

    // 1. Exact match: setCode + normalized number
    let card = cards.find((c: any) => c.number === normalizedNumber);
    if (card) {
      await addCardToDeck(deck.id, card.uuid, quantity);
      results.push({ name, quantity, status: 'imported' });
      continue;
    }

    // 2. Fallback: name match within same set
    card = cards.find((c: any) => c.name.toLowerCase() === name.toLowerCase());
    if (card) {
      await addCardToDeck(deck.id, card.uuid, quantity);
      results.push({ name, quantity, status: 'fallback', note: `number "${number}" not found, matched by name in ${setCode}` });
      continue;
    }

    // 3. Last resort: search by name across all sets
    const { cards: anyCards } = await gql(`
      query FindCardByName($name: String) {
        cards(filter: { name: $name }, limit: 1) {
          uuid
          name
          setCode
          number
        }
      }
    `, { name });

    if (anyCards.length > 0) {
      card = anyCards[0];
      await addCardToDeck(deck.id, card.uuid, quantity);
      results.push({ name, quantity, status: 'name_only', note: `set ${setCode} not found, used ${card.setCode} #${card.number}` });
      continue;
    }

    results.push({ name, quantity, status: 'not_found', note: `${setCode} #${number}` });
  }

  // Summary
  console.log('=== Import Results ===');
  const imported = results.filter(r => r.status === 'imported');
  const fallback = results.filter(r => r.status === 'fallback');
  const nameOnly = results.filter(r => r.status === 'name_only');
  const notFound = results.filter(r => r.status === 'not_found');

  console.log(`✅ Exact match:   ${imported.length}`);
  console.log(`⚠️  Name fallback: ${fallback.length}`);
  fallback.forEach(r => console.log(`   - ${r.name}: ${r.note}`));
  console.log(`🔍 Name only:     ${nameOnly.length}`);
  nameOnly.forEach(r => console.log(`   - ${r.name}: ${r.note}`));
  console.log(`❌ Not found:     ${notFound.length}`);
  notFound.forEach(r => console.log(`   - ${r.name} (${r.note})`));

  const total = results.reduce((sum, r) => sum + r.quantity, 0);
  console.log(`\nTotal cards: ${total}`);
  console.log(`Deck ID: ${deck.id}`);
}

importDeck().catch(console.error);