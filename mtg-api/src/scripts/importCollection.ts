import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from "@prisma/adapter-pg";


const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const list = `1 Linden, the Steadfast Queen (ELD) 20
1 Aetherflux Reservoir (PLST) KLD-192
1 Ajani's Pridemate (M11) 3
1 Angelic Accord (M14) 3
1 Arcane Signet (FIC) 334
1 Archangel of Thune (2XM) 5
1 Auriok Champion (IMA) 9
1 Austere Command (LCC) 126
1 Benalish Marshal (GNT) 8
1 Bishop of Wings (PLST) M20-8
1 Bygone Bishop (SOI) 8
1 Castle Ardenvale (WOC) 154
1 Cathars' Crusade (MB2) 6
1 Celestial Mantle (ZEN) 6
1 Cleric Class (AFR) 6
1 Crested Sunmare (HOU) 6
1 Dawn of Hope (J22) 169
1 Dictate of Heliod (C15) 68
1 Divine Visitation (TDC) 113
1 Emeria, the Sky Ruin (SOC) 368
1 Endless Atlas (2XM) 251
1 Esper Sentinel (MH2) 12
1 Felidar Sovereign (PLST) BFZ-26
1 Fumigate (PKLD) 15p
1 Generous Gift (MH1) 11
1 Glorious Anthem (M21) 21
1 Honor of the Pure (M12) 23
1 Idol of Oblivion (SCD) 268
1 Impassioned Orator (RNA) 12
1 Intangible Virtue (CNS) 72
1 Kabira Crossroads (ZEN) 216
1 Kor Celebrant (ZNR) 22
1 Luminarch Ascension (A25) 23
1 Lunarch Veteran / Luminous Phantom (MID) 27
1 Mangara, the Diplomat (SOC) 155
1 Marble Diamond (CMR) 323
1 Martial Coup (C14) 78
1 Mentor of the Meek (J25) 99
1 Midnight Haunting (C14) 80
1 Mind Stone (PLST) C18-210
1 Mistveil Plains (SOC) 386
1 Oketra's Monument (AKH) 233
1 Path to Exile (PLST) E02-3
1 Pearl Medallion (CMM) 401
32 Plains (J25) 81
1 Planar Cleansing (M14) 29
1 Raise the Alarm (M20) 34
1 Righteous Valkyrie (J22) 234
1 Secluded Steppe (CM2) 266
1 Skullclamp (PLST) C20-251
1 Slate of Ancestry (SCD) 275
1 Sol Ring (CLB) 871
1 Soul Warden (PLST) MM3-24
1 Soul's Attendant (PLST) ROE-44
1 Spectral Procession (MD1) 12
1 Staunch Shieldmate (M21) 39
1 Storm Herd (C19) 75
1 Sun Titan (CM2) 37
1 Sunbond (BNG) 28
1 Suture Priest (NPH) 25
1 Swords to Plowshares (M3C) 173
1 Thraben Inspector (CMM) 66
1 Timely Reinforcements (M12) 40
1 Tocasia's Welcome (SOC) 181
1 Vanquisher's Banner (PLST) XLN-251
1 Wayfarer's Bauble (5DN) 165
1 Weathered Wayfarer (LTC) 183
1 Welcoming Vampire (VOW) 46
1 Well of Lost Dreams (BRR) 62`;

type Result = {
  name: string;
  quantity: number;
  status: 'imported' | 'not_found' | 'fallback';
  note?: string;
};

function parseLine(line: string) {
  // Format: {qty} {name} ({setCode}) {number}
  // number may be like "27", "KLD-192", "15p" etc.
  const match = line.match(/^(\d+)\s+(.+?)\s+\(([^)]+)\)\s+(.+)$/);
  if (!match) return null;
  return {
    quantity: parseInt(match[1]),
    name: match[2].trim(),
    setCode: match[3].trim().toUpperCase(),
    number: match[4].trim(),
  };
}

async function importCollection() {
  // Clear existing collection first
  await prisma.collection.deleteMany();
  console.log('Cleared existing collection\n');

  const lines = list.trim().split('\n');
  const results: Result[] = [];

  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) {
      console.warn(`Skipping malformed line: ${line}`);
      continue;
    }

    const { quantity, name, setCode, number } = parsed;

    // Strip set prefix from number if present (e.g. "KLD-192" -> "192", "BFZ-26" -> "26")
    const normalizedNumber = number.replace(/^[A-Z0-9]+-/, '');

    // Try exact match: setCode + collector number
    let card = await prisma.cards.findFirst({
      where: {
        setCode: { equals: setCode, mode: 'insensitive' },
        number: normalizedNumber,
      },
    });

    if (card) {
      await prisma.collection.create({
        data: { cardUuid: card.uuid, quantity, foil: false },
      });
      results.push({ name, quantity, status: 'imported' });
      continue;
    }

    // Fallback: match by name + setCode only
    card = await prisma.cards.findFirst({
      where: {
        setCode: { equals: setCode, mode: 'insensitive' },
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (card) {
      await prisma.collection.create({
        data: { cardUuid: card.uuid, quantity, foil: false },
      });
      results.push({
        name,
        quantity,
        status: 'fallback',
        note: `number "${number}" not found, matched by name in ${setCode}`,
      });
      continue;
    }

    results.push({
      name,
      quantity,
      status: 'not_found',
      note: `${setCode} #${number}`,
    });
  }

  // Summary
  console.log('=== Import Results ===');
  const imported = results.filter(r => r.status === 'imported');
  const fallback = results.filter(r => r.status === 'fallback');
  const notFound = results.filter(r => r.status === 'not_found');

  console.log(`✅ Exact match:    ${imported.length}`);
  console.log(`⚠️  Name fallback:  ${fallback.length}`);
  fallback.forEach(r => console.log(`   - ${r.name}: ${r.note}`));
  console.log(`❌ Not found:      ${notFound.length}`);
  notFound.forEach(r => console.log(`   - ${r.name} (${r.note})`));

  await prisma.$disconnect();
}

importCollection().catch(console.error);