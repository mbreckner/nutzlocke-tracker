import { useState, useEffect, useCallback } from 'react';
import type { Pokemon, PokemonEntry, Game, PokemonStatus, SortField, SortDir } from '../types/tracker';
import { STATUS_LABELS, STATUS_COLORS, TYPE_COLORS, GENERATIONS } from '../utils/constants';
import pokemonData from '../data/pokemon.json';

// ── KV API helpers ────────────────────────────────────────────────────────────

async function fetchStatuses(): Promise<Record<number, { status: PokemonStatus; game_id?: string }>> {
  const res = await fetch('/api/statuses');
  if (!res.ok) throw new Error(`Failed to load statuses: ${res.status}`);
  return res.json();
}
async function persistStatuses(s: Record<number, { status: PokemonStatus; game_id?: string }>) {
  const res = await fetch('/api/statuses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(s),
  });
  if (!res.ok) throw new Error(`Failed to save statuses: ${res.status}`);
}
async function fetchGames(): Promise<Game[]> {
  const res = await fetch('/api/games');
  if (!res.ok) throw new Error(`Failed to load games: ${res.status}`);
  return res.json();
}
async function persistGames(g: Game[]) {
  const res = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(g),
  });
  if (!res.ok) throw new Error(`Failed to save games: ${res.status}`);
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PokemonStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const cls = TYPE_COLORS[type] ?? 'bg-gray-500 text-white';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{type}</span>;
}

// ── Status change modal ───────────────────────────────────────────────────────

interface StatusModalProps {
  pokemon: PokemonEntry;
  games: Game[];
  onSave: (id: number, status: PokemonStatus, gameId?: string) => void;
  onClose: () => void;
}

