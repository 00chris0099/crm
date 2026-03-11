'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Database, Table2, Eye, ChevronRight, ChevronDown,
    RefreshCw, Search, Filter, Plus, Trash2, Edit3,
    Play, Clock, Star, StarOff, ChevronUp, ChevronLeft,
    ChevronRight as ChevRight, X, Save, AlertTriangle,
    Activity, HardDrive, Zap, Terminal, BarChart2, Key,
    Link as LinkIcon, Info, Download, Copy, Check,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DbInfo {
    id: string; name: string; color: string; description?: string;
    status: 'connected' | 'error'; error?: string; version?: string;
    size?: string; activeConnections?: number;
}
interface TableInfo {
    table_name: string; table_type: string; size?: string;
    row_count?: number; total_size?: string;
}
interface ColumnInfo {
    column_name: string; data_type: string; is_nullable: string;
    column_default?: string; is_primary_key: boolean;
    foreign_table_name?: string; foreign_table_schema?: string;
    foreign_column_name?: string; udt_name?: string;
}
interface Filter { column: string; operator: string; value: string; }
interface QueryHistory { sql: string; ts: number; dbId: string; durationMs?: number; ok: boolean; }

const OPERATORS = [
    { value: 'contains', label: 'Contiene' },
    { value: 'eq', label: '= Igual' },
    { value: 'neq', label: '≠ Distinto' },
    { value: 'starts_with', label: 'Empieza con' },
    { value: 'gt', label: '> Mayor' },
    { value: 'lt', label: '< Menor' },
    { value: 'is_null', label: 'Es NULL' },
    { value: 'not_null', label: 'No es NULL' },
];

function typeColor(type: string) {
    if (/int|serial|numeric|float|double|decimal/.test(type)) return '#34d399';
    if (/char|text|varchar|uuid/.test(type)) return '#60a5fa';
    if (/bool/.test(type)) return '#f472b6';
    if (/date|time|timestamp/.test(type)) return '#fbbf24';
    if (/json/.test(type)) return '#a78bfa';
    return '#94a3b8';
}

function formatCellValue(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CellEditor({
    value, onSave, onCancel,
}: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
    const [val, setVal] = useState(value);
    const ref = useRef<HTMLTextAreaElement>(null);
    useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
    return (
        <div className="dba-cell-editor">
            <textarea
                ref={ref}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSave(val); }
                    if (e.key === 'Escape') onCancel();
                }}
                rows={1}
            />
            <div className="dba-cell-editor-btns">
                <button onClick={() => onSave(val)} title="Guardar (Enter)"><Check size={12} /></button>
                <button onClick={onCancel} title="Cancelar (Esc)"><X size={12} /></button>
            </div>
        </div>
    );
}

