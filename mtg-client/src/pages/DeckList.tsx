import { useState, useEffect } from 'react';
import { getClient } from '../lib/gql';
import { GET_DECKS, CREATE_DECK } from '../lib/queries';

export default function DeckList({ onOpenDeck }: { onOpenDeck: (id: string) => void }) {
  const [decks, setDecks] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newFormat, setNewFormat] = useState('commander');

  async function loadDecks() {
    const data: any = await getClient().request(GET_DECKS);
    setDecks(data.decks);
  }

  useEffect(() => { loadDecks(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await getClient().request(CREATE_DECK, { name: newName, format: newFormat });
    setNewName('');
    loadDecks();
  }

  return (
    <div>
      <h2>My Decks</h2>
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          placeholder="Deck name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={newFormat} onChange={e => setNewFormat(e.target.value)}>
          <option value="commander">Commander</option>
          <option value="standard">Standard</option>
          <option value="modern">Modern</option>
          <option value="legacy">Legacy</option>
          <option value="pioneer">Pioneer</option>
        </select>
        <button type="submit">Create</button>
      </form>

      {decks.length === 0 && <p>No decks yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {decks.map(deck => (
          <div
            key={deck.id}
            onClick={() => onOpenDeck(deck.id)}
            style={{ padding: 16, border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}
          >
            <strong>{deck.name}</strong>
            <span style={{ marginLeft: 12, color: '#666', fontSize: 14 }}>{deck.format}</span>
            <span style={{ marginLeft: 12, color: '#999', fontSize: 12 }}>
              {new Date(deck.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}