function StatusModal({ pokemon, games, onSave, onClose }: StatusModalProps) {
  const [status, setStatus] = useState<PokemonStatus>(pokemon.status);
  const [gameId, setGameId] = useState<string>(pokemon.used_in_game ?? '');

  const handleSave = () => {
    if (status === 'USED' && !gameId) { alert('Bitte ein Spiel auswählen.'); return; }
    onSave(pokemon.id, status, status === 'USED' ? gameId : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-800 border border-gray-600 rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-1">Status ändern</h2>
        <p className="text-gray-400 text-sm mb-4">
          #{String(pokemon.id).padStart(3, '0')} {pokemon.name_de} / {pokemon.name_en}
        </p>

        <div className="space-y-2 mb-4">
          {(['OPEN', 'USED', 'USED_AND_WILL_BE_OPENED_LATER'] as PokemonStatus[]).map((s) => (
            <label key={s} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={() => setStatus(s)}
                className="accent-red-500"
              />
              <StatusBadge status={s} />
            </label>
          ))}
        </div>

        {status === 'USED' && (
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1">Verwendet in Spiel</label>
            <select
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">– Spiel wählen –</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>Gen {g.generation} – {g.name}{!g.vanilla ? ' ✦' : ''}
                </option>
              ))}
            </select>
            {games.length === 0 && (
              <p className="text-amber-400 text-xs mt-1">⚠ Noch keine Spiele gespeichert. Bitte zuerst ein Spiel im Tab „Spiele" anlegen.</p>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-sm transition">
            Abbrechen
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add / Edit game modal ─────────────────────────────────────────────────────

interface GameModalProps {
  existing?: Game;
  onSave: (game: Game) => void;
  onClose: () => void;
}

function GameModal({ existing, onSave, onClose }: GameModalProps) {
  const [name, setName] = useState(existing?.name ?? '');
  const [generation, setGeneration] = useState<number>(existing?.generation ?? 1);
  const [vanilla, setVanilla] = useState(existing?.vanilla ?? true);
  const [attempts, setAttempts] = useState(existing?.attempts ?? 1);
  const [specialRules, setSpecialRules] = useState(existing?.special_rules ?? '');

  const handleSave = () => {
    if (!name.trim()) { alert('Bitte einen Namen eingeben.'); return; }
    onSave({
      id: existing?.id ?? crypto.randomUUID(),
      name: name.trim(),
      generation,
      vanilla,
      attempts,
      special_rules: specialRules.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-800 border border-gray-600 rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-4">
          {existing ? 'Spiel bearbeiten' : 'Neues Spiel hinzufügen'}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Edition *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Pokémon Gold, Storm Silver …"
              className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-gray-300 mb-1">Generation</label>
              <select
                value={generation}
                onChange={(e) => setGeneration(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {GENERATIONS.map((g) => <option key={g} value={g}>Gen {g}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-300 mb-1">Versuche</label>
              <input
                type="number"
                min={1}
                value={attempts}
                onChange={(e) => setAttempts(Math.max(1, Number(e.target.value)))}
                className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="vanilla"
              checked={vanilla}
              onChange={(e) => setVanilla(e.target.checked)}
              className="accent-red-500 w-4 h-4"
            />
            <label htmlFor="vanilla" className="text-sm text-gray-300 cursor-pointer">Vanilla (unverändertes Spiel)</label>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Besondere Regeln</label>
            <textarea
              value={specialRules}
              onChange={(e) => setSpecialRules(e.target.value)}
              rows={3}
              placeholder="z.B. Dupes Clause, Species Clause …"
              className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-sm transition">
            Abbrechen
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pokémon table ─────────────────────────────────────────────────────────────

interface PokemonTableProps {
  entries: PokemonEntry[];
  games: Game[];
  onChangeStatus: (entry: PokemonEntry) => void;
}

function PokemonTable({ entries, games, onChangeStatus }: PokemonTableProps) {
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'id', dir: 'asc' });

  const gameMap = Object.fromEntries(games.map((g) => [g.id, g]));

  function toggleSort(field: SortField) {
    setSort((prev) =>
      prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' },
    );
  }

  const sorted = [...entries].sort((a, b) => {
    let cmp = 0;
    switch (sort.field) {
      case 'id':         cmp = a.id - b.id; break;
      case 'name_de':    cmp = a.name_de.localeCompare(b.name_de, 'de'); break;
      case 'name_en':    cmp = a.name_en.localeCompare(b.name_en, 'en'); break;
      case 'generation': cmp = a.generation - b.generation; break;
      case 'bst':        cmp = a.bst - b.bst; break;
      case 'status': {
        const order = { OPEN: 0, USED_AND_WILL_BE_OPENED_LATER: 1, USED: 2 };
        cmp = order[a.status] - order[b.status];
        break;
      }
    }
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const Th = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer select-none hover:text-white transition"
      onClick={() => toggleSort(field)}
    >
      {label}
      {sort.field === field ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
    </th>
  );

  if (sorted.length === 0) {
    return <div className="text-center py-20 text-gray-500">Keine Pokémon gefunden.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-800 sticky top-0 z-10">
          <tr>
            <Th field="id" label="#" />
            <Th field="name_de" label="Name (DE)" />
            <Th field="name_en" label="Name (EN)" />
            <Th field="status" label="Status" />
            <Th field="generation" label="Gen" />
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Typen</th>
            <Th field="bst" label="BST" />
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Spiel</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Aktion</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => {
            const usedGame = entry.used_in_game ? gameMap[entry.used_in_game] : undefined;
            return (
              <tr
                key={entry.id}
                className={`border-t border-gray-700 hover:bg-gray-800/60 transition ${
                  i % 2 === 0 ? 'bg-gray-900/40' : 'bg-gray-900/20'
                }`}
              >
                <td className="px-3 py-2 text-gray-500 font-mono">
                  #{String(entry.id).padStart(3, '0')}
                </td>
                <td className="px-3 py-2 font-medium text-white">
                  <a
                    href={entry.bisafans_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-red-400 transition underline underline-offset-2"
                  >
                    {entry.name_de}
                  </a>
                </td>
                <td className="px-3 py-2 text-gray-300">{entry.name_en}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={entry.status} />
                </td>
                <td className="px-3 py-2 text-gray-300 text-center">{entry.generation}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {entry.types.map((t) => <TypeBadge key={t} type={t} />)}
                  </div>
                </td>
                <td className="px-3 py-2 text-gray-300 font-mono">{entry.bst}</td>
                <td className="px-3 py-2 text-gray-400 text-xs">
                  {usedGame ? (
                    <span title={usedGame.special_rules || undefined}>
                      Gen {usedGame.generation} – {usedGame.name}
                      {!usedGame.vanilla && ' ✦'}
                    </span>
                  ) : '–'}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => onChangeStatus(entry)}
                    className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs transition"
                  >
                    ✏ ändern
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Pokémon tab ───────────────────────────────────────────────────────────────

interface PokemonTabProps {
  entries: PokemonEntry[];
  games: Game[];
  onChangeStatus: (id: number, status: PokemonStatus, gameId?: string) => Promise<void>;
}

function PokemonTab({ entries, games, onChangeStatus }: PokemonTabProps) {
  const [search, setSearch] = useState('');
  const [filterGen, setFilterGen] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [modalEntry, setModalEntry] = useState<PokemonEntry | null>(null);

  const filtered = entries.filter((e) => {
    if (
      search &&
      !e.name_de.toLowerCase().includes(search.toLowerCase()) &&
      !e.name_en.toLowerCase().includes(search.toLowerCase())
    ) return false;
    if (filterGen && e.generation !== Number(filterGen)) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    return true;
  });

  const handleSave = (id: number, status: PokemonStatus, gameId?: string) => {
    onChangeStatus(id, status, gameId);
    setModalEntry(null);
  };

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 p-4 bg-gray-800/60 border-b border-gray-700">
        <input
          type="search"
          placeholder="🔍 Name suchen …"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <select
          value={filterGen}
          onChange={(e) => setFilterGen(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Alle Generationen</option>
          {GENERATIONS.map((g) => <option key={g} value={g}>Gen {g}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Alle Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="flex items-center text-gray-400 text-sm">
          {filtered.length} / {entries.length} Pokémon
        </span>
      </div>

      <PokemonTable
        entries={filtered}
        games={games}
        onChangeStatus={(entry) => setModalEntry(entry)}
      />

      {modalEntry && (
        <StatusModal
          pokemon={modalEntry}
          games={games}
          onSave={handleSave}
          onClose={() => setModalEntry(null)}
        />
      )}
    </div>
  );
}

// ── Games tab ─────────────────────────────────────────────────────────────────

interface GamesTabProps {
  games: Game[];
  statuses: Record<number, { status: PokemonStatus; game_id?: string }>;
  onSave: (game: Game) => void;
  onDelete: (id: string) => void;
}

function GamesTab({ games, statuses, onSave, onDelete }: GamesTabProps) {
  const [modal, setModal] = useState<{ open: boolean; game?: Game }>({ open: false });

  const usedCountFor = (id: string) =>
    Object.values(statuses).filter((s) => s.game_id === id).length;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">Meine Runs</h2>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition"
        >
          + Spiel hinzufügen
        </button>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">🎮</p>
          <p>Noch keine Spiele eingetragen.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                {['Edition', 'Gen', 'Vanilla', 'Versuche', 'Verwendete Pokémon', 'Besondere Regeln', 'Aktionen'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {games.map((g, i) => (
                <tr key={g.id} className={`border-t border-gray-700 hover:bg-gray-800/60 transition ${i % 2 === 0 ? 'bg-gray-900/40' : 'bg-gray-900/20'}`}>
                  <td className="px-3 py-3 font-semibold text-white">{g.name}</td>
                  <td className="px-3 py-3 text-gray-300 text-center">{g.generation}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${g.vanilla ? 'bg-green-600 text-white' : 'bg-purple-600 text-white'}`}>
                      {g.vanilla ? 'Ja' : 'Nein'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-300 text-center">{g.attempts}</td>
                  <td className="px-3 py-3 text-gray-300 text-center">{usedCountFor(g.id)}</td>
                  <td className="px-3 py-3 text-gray-400 max-w-xs truncate" title={g.special_rules || undefined}>
                    {g.special_rules || '–'}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal({ open: true, game: g })}
                        className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs transition"
                      >
                        ✏
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Spiel „${g.name}" wirklich löschen?`)) onDelete(g.id);
                        }}
                        className="px-2 py-1 rounded bg-red-900/50 hover:bg-red-700 text-red-300 text-xs transition"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <GameModal
          existing={modal.game}
          onSave={(game) => { onSave(game); setModal({ open: false }); }}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function PokemonTracker() {
  const [tab, setTab] = useState<'pokemon' | 'games'>('pokemon');
  const [statuses, setStatuses] = useState<Record<number, { status: PokemonStatus; game_id?: string }>>({});
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load from KV on mount
  useEffect(() => {
    Promise.all([fetchStatuses(), fetchGames()])
      .then(([s, g]) => { setStatuses(s); setGames(g); })
      .catch((err) => setLoadError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const entries: PokemonEntry[] = (pokemonData as Pokemon[]).map((p) => ({
    ...p,
    status: statuses[p.id]?.status ?? 'OPEN',
    used_in_game: statuses[p.id]?.game_id,
  }));

  const handleChangeStatus = useCallback(
    async (id: number, status: PokemonStatus, gameId?: string) => {
      const next = { ...statuses, [id]: { status, game_id: gameId } };
      setStatuses(next);          // optimistic update
      setSaving(true);
      setSaveError(null);
      try {
        await persistStatuses(next);
      } catch (err) {
        setSaveError(String(err));
      } finally {
        setSaving(false);
      }
    },
    [statuses],
  );

  const handleSaveGame = useCallback(async (game: Game) => {
    const next = games.findIndex((g) => g.id === game.id) >= 0
      ? games.map((g) => g.id === game.id ? game : g)
      : [...games, game];
    setGames(next);
    setSaving(true);
    setSaveError(null);
    try {
      await persistGames(next);
    } catch (err) {
      setSaveError(String(err));
    } finally {
      setSaving(false);
    }
  }, [games]);

  const handleDeleteGame = useCallback(async (id: string) => {
    const nextGames = games.filter((g) => g.id !== id);
    const nextStatuses = Object.fromEntries(
      Object.entries(statuses).map(([k, v]) =>
        v.game_id === id ? [k, { ...v, game_id: undefined }] : [k, v]
      )
    ) as typeof statuses;
    setGames(nextGames);
    setStatuses(nextStatuses);
    setSaving(true);
    setSaveError(null);
    try {
      await Promise.all([persistGames(nextGames), persistStatuses(nextStatuses)]);
    } catch (err) {
      setSaveError(String(err));
    } finally {
      setSaving(false);
    }
  }, [games, statuses]);

  // Summary counts
  const used = entries.filter((e) => e.status === 'USED').length;
  const later = entries.filter((e) => e.status === 'USED_AND_WILL_BE_OPENED_LATER').length;
  const open = entries.filter((e) => e.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⬤</span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Nuzlocke Tracker</h1>
              <p className="text-gray-400 text-xs">Verfolge deine Pokémon über alle Runs hinweg</p>
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-4 text-sm">
            {saving && (
              <span className="flex items-center gap-1.5 text-amber-400 text-xs animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                Speichert…
              </span>
            )}
            {saveError && (
              <span className="text-red-400 text-xs" title={saveError}>⚠ Fehler beim Speichern</span>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              <span className="text-gray-300">{used} Verwendet</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span className="text-gray-300">{later} Später offen</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              <span className="text-gray-300">{open} Offen</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="bg-gray-900 border-b border-gray-700 px-6">
        <div className="max-w-screen-2xl mx-auto flex gap-0">
          {([['pokemon', '🐾 Pokémon'], ['games', '🎮 Spiele']] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition ${
                tab === t
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {label}
              {t === 'games' && games.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-300 text-xs">{games.length}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-screen-2xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-gray-500">
            <div className="w-10 h-10 border-4 border-gray-700 border-t-red-500 rounded-full animate-spin" />
            <p>Lade Daten…</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-red-400">
            <p className="text-4xl">⚠</p>
            <p className="font-semibold">Fehler beim Laden der Daten</p>
            <p className="text-sm text-gray-500">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm transition"
            >
              Neu laden
            </button>
          </div>
        ) : (
          <>
            {tab === 'pokemon' && (
              <PokemonTab entries={entries} games={games} onChangeStatus={handleChangeStatus} />
            )}
            {tab === 'games' && (
              <GamesTab
                games={games}
                statuses={statuses}
                onSave={handleSaveGame}
                onDelete={handleDeleteGame}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
