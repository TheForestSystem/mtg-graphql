import { useState, useEffect } from 'react';
import { getClient } from '../lib/gql';
import { GET_DECK, ADD_CARD, REMOVE_CARD, SEARCH_CARDS, SET_COMMANDER, UPDATE_QUANTITY } from '../lib/queries';

function getTypeGroup(typeLine: string): string {
  if (!typeLine) return 'Other';
  const t = typeLine.toLowerCase();
  if (t.includes('creature')) return 'Creatures';
  if (t.includes('planeswalker')) return 'Planeswalkers';
  if (t.includes('instant')) return 'Instants';
  if (t.includes('sorcery')) return 'Sorceries';
  if (t.includes('enchantment')) return 'Enchantments';
  if (t.includes('artifact')) return 'Artifacts';
  if (t.includes('land')) return 'Lands';
  return 'Other';
}

const TYPE_ORDER = ['Creatures', 'Planeswalkers', 'Instants', 'Sorceries', 'Enchantments', 'Artifacts', 'Lands', 'Other'];

function groupCards(cards: any[]) {
  const groups: Record<string, any[]> = {};
  for (const entry of cards) {
    const group = getTypeGroup(entry.card?.type ?? '');
    if (!groups[group]) groups[group] = [];
    groups[group].push(entry);
  }
  // sort each group by name
  for (const group of Object.values(groups)) {
    group.sort((a, b) => (a.card?.name ?? '').localeCompare(b.card?.name ?? ''));
  }
  return groups;
}



function canBeCommander(typeLine: string): boolean {
  if (!typeLine) return false;
  const t = typeLine.toLowerCase();
  return (t.includes('legendary') && t.includes('creature')) || t.includes('planeswalker');
}

export default function DeckView({ deckId, onDeleted }: { deckId: string; onDeleted: () => void }) {
  const [deck, setDeck] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [sideboard, setSideboard] = useState(false);
  const [isCommander, setIsCommander] = useState(false);

  async function loadDeck() {
    const data: any = await getClient().request(GET_DECK, { id: deckId });
    setDeck(data.deck);
  }

  useEffect(() => { loadDeck(); }, [deckId]);

  async function handleUpdateQuantity(deckCardId: string, quantity: number) {
    if (quantity < 1) return;
    await getClient().request(UPDATE_QUANTITY, { deckCardId, quantity });
    loadDeck();
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    const data: any = await getClient().request(SEARCH_CARDS, { name: search });
    setResults(data.cards);
  }

  async function handleAdd(cardUuid: string) {
    await getClient().request(ADD_CARD, { deckId, cardUuid, quantity: 1, isSideboard: sideboard, isCommander });
    setResults([]);
    setSearch('');
    setIsCommander(false);
    loadDeck();
  }

  async function handleRemove(deckCardId: string) {
    await getClient().request(REMOVE_CARD, { deckCardId });
    loadDeck();
  }

  async function handleToggleCommander(deckCardId: string, current: boolean) {
    await getClient().request(SET_COMMANDER, { deckCardId, isCommander: !current });
    loadDeck();
  }

  if (!deck) return <p>Loading...</p>;

  const cards = deck.cards ?? [];

  const commander = cards.find((c: any) => c.isCommander);
  const mainboard = cards.filter((c: any) => !c.isSideboard && !c.isCommander);
  const sideboardCards = cards.filter((c: any) => c.isSideboard);
  const sideboardTotal = sideboardCards.reduce(
    (sum: number, c: any) => sum + c.quantity,
    0
  );

  const mainTotal = mainboard.reduce((sum: number, c: any) => sum + c.quantity, 0) + (commander ? commander.quantity : 0);
  const grouped = groupCards(mainboard);

  return (
    <div>
      {/* Header */}
      <h2 style={{ marginBottom: 4 }}>
        {deck.name}
        <span style={{ marginLeft: 12, fontSize: 14, color: '#666', fontWeight: 'normal' }}>{deck.format}</span>
      </h2>
      <p style={{ color: '#666', marginTop: 0 }}>
        {mainTotal} cards · {sideboardTotal} sideboard
        {commander && (
          <span style={{ marginLeft: 12, color: '#b8860b' }}>
            ⭐ {commander.card?.name}
          </span>
        )}
      </p>

      {/* Add card */}
      <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ccc', borderRadius: 6 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            placeholder="Search cards to add..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={sideboard} onChange={e => setSideboard(e.target.checked)} />
            Sideboard
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={isCommander} onChange={e => setIsCommander(e.target.checked)} />
            Commander
          </label>
          <button type="submit">Search</button>
        </form>
        {results.map(card => (
          <div key={card.uuid} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ flex: 1 }}>
              {card.name}
              <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>{card.manaCost} · {card.setCode}</span>
            </span>
            <button onClick={() => handleAdd(card.uuid)}>+ Add</button>
          </div>
        ))}
      </div>

      {/* Commander */}
      {commander && (
        <>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: 4 }}>Commander</h3>
          <CardTable
            cards={[commander]}
            onRemove={handleRemove}
            onToggleCommander={handleToggleCommander}
            onUpdateQuantity={handleUpdateQuantity}
          />
        </>
      )}

      {/* Mainboard grouped */}
      {TYPE_ORDER.filter(g => grouped[g]).map(group => (
        <div key={group}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: 4 }}>
            {group}
            <span style={{ fontSize: 13, fontWeight: 'normal', color: '#666', marginLeft: 8 }}>
              ({grouped[group].reduce((s: number, c: any) => s + c.quantity, 0)})
            </span>
          </h3>
          <CardTable
            cards={grouped[group]}
            onRemove={handleRemove}
            onToggleCommander={handleToggleCommander}
            onUpdateQuantity={handleUpdateQuantity}
          />
        </div>
      ))}

      {/* Sideboard */}
      {sideboardCards.length > 0 && (
        <>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: 4 }}>
            Sideboard
            <span style={{ fontSize: 13, fontWeight: 'normal', color: '#666', marginLeft: 8 }}>
              ({sideboardCards.length})
            </span>
          </h3>
          <CardTable
            cards={sideboardCards}
            onRemove={handleRemove}
            onToggleCommander={handleToggleCommander}
            onUpdateQuantity={handleUpdateQuantity}
          />
        </>
      )}
    </div>
  );
}