function ConfirmModal({
    title, message, onConfirm, onCancel, danger = true,
}: { title: string; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) {
    return (
        <div className="dba-modal-overlay" onClick={onCancel}>
            <div className="dba-modal" onClick={(e) => e.stopPropagation()}>
                <div className="dba-modal-icon"><AlertTriangle size={28} /></div>
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="dba-modal-btns">
                    <button className="dba-btn dba-btn-ghost" onClick={onCancel}>Cancelar</button>
                    <button className={`dba-btn ${danger ? 'dba-btn-danger' : 'dba-btn-primary'}`} onClick={onConfirm}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = 'spreadsheet' | 'schema' | 'sql' | 'stats';

export default function DatabaseAdminView() {
    // Databases
    const [databases, setDatabases] = useState<DbInfo[]>([]);
    const [loadingDbs, setLoadingDbs] = useState(true);

    // Navigation tree
    const [selectedDb, setSelectedDb] = useState<string | null>(null);
    const [selectedSchema, setSelectedSchema] = useState('public');
    const [schemas, setSchemas] = useState<string[]>([]);
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
    const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set());
    const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());

    // Table view
    const [activeTab, setActiveTab] = useState<Tab>('spreadsheet');
    const [columns, setColumns] = useState<ColumnInfo[]>([]);
    const [rows, setRows] = useState<Record<string, unknown>[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [sortCol, setSortCol] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState<Filter[]>([]);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [loading, setLoading] = useState(false);

    // Selected rows for bulk delete
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

    // Cell editing
    const [editingCell, setEditingCell] = useState<{ rowIdx: number; col: string } | null>(null);

    // New row form
    const [showNewRowForm, setShowNewRowForm] = useState(false);
    const [newRowData, setNewRowData] = useState<Record<string, string>>({});

    // Confirm modal
    const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; action: () => void } | null>(null);

    // SQL Editor
    const [sqlText, setSqlText] = useState('');
    const [sqlResult, setSqlResult] = useState<{ ok: boolean; rows?: Record<string, unknown>[]; fields?: { name: string }[]; rowCount?: number; error?: string; durationMs?: number } | null>(null);
    const [sqlLoading, setSqlLoading] = useState(false);
    const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
    const [savedQueries, setSavedQueries] = useState<QueryHistory[]>([]);

    // Stats
    const [stats, setStats] = useState<{ dbStats?: { size: string; activeConnections: number }; tableStats?: Record<string, unknown>[]; slowQueries?: Record<string, unknown>[] } | null>(null);

    // Copy feedback
    const [copied, setCopied] = useState(false);

    // ── Load databases ──────────────────────────────────────────────────────────
    useEffect(() => {
        fetch('/api/db-admin/databases')
            .then((r) => r.json())
            .then((d) => { setDatabases(d.databases ?? []); setLoadingDbs(false); })
            .catch(() => setLoadingDbs(false));
    }, []);

    // ── Select database ─────────────────────────────────────────────────────────
    const selectDb = useCallback(async (dbId: string) => {
        setSelectedDb(dbId);
        setSelectedTable(null);
        setTables([]);
        const r = await fetch(`/api/db-admin/schemas?db=${dbId}`);
        const d = await r.json();
        const schemaList: string[] = d.schemas ?? ['public'];
        setSchemas(schemaList);
        const defaultSchema = schemaList.includes('public') ? 'public' : schemaList[0];
        setSelectedSchema(defaultSchema);
        loadTables(dbId, defaultSchema);
    }, []);

    const loadTables = useCallback(async (dbId: string, schema: string) => {
        const r = await fetch(`/api/db-admin/tables?db=${dbId}&schema=${schema}`);
        const d = await r.json();
        setTables(d.tables ?? []);
    }, []);

    // ── Select table ────────────────────────────────────────────────────────────
    const selectTable = useCallback(async (table: TableInfo) => {
        setSelectedTable(table);
        setPage(1);
        setSearch('');
        setSearchInput('');
        setSortCol(null);
        setSortDir('ASC');
        setFilters([]);
        setSelectedRows(new Set());
        setActiveTab('spreadsheet');

        // Load columns
        const r = await fetch(
            `/api/db-admin/schema?db=${selectedDb}&schema=${selectedSchema}&table=${table.table_name}`
        );
        const d = await r.json();
        setColumns(d.columns ?? []);
    }, [selectedDb, selectedSchema]);

    // ── Load table data ─────────────────────────────────────────────────────────
    const loadData = useCallback(async (opts?: { pg?: number; sc?: string; sd?: 'ASC' | 'DESC'; sr?: string }) => {
        if (!selectedDb || !selectedTable) return;
        setLoading(true);
        setSelectedRows(new Set());
        const pg = opts?.pg ?? page;
        const sc = opts?.sc !== undefined ? opts.sc : sortCol;
        const sd = opts?.sd ?? sortDir;
        const sr = opts?.sr !== undefined ? opts.sr : search;

        const params = new URLSearchParams({
            db: selectedDb, schema: selectedSchema, table: selectedTable.table_name,
            page: String(pg), pageSize: String(pageSize),
            ...(sc ? { sort: sc, dir: sd } : {}),
            ...(sr ? { search: sr } : {}),
            ...(filters.length ? { filters: JSON.stringify(filters) } : {}),
        });

        const r = await fetch(`/api/db-admin/table-data?${params}`);
        const d = await r.json();
        setRows(d.rows ?? []);
        setTotalRows(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
        setLoading(false);
    }, [selectedDb, selectedTable, selectedSchema, page, sortCol, sortDir, search, filters, pageSize]);

    useEffect(() => {
        if (selectedTable) loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTable, page, sortCol, sortDir, filters, search]);

    // ── Sorting ─────────────────────────────────────────────────────────────────
    const handleSort = (col: string) => {
        const newDir = sortCol === col && sortDir === 'ASC' ? 'DESC' : 'ASC';
        setSortCol(col);
        setSortDir(newDir);
        setPage(1);
        loadData({ pg: 1, sc: col, sd: newDir });
    };

    // ── Search ──────────────────────────────────────────────────────────────────
    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
        loadData({ pg: 1, sr: searchInput });
    };

    // ── Cell edit save ──────────────────────────────────────────────────────────
    const saveCellEdit = async (rowIdx: number, col: string, value: string) => {
        const row = rows[rowIdx];
        const pk = columns.find((c) => c.is_primary_key);
        if (!pk) { alert('No se encontró llave primaria para esta tabla.'); return; }

        const r = await fetch('/api/db-admin/table-data', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dbId: selectedDb, schema: selectedSchema, table: selectedTable!.table_name,
                primaryKey: pk.column_name, primaryValue: row[pk.column_name],
                column: col, value,
            }),
        });
        const d = await r.json();
        if (d.error) { alert(`Error: ${d.error}`); return; }
        setRows((prev) => prev.map((row, i) => i === rowIdx ? { ...row, [col]: value } : row));
        setEditingCell(null);
    };

    // ── Delete rows ─────────────────────────────────────────────────────────────
    const deleteSelected = async () => {
        const pk = columns.find((c) => c.is_primary_key);
        if (!pk) { alert('No hay llave primaria.'); return; }
        const values = Array.from(selectedRows).map((i) => rows[i][pk.column_name]);
        const r = await fetch('/api/db-admin/table-data', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dbId: selectedDb, schema: selectedSchema, table: selectedTable!.table_name,
                primaryKey: pk.column_name, primaryValues: values,
            }),
        });
        const d = await r.json();
        if (d.error) { alert(`Error: ${d.error}`); return; }
        setConfirmModal(null);
        loadData();
    };

    // ── Insert row ──────────────────────────────────────────────────────────────
    const insertRow = async () => {
        const r = await fetch('/api/db-admin/table-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dbId: selectedDb, schema: selectedSchema, table: selectedTable!.table_name,
                data: newRowData,
            }),
        });
        const d = await r.json();
        if (d.error) { alert(`Error: ${d.error}`); return; }
        setShowNewRowForm(false);
        setNewRowData({});
        loadData();
    };

    // ── SQL execution ────────────────────────────────────────────────────────────
    const runSql = async () => {
        if (!selectedDb || !sqlText.trim()) return;
        setSqlLoading(true);
        const r = await fetch('/api/db-admin/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dbId: selectedDb, sql: sqlText }),
        });
        const d = await r.json();
        setSqlResult(d);
        setSqlLoading(false);
        const entry: QueryHistory = { sql: sqlText, ts: Date.now(), dbId: selectedDb!, durationMs: d.durationMs, ok: d.ok };
        setQueryHistory((prev) => [entry, ...prev].slice(0, 50));
    };

    // ── Load stats ───────────────────────────────────────────────────────────────
    const loadStats = useCallback(async () => {
        if (!selectedDb) return;
        const r = await fetch(`/api/db-admin/stats?db=${selectedDb}&schema=${selectedSchema}`);
        const d = await r.json();
        setStats(d);
    }, [selectedDb, selectedSchema]);

    useEffect(() => {
        if (activeTab === 'stats') loadStats();
    }, [activeTab, loadStats]);

    // ── Copy SQL result ──────────────────────────────────────────────────────────
    const copyResult = () => {
        if (!sqlResult?.rows) return;
        navigator.clipboard.writeText(JSON.stringify(sqlResult.rows, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Primary key for table ────────────────────────────────────────────────────
    const pkCol = columns.find((c) => c.is_primary_key);

    // ─── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="dba-root">
            {/* ── LEFT SIDEBAR ── */}
            <div className="dba-sidebar">
                <div className="dba-sidebar-header">
                    <Database size={16} />
                    <span>Database Explorer</span>
                    <button className="dba-icon-btn" onClick={() => { setLoadingDbs(true); fetch('/api/db-admin/databases').then(r => r.json()).then(d => { setDatabases(d.databases ?? []); setLoadingDbs(false); }); }} title="Refresh">
                        <RefreshCw size={13} />
                    </button>
                </div>

                <div className="dba-tree">
                    {loadingDbs && <div className="dba-tree-loading">Conectando...</div>}
                    {databases.map((db) => (
                        <div key={db.id}>
                            <div
                                className={`dba-tree-db ${selectedDb === db.id ? 'active' : ''}`}
                                onClick={() => {
                                    setExpandedDbs((prev) => { const n = new Set(prev); n.has(db.id) ? n.delete(db.id) : n.add(db.id); return n; });
                                    selectDb(db.id);
                                }}
                            >
                                <span className="dba-tree-arrow">{expandedDbs.has(db.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>
                                <span className="dba-db-dot" style={{ background: db.color }} />
                                <span className="dba-tree-label">{db.name}</span>
                                <span className={`dba-status-badge ${db.status}`}>{db.status === 'connected' ? '●' : '✕'}</span>
                            </div>

                            {expandedDbs.has(db.id) && db.id === selectedDb && (
                                <div className="dba-tree-schemas">
                                    {schemas.map((schema) => (
                                        <div key={schema}>
                                            <div
                                                className={`dba-tree-schema ${selectedSchema === schema ? 'active' : ''}`}
                                                onClick={() => {
                                                    setSelectedSchema(schema);
                                                    setExpandedSchemas((p) => { const n = new Set(p); n.has(schema) ? n.delete(schema) : n.add(schema); return n; });
                                                    loadTables(db.id, schema);
                                                }}
                                            >
                                                <span className="dba-tree-arrow">{expandedSchemas.has(schema) ? <ChevronDown size={11} /> : <ChevronRight size={11} />}</span>
                                                <span className="dba-tree-schema-icon">◈</span>
                                                <span>{schema}</span>
                                            </div>

                                            {expandedSchemas.has(schema) && schema === selectedSchema && tables.map((t) => (
                                                <div
                                                    key={t.table_name}
                                                    className={`dba-tree-table ${selectedTable?.table_name === t.table_name ? 'active' : ''}`}
                                                    onClick={() => selectTable(t)}
                                                    title={`${t.row_count ?? '?'} filas · ${t.total_size ?? t.size ?? ''}`}
                                                >
                                                    {t.table_type === 'VIEW' ? <Eye size={11} className="dba-tree-icon" /> : <Table2 size={11} className="dba-tree-icon" />}
                                                    <span>{t.table_name}</span>
                                                    {t.row_count != null && (
                                                        <span className="dba-tree-count">{Number(t.row_count).toLocaleString()}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* DB info panel */}
                {selectedDb && (
                    <div className="dba-sidebar-info">
                        {databases.filter(d => d.id === selectedDb).map(db => (
                            <div key={db.id}>
                                <div className="dba-info-row"><HardDrive size={12} /> {db.size ?? '—'}</div>
                                <div className="dba-info-row"><Activity size={12} /> {db.activeConnections ?? 0} conn.</div>
                                <div className="dba-info-row" style={{ color: db.status === 'connected' ? '#34d399' : '#f87171', fontSize: '10px' }}>
                                    {db.status === 'connected' ? '✓ Conectado' : `✕ ${db.error}`}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── MAIN AREA ── */}
            <div className="dba-main">
                {!selectedTable ? (
                    <div className="dba-empty">
                        <Database size={48} opacity={0.2} />
                        <h3>Selecciona una tabla</h3>
                        <p>Usa el explorador de la izquierda para navegar por tus bases de datos.</p>
                        {databases.length === 0 && !loadingDbs && (
                            <div className="dba-error-banner">
                                <AlertTriangle size={16} />
                                <span>No se pudo conectar a ninguna base de datos. Verifica las variables de entorno.</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="dba-table-header">
                            <div className="dba-breadcrumb">
                                <span>{databases.find(d => d.id === selectedDb)?.name}</span>
                                <ChevRight size={14} opacity={0.4} />
                                <span>{selectedSchema}</span>
                                <ChevRight size={14} opacity={0.4} />
                                <strong>{selectedTable.table_name}</strong>
                                {selectedTable.table_type === 'VIEW' && <span className="dba-badge-view">VIEW</span>}
                            </div>
                            <div className="dba-header-meta">
                                <span>{totalRows.toLocaleString()} filas</span>
                                {selectedTable.total_size && <span>{selectedTable.total_size}</span>}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="dba-tabs">
                            {([
                                { id: 'spreadsheet', icon: <Table2 size={14} />, label: 'Datos' },
                                { id: 'schema', icon: <Info size={14} />, label: 'Estructura' },
                                { id: 'sql', icon: <Terminal size={14} />, label: 'SQL Editor' },
                                { id: 'stats', icon: <BarChart2 size={14} />, label: 'Monitoring' },
                            ] as { id: Tab; icon: React.ReactNode; label: string }[]).map((t) => (
                                <button
                                    key={t.id}
                                    className={`dba-tab ${activeTab === t.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(t.id)}
                                >
                                    {t.icon}{t.label}
                                </button>
                            ))}
                        </div>

                        {/* ── SPREADSHEET TAB ── */}
                        {activeTab === 'spreadsheet' && (
                            <div className="dba-spreadsheet-wrap">
                                {/* Toolbar */}
                                <div className="dba-toolbar">
                                    <div className="dba-search-wrap">
                                        <Search size={14} />
                                        <input
                                            className="dba-search"
                                            placeholder="Buscar en toda la tabla..."
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                        {searchInput && (
                                            <button onClick={() => { setSearchInput(''); setSearch(''); loadData({ sr: '' }); }}><X size={12} /></button>
                                        )}
                                    </div>
                                    <button
                                        className={`dba-btn dba-btn-ghost ${filters.length > 0 ? 'dba-btn-active' : ''}`}
                                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                                    >
                                        <Filter size={14} /> Filtros {filters.length > 0 && `(${filters.length})`}
                                    </button>
                                    <button className="dba-btn dba-btn-ghost" onClick={() => loadData()}>
                                        <RefreshCw size={14} /> Actualizar
                                    </button>
                                    <div style={{ flex: 1 }} />
                                    {selectedRows.size > 0 && (
                                        <button
                                            className="dba-btn dba-btn-danger"
                                            onClick={() => setConfirmModal({
                                                title: 'Eliminar registros',
                                                message: `¿Eliminar ${selectedRows.size} registro(s)? Esta acción no se puede deshacer.`,
                                                action: deleteSelected,
                                            })}
                                        >
                                            <Trash2 size={14} /> Eliminar ({selectedRows.size})
                                        </button>
                                    )}
                                    <button className="dba-btn dba-btn-primary" onClick={() => {
                                        const init: Record<string, string> = {};
                                        columns.forEach(c => { if (!c.is_primary_key) init[c.column_name] = ''; });
                                        setNewRowData(init);
                                        setShowNewRowForm(true);
                                    }}>
                                        <Plus size={14} /> Nuevo registro
                                    </button>
                                </div>

                                {/* Filter Panel */}
                                {showFilterPanel && (
                                    <div className="dba-filter-panel">
                                        <div className="dba-filter-header">
                                            <Filter size={13} /> Filtros avanzados
                                            <button className="dba-icon-btn" onClick={() => { setFilters([]); loadData(); }}>Limpiar</button>
                                        </div>
                                        {filters.map((f, i) => (
                                            <div key={i} className="dba-filter-row">
                                                <select value={f.column} onChange={(e) => setFilters(p => p.map((x, j) => j === i ? { ...x, column: e.target.value } : x))}>
                                                    {columns.map(c => <option key={c.column_name} value={c.column_name}>{c.column_name}</option>)}
                                                </select>
                                                <select value={f.operator} onChange={(e) => setFilters(p => p.map((x, j) => j === i ? { ...x, operator: e.target.value } : x))}>
                                                    {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                                {!['is_null', 'not_null'].includes(f.operator) && (
                                                    <input
                                                        value={f.value}
                                                        placeholder="Valor..."
                                                        onChange={(e) => setFilters(p => p.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                                                    />
                                                )}
                                                <button onClick={() => setFilters(p => p.filter((_, j) => j !== i))}><X size={12} /></button>
                                            </div>
                                        ))}
                                        <div className="dba-filter-actions">
                                            <button className="dba-btn dba-btn-ghost" onClick={() => setFilters(p => [...p, { column: columns[0]?.column_name ?? '', operator: 'contains', value: '' }])}>
                                                <Plus size={12} /> Agregar filtro
                                            </button>
                                            <button className="dba-btn dba-btn-primary" onClick={() => { setPage(1); loadData({ pg: 1 }); setShowFilterPanel(false); }}>
                                                Aplicar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* New Row Form */}
                                {showNewRowForm && (
                                    <div className="dba-new-row-panel">
                                        <div className="dba-new-row-header">
                                            <Plus size={14} /> Nuevo registro
                                            <button className="dba-icon-btn" onClick={() => setShowNewRowForm(false)}><X size={13} /></button>
                                        </div>
                                        <div className="dba-new-row-fields">
                                            {columns.filter(c => !c.is_primary_key).map(c => (
                                                <div key={c.column_name} className="dba-new-row-field">
                                                    <label>{c.column_name} <span style={{ opacity: .5 }}>({c.data_type})</span></label>
                                                    <input
                                                        placeholder={c.column_default ? `Default: ${c.column_default}` : c.is_nullable === 'YES' ? 'NULL' : 'Requerido'}
                                                        value={newRowData[c.column_name] ?? ''}
                                                        onChange={e => setNewRowData(p => ({ ...p, [c.column_name]: e.target.value }))}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="dba-new-row-actions">
                                            <button className="dba-btn dba-btn-ghost" onClick={() => setShowNewRowForm(false)}>Cancelar</button>
                                            <button className="dba-btn dba-btn-primary" onClick={insertRow}><Save size={13} /> Insertar</button>
                                        </div>
                                    </div>
                                )}

                                {/* Spreadsheet Table */}
                                <div className="dba-table-container">
                                    {loading ? (
                                        <div className="dba-loading"><RefreshCw size={20} className="spin" /> Cargando datos...</div>
                                    ) : rows.length === 0 ? (
                                        <div className="dba-empty-table">Sin resultados</div>
                                    ) : (
                                        <table className="dba-table">
                                            <thead>
                                                <tr>
                                                    <th className="dba-th-check">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRows.size === rows.length}
                                                            onChange={(e) => setSelectedRows(e.target.checked ? new Set(rows.map((_, i) => i)) : new Set())}
                                                        />
                                                    </th>
                                                    <th className="dba-th-num">#</th>
                                                    {columns.map((c) => (
                                                        <th
                                                            key={c.column_name}
                                                            className="dba-th"
                                                            onClick={() => handleSort(c.column_name)}
                                                            title={`${c.data_type}${c.is_primary_key ? ' (PK)' : ''}${c.foreign_table_name ? ` → ${c.foreign_table_name}` : ''}`}
                                                        >
                                                            <div className="dba-th-inner">
                                                                {c.is_primary_key && <Key size={10} style={{ color: '#fbbf24', flexShrink: 0 }} />}
                                                                {c.foreign_table_name && <LinkIcon size={10} style={{ color: '#60a5fa', flexShrink: 0 }} />}
                                                                <span>{c.column_name}</span>
                                                                <span className="dba-col-type" style={{ color: typeColor(c.data_type) }}>{c.udt_name ?? c.data_type}</span>
                                                                {sortCol === c.column_name && (sortDir === 'ASC' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((row, rowIdx) => (
                                                    <tr key={rowIdx} className={selectedRows.has(rowIdx) ? 'selected' : ''}>
                                                        <td className="dba-td-check">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedRows.has(rowIdx)}
                                                                onChange={(e) => setSelectedRows(p => { const n = new Set(p); e.target.checked ? n.add(rowIdx) : n.delete(rowIdx); return n; })}
                                                            />
                                                        </td>
                                                        <td className="dba-td-num">{(page - 1) * pageSize + rowIdx + 1}</td>
                                                        {columns.map((c) => {
                                                            const v = row[c.column_name];
                                                            const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.col === c.column_name;
                                                            const display = formatCellValue(v);
                                                            return (
                                                                <td
                                                                    key={c.column_name}
                                                                    className={`dba-td ${v === null ? 'dba-null' : ''} ${isEditing ? 'editing' : ''}`}
                                                                    onDoubleClick={() => !c.is_primary_key && setEditingCell({ rowIdx, col: c.column_name })}
                                                                    title={display}
                                                                >
                                                                    {isEditing ? (
                                                                        <CellEditor
                                                                            value={display}
                                                                            onSave={(val) => saveCellEdit(rowIdx, c.column_name, val)}
                                                                            onCancel={() => setEditingCell(null)}
                                                                        />
                                                                    ) : (
                                                                        <span className="dba-cell-text">
                                                                            {v === null ? <span className="dba-null-label">NULL</span> : display}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                {/* Pagination */}
                                <div className="dba-pagination">
                                    <span>{totalRows.toLocaleString()} registros · Página {page} de {totalPages}</span>
                                    <div className="dba-page-btns">
                                        <button disabled={page <= 1} onClick={() => { setPage(1); loadData({ pg: 1 }); }}><ChevronLeft size={13} /><ChevronLeft size={13} /></button>
                                        <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); loadData({ pg: page - 1 }); }}><ChevronLeft size={13} /></button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                                            return (
                                                <button key={pg} className={page === pg ? 'active' : ''} onClick={() => { setPage(pg); loadData({ pg }); }}>
                                                    {pg}
                                                </button>
                                            );
                                        })}
                                        <button disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); loadData({ pg: page + 1 }); }}><ChevRight size={13} /></button>
                                        <button disabled={page >= totalPages} onClick={() => { setPage(totalPages); loadData({ pg: totalPages }); }}><ChevRight size={13} /><ChevRight size={13} /></button>
                                    </div>
                                    <span className="dba-hint">Doble clic en una celda para editar</span>
                                </div>
                            </div>
                        )}

                        {/* ── SCHEMA TAB ── */}
                        {activeTab === 'schema' && (
                            <div className="dba-schema-view">
                                <h3>Estructura de <code>{selectedTable.table_name}</code></h3>
                                <table className="dba-schema-table">
                                    <thead>
                                        <tr>
                                            <th>Columna</th><th>Tipo</th><th>Nullable</th><th>Default</th><th>Info</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {columns.map((c) => (
                                            <tr key={c.column_name}>
                                                <td>
                                                    <div className="dba-col-name-cell">
                                                        {c.is_primary_key && <span className="dba-badge dba-badge-pk"><Key size={9} /> PK</span>}
                                                        {c.foreign_table_name && <span className="dba-badge dba-badge-fk"><LinkIcon size={9} /> FK</span>}
                                                        <strong>{c.column_name}</strong>
                                                    </div>
                                                </td>
                                                <td><span className="dba-type-chip" style={{ background: typeColor(c.data_type) + '22', color: typeColor(c.data_type), border: `1px solid ${typeColor(c.data_type)}44` }}>{c.data_type}</span></td>
                                                <td><span className={`dba-nullable ${c.is_nullable === 'YES' ? 'yes' : 'no'}`}>{c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}</span></td>
                                                <td><code className="dba-default">{c.column_default ?? '—'}</code></td>
                                                <td>
                                                    {c.foreign_table_name && (
                                                        <span className="dba-fk-ref">→ {c.foreign_table_schema}.{c.foreign_table_name}({c.foreign_column_name})</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── SQL EDITOR TAB ── */}
                        {activeTab === 'sql' && (
                            <div className="dba-sql-view">
                                <div className="dba-sql-editor-wrap">
                                    <div className="dba-sql-toolbar">
                                        <Terminal size={14} /> <span>SQL Editor — <strong>{databases.find(d => d.id === selectedDb)?.name}</strong></span>
                                        <div style={{ flex: 1 }} />
                                        <button
                                            className="dba-btn dba-btn-primary"
                                            onClick={runSql}
                                            disabled={sqlLoading || !sqlText.trim()}
                                        >
                                            {sqlLoading ? <RefreshCw size={13} className="spin" /> : <Play size={13} />}
                                            Ejecutar (Ctrl+Enter)
                                        </button>
                                    </div>
                                    <textarea
                                        className="dba-sql-textarea"
                                        value={sqlText}
                                        onChange={(e) => setSqlText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); runSql(); } }}
                                        placeholder={`-- Escribe tu consulta SQL aquí\n-- Ctrl+Enter para ejecutar\n\nSELECT * FROM "${selectedTable.table_name}" LIMIT 10;`}
                                        spellCheck={false}
                                    />
                                </div>

                                {/* Quick table buttons */}
                                <div className="dba-sql-quick">
                                    {tables.slice(0, 12).map(t => (
                                        <button key={t.table_name} className="dba-quick-table" onClick={() => setSqlText(`SELECT * FROM "${t.table_name}" LIMIT 50;`)}>
                                            {t.table_name}
                                        </button>
                                    ))}
                                </div>

                                {/* Result */}
                                {sqlResult && (
                                    <div className="dba-sql-result">
                                        <div className="dba-result-header">
                                            <span className={sqlResult.ok ? 'dba-ok' : 'dba-err'}>
                                                {sqlResult.ok ? `✓ ${sqlResult.rowCount ?? sqlResult.rows?.length ?? 0} filas · ${sqlResult.durationMs}ms` : `✕ Error`}
                                            </span>
                                            {sqlResult.ok && sqlResult.rows && (
                                                <button className="dba-btn dba-btn-ghost" onClick={copyResult}>
                                                    {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar JSON</>}
                                                </button>
                                            )}
                                        </div>
                                        {!sqlResult.ok && <div className="dba-error-msg">{sqlResult.error}</div>}
                                        {sqlResult.ok && sqlResult.rows && (
                                            <div className="dba-table-container dba-result-table-wrap">
                                                <table className="dba-table">
                                                    <thead>
                                                        <tr>
                                                            {sqlResult.fields?.map(f => <th key={f.name} className="dba-th">{f.name}</th>)}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sqlResult.rows.map((row, i) => (
                                                            <tr key={i}>
                                                                {sqlResult.fields?.map(f => (
                                                                    <td key={f.name} className={`dba-td ${row[f.name] === null ? 'dba-null' : ''}`}>
                                                                        <span className="dba-cell-text">
                                                                            {row[f.name] === null ? <span className="dba-null-label">NULL</span> : formatCellValue(row[f.name])}
                                                                        </span>
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* History */}
                                {queryHistory.length > 0 && (
                                    <div className="dba-history">
                                        <div className="dba-history-header"><Clock size={13} /> Historial reciente</div>
                                        {queryHistory.slice(0, 10).map((q, i) => (
                                            <div key={i} className={`dba-history-item ${q.ok ? 'ok' : 'err'}`} onClick={() => setSqlText(q.sql)}>
                                                <code>{q.sql.slice(0, 80)}{q.sql.length > 80 ? '…' : ''}</code>
                                                <span className="dba-history-meta">{q.durationMs}ms</span>
                                                <button
                                                    className="dba-icon-btn"
                                                    onClick={(e) => { e.stopPropagation(); setSavedQueries(p => [q, ...p]); }}
                                                    title="Guardar"
                                                ><Star size={11} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {savedQueries.length > 0 && (
                                    <div className="dba-history">
                                        <div className="dba-history-header"><Star size={13} /> Guardadas</div>
                                        {savedQueries.map((q, i) => (
                                            <div key={i} className="dba-history-item ok" onClick={() => setSqlText(q.sql)}>
                                                <code>{q.sql.slice(0, 80)}{q.sql.length > 80 ? '…' : ''}</code>
                                                <button className="dba-icon-btn" onClick={(e) => { e.stopPropagation(); setSavedQueries(p => p.filter((_, j) => j !== i)); }} title="Quitar"><StarOff size={11} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── STATS TAB ── */}
                        {activeTab === 'stats' && (
                            <div className="dba-stats-view">
                                {!stats ? (
                                    <div className="dba-loading"><RefreshCw size={20} className="spin" /> Cargando métricas...</div>
                                ) : (
                                    <>
                                        <div className="dba-stats-cards">
                                            <div className="dba-stat-card">
                                                <HardDrive size={20} />
                                                <div>
                                                    <div className="dba-stat-value">{stats.dbStats?.size ?? '—'}</div>
                                                    <div className="dba-stat-label">Tamaño total</div>
                                                </div>
                                            </div>
                                            <div className="dba-stat-card">
                                                <Activity size={20} />
                                                <div>
                                                    <div className="dba-stat-value">{stats.dbStats?.activeConnections ?? '—'}</div>
                                                    <div className="dba-stat-label">Conexiones activas</div>
                                                </div>
                                            </div>
                                            <div className="dba-stat-card">
                                                <Table2 size={20} />
                                                <div>
                                                    <div className="dba-stat-value">{tables.length}</div>
                                                    <div className="dba-stat-label">Tablas en schema</div>
                                                </div>
                                            </div>
                                        </div>

                                        <h4 style={{ margin: '16px 0 8px', opacity: .7, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tablas por tamaño</h4>
                                        <table className="dba-schema-table">
                                            <thead>
                                                <tr><th>Tabla</th><th>Filas</th><th>Tamaño</th></tr>
                                            </thead>
                                            <tbody>
                                                {(stats.tableStats as { table_name: string; row_count: number; total_size: string }[] ?? []).map((t) => (
                                                    <tr key={t.table_name} className="dba-stats-row" onClick={() => {
                                                        const found = tables.find(x => x.table_name === t.table_name);
                                                        if (found) { selectTable(found); setActiveTab('spreadsheet'); }
                                                    }}>
                                                        <td><Table2 size={12} style={{ marginRight: 6, opacity: .5 }} />{t.table_name}</td>
                                                        <td>{Number(t.row_count).toLocaleString()}</td>
                                                        <td>{t.total_size}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {stats.slowQueries && stats.slowQueries.length > 0 && (
                                            <>
                                                <h4 style={{ margin: '20px 0 8px', opacity: .7, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    <Zap size={13} /> Queries lentas (pg_stat_statements)
                                                </h4>
                                                <table className="dba-schema-table">
                                                    <thead><tr><th>Query</th><th>Llamadas</th><th>Avg (ms)</th></tr></thead>
                                                    <tbody>
                                                        {(stats.slowQueries as { query: string; calls: number; avg_ms: number }[]).map((q, i) => (
                                                            <tr key={i}>
                                                                <td><code style={{ fontSize: '11px' }}>{String(q.query).slice(0, 100)}</code></td>
                                                                <td>{q.calls}</td>
                                                                <td>{q.avg_ms}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Confirm Modal */}
            {confirmModal && (
                <ConfirmModal
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.action}
                    onCancel={() => setConfirmModal(null)}
                />
            )}
        </div>
    );
}
