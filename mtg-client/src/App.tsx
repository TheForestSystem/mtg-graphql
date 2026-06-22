import { useState, useEffect } from 'react';
import Login from './pages/Login';
import DeckList from './pages/DeckList';
import DeckView from './pages/DeckView';

export type Page =
  | { name: 'decks' }
  | { name: 'deck'; id: string };

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [page, setPage] = useState<Page>({ name: 'decks' });

  function handleLogin(t: string) {
    localStorage.setItem('token', t);
    setToken(t);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
  }

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>MTG Decks</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          {page.name !== 'decks' && (
            <button onClick={() => setPage({ name: 'decks' })}>← Back</button>
          )}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {page.name === 'decks' && (
        <DeckList onOpenDeck={(id) => setPage({ name: 'deck', id })} />
      )}
      {page.name === 'deck' && (
        <DeckView deckId={page.id} onDeleted={() => setPage({ name: 'decks' })} />
      )}
    </div>
  );
}