function CardTable({
  cards = [],
  onRemove,
  onToggleCommander,
  onUpdateQuantity,
}: {
  cards?: any[];
  onRemove: (id: string) => void;
  onToggleCommander: (id: string, current: boolean) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
}) {
  const [hovered, setHovered] = useState<{ imageUrl: string; x: number; y: number } | null>(null);

  return (
    <>
      {hovered && (
        <div style={{
          position: 'fixed',
          top: hovered.y,
          left: hovered.x,
          zIndex: 1000,
          pointerEvents: 'none',
        }}>
          <img
            src={hovered.imageUrl}
            alt="card preview"
            style={{ width: 220, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
          />
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th style={{ padding: '4px 8px', width: 100 }}>Qty</th>
            <th style={{ padding: '4px 8px' }}>Name</th>
            <th style={{ padding: '4px 8px' }}>Cost</th>
            <th style={{ padding: '4px 8px' }}>Set</th>
            <th style={{ padding: '4px 8px', width: 80 }}>Cmdr</th>
            <th style={{ padding: '4px 8px', width: 80 }}></th>
          </tr>
        </thead>
        <tbody>
          {cards.map((entry: any) => (
            <tr key={entry.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '4px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => onUpdateQuantity(entry.id, entry.quantity - 1)}
                    disabled={entry.quantity <= 1}
                    style={{ width: 22, height: 22, padding: 0, lineHeight: 1, cursor: entry.quantity <= 1 ? 'not-allowed' : 'pointer' }}
                  >−</button>
                  <span style={{ minWidth: 16, textAlign: 'center' }}>{entry.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(entry.id, entry.quantity + 1)}
                    style={{ width: 22, height: 22, padding: 0, lineHeight: 1 }}
                  >+</button>
                </div>
              </td>
              <td style={{ padding: '4px 8px' }}>
                <span
                  style={{ cursor: 'default', textDecoration: entry.card?.imageUrl ? 'underline dotted' : 'none' }}
                  onMouseEnter={(e) => {
                    if (!entry.card?.imageUrl) return;
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    setHovered({
                      imageUrl: entry.card.imageUrl,
                      x: rect.right + 8,
                      y: Math.min(rect.top, window.innerHeight - 320),
                    });
                  }}
                  onMouseLeave={() => setHovered(null)}
                >
                  {entry.card?.name}
                </span>
              </td>
              <td style={{ padding: '4px 8px', fontFamily: 'monospace', fontSize: 12 }}>{entry.card?.manaCost}</td>
              <td style={{ padding: '4px 8px', fontSize: 12 }}>{entry.card?.setCode}</td>
              <td style={{ padding: '4px 8px' }}>
                {canBeCommander(entry.card?.type ?? '') && (
                  <input
                    type="checkbox"
                    checked={entry.isCommander}
                    onChange={() => onToggleCommander(entry.id, entry.isCommander)}
                    title="Mark as commander"
                  />
                )}
              </td>
              <td style={{ padding: '4px 8px' }}>
                <button onClick={() => onRemove(entry.id)} style={{ color: 'red' }}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}