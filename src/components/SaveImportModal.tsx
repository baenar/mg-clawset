import { useState, useRef } from 'react';
import type { CSSProperties } from 'react';
import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modal: CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '28px 32px',
  maxWidth: 520,
  width: '90%',
  fontFamily: 'var(--font)',
  color: 'var(--text-h)',
  position: 'relative',
};

const heading: CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 16,
  color: 'var(--text-h)',
};

const paragraph: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.6,
  color: 'var(--text)',
  marginBottom: 12,
};

const pathBox: CSSProperties = {
  background: 'var(--code-bg)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12,
  fontFamily: 'monospace',
  color: 'var(--sand-dune)',
  marginBottom: 16,
  wordBreak: 'break-all',
};

const warningBox: CSSProperties = {
  background: 'rgba(193,73,83,0.12)',
  border: '1px solid rgba(193,73,83,0.3)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12,
  color: 'var(--blushed-brick)',
  marginBottom: 16,
};

const buttonRow: CSSProperties = {
  display: 'flex',
  gap: 10,
  justifyContent: 'flex-end',
  marginTop: 20,
};

const btnBase: CSSProperties = {
  padding: '8px 18px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  fontFamily: 'var(--font)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const fileLabel: CSSProperties = {
  display: 'inline-block',
  padding: '8px 18px',
  borderRadius: 8,
  border: '1px dashed var(--border)',
  background: 'var(--code-bg)',
  color: 'var(--text-h)',
  fontFamily: 'var(--font)',
  fontSize: 13,
  cursor: 'pointer',
  textAlign: 'center',
  width: '100%',
  boxSizing: 'border-box',
};

const statusText: CSSProperties = {
  fontSize: 12,
  marginTop: 8,
  minHeight: 18,
};

function parseFurnitureBlob(uint8Array: Uint8Array): { furniture_name: string } {
  const view = new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
  const decoder = new TextDecoder('utf-8');
  let off = 0;
  off += 4; // field1
  const name_len = view.getInt32(off, true);
  off += 4;
  off += 4; // padding
  const nameBytes = uint8Array.slice(off, off + name_len);
  const furniture_name = decoder.decode(nameBytes);
  return { furniture_name };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (ownership: Record<string, number>) => void;
  furnitureIdMap: Map<string, string>; // lowercase name -> id
}

export default function SaveImportModal({ open, onClose, onImport, furnitureIdMap }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setStatus('Reading save file...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      setStatus('Initializing database parser...');
      const SQL = await initSqlJs({
        locateFile: () => sqlWasmUrl,
      });

      const db = new SQL.Database(uint8Array);

      setStatus('Parsing furniture data...');
      const stmt = db.prepare('SELECT key, data FROM furniture');
      const nameCounts: Record<string, number> = {};

      while (stmt.step()) {
        const row = stmt.getAsObject();
        const blobData = row.data as Uint8Array;
        try {
          const parsed = parseFurnitureBlob(blobData);
          const name = parsed.furniture_name;
          nameCounts[name] = (nameCounts[name] || 0) + 1;
        } catch {
          // skip unparseable rows
        }
      }
      stmt.free();
      db.close();

      // Map save file names to app IDs
      const newOwnership: Record<string, number> = {};
      let matched = 0;
      const unmatchedNames: string[] = [];

      for (const [name, count] of Object.entries(nameCounts)) {
        const id = furnitureIdMap.get(name.toLowerCase());
        if (id) {
          newOwnership[id] = (newOwnership[id] || 0) + count;
          matched++;
        } else {
          unmatchedNames.push(name);
        }
      }

      console.log('[SaveImport] Parsed names from save:', Object.keys(nameCounts));
      console.log('[SaveImport] Sample map keys:', [...furnitureIdMap.keys()].slice(0, 10));
      console.log('[SaveImport] Matched:', matched, 'Unmatched:', unmatchedNames);
      console.log('[SaveImport] New ownership:', newOwnership);

      setStatus(`Found ${matched} furniture types (${unmatchedNames.length} unmatched). Importing...`);
      onImport(newOwnership);

      setTimeout(() => {
        setStatus('');
        setFile(null);
        onClose();
      }, 800);
    } catch (err) {
      setError(`Error parsing save file: ${err instanceof Error ? err.message : String(err)}`);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={heading}>Import Inventory from Save File</h2>

        <p style={paragraph}>
          Upload your Mewgenics save file to automatically populate your furniture inventory.
          The save file can be found at:
        </p>

        <div style={pathBox}>
          C:\Users\&lt;username&gt;\AppData\Roaming\Glaiel Games\Mewgenics\&lt;steam_id&gt;\saves\
        </div>

        <p style={paragraph}>
          Look for files with the <strong>.sav</strong> extension in the saves folder.
        </p>

        <div style={warningBox}>
          ⚠ This will overwrite your current inventory data. Any manually added counts will be replaced.
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".sav,.db,.sqlite"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setError('');
            setStatus('');
          }}
        />

        <label
          style={fileLabel}
          onClick={() => fileRef.current?.click()}
        >
          {file ? `📁 ${file.name}` : 'Click to select .sav file'}
        </label>

        {status && <div style={{ ...statusText, color: 'var(--text)' }}>{status}</div>}
        {error && <div style={{ ...statusText, color: 'var(--blushed-brick)' }}>{error}</div>}

        <div style={buttonRow}>
          <button
            style={{ ...btnBase, background: 'var(--code-bg)', color: 'var(--text)' }}
            onClick={() => {
              setFile(null);
              setStatus('');
              setError('');
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            style={{
              ...btnBase,
              background: file && !loading ? 'var(--blushed-brick)' : 'var(--code-bg)',
              color: file && !loading ? '#fff' : 'var(--text)',
              opacity: file && !loading ? 1 : 0.5,
              cursor: file && !loading ? 'pointer' : 'not-allowed',
            }}
            disabled={!file || loading}
            onClick={handleImport}
          >
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
