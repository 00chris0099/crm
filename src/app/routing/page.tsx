'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface DbInfo {
    id: string;
    name: string;
    color: string;
    description?: string;
    status: 'connected' | 'error';
    error?: string;
    size?: string;
    activeConnections?: number;
}

interface TableInfo {
    table_name: string;
    table_type: string;
    row_count?: number;
    total_size?: string;
}

interface ColumnInfo {
    column_name: string;
    data_type: string;
    is_nullable: string;
    is_primary_key: boolean;
    column_default?: string;
}

interface TableDataResponse {
    rows: Record<string, any>[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function cls(...args: (string | false | undefined | null)[]) {
    return args.filter(Boolean).join(' ');
}

function formatValue(val: any): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
}

function typeColor(type: string): string {
    if (type.includes('int') || type.includes('numeric') || type.includes('float')) return '#a78bfa';
    if (type.includes('bool')) return '#34d399';
    if (type.includes('timestamp') || type.includes('date')) return '#60a5fa';
    if (type.includes('json')) return '#fbbf24';
    if (type === 'uuid') return '#f472b6';
    return '#94a3b8';
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DatabaseViewerPage() {
    // ── State ────────────────────────────────────────────────────────────────
    const [databases, setDatabases] = useState<DbInfo[]>([]);
    const [loadingDbs, setLoadingDbs] = useState(true);
    const [selectedDb, setSelectedDb] = useState<string>('');

    const [tables, setTables] = useState<TableInfo[]>([]);
    const [loadingTables, setLoadingTables] = useState(false);
    const [selectedTable, setSelectedTable] = useState<string>('');

    const [columns, setColumns] = useState<ColumnInfo[]>([]);
    const [tableData, setTableData] = useState<TableDataResponse | null>(null);
    const [loadingData, setLoadingData] = useState(false);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [sortCol, setSortCol] = useState<string>('');
    const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');

    // Editing
    const [editingCell, setEditingCell] = useState<{ rowIdx: number; col: string } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [savingCell, setSavingCell] = useState(false);

    // Selected rows for bulk delete
    const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set());

    // Add row modal
    const [showAddRow, setShowAddRow] = useState(false);
    const [newRowData, setNewRowData] = useState<Record<string, string>>({});
    const [savingRow, setSavingRow] = useState(false);

    // Notifications
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const primaryKey = columns.find(c => c.is_primary_key)?.column_name ?? columns[0]?.column_name ?? 'id';

    // ── Toast helper ─────────────────────────────────────────────────────────
    const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Load databases ────────────────────────────────────────────────────────
    useEffect(() => {
        setLoadingDbs(true);
        fetch('/api/db-admin/databases')
            .then(r => r.json())
            .then(d => {
                setDatabases(d.databases || []);
                // Auto-select crm_db if available and connected
                const crm = (d.databases || []).find((db: DbInfo) => db.id === 'crm_db' && db.status === 'connected');
                if (crm) setSelectedDb(crm.id);
            })
            .catch(console.error)
            .finally(() => setLoadingDbs(false));
    }, []);

    // ── Load tables when DB selected ──────────────────────────────────────────
    useEffect(() => {
        if (!selectedDb) return;
        setLoadingTables(true);
        setSelectedTable('');
        setTables([]);
        setTableData(null);
        setColumns([]);

        fetch(`/api/db-admin/tables?db=${selectedDb}&schema=public`)
            .then(r => r.json())
            .then(d => setTables(d.tables || []))
            .catch(console.error)
            .finally(() => setLoadingTables(false));
    }, [selectedDb]);

    // ── Load columns + data when table selected ───────────────────────────────
    const loadData = useCallback(
        async (tbl: string, pg: number, srch: string, scol: string, sdir: 'ASC' | 'DESC') => {
            if (!selectedDb || !tbl) return;
            setLoadingData(true);
            try {
                const [colRes, dataRes] = await Promise.all([
                    fetch(`/api/db-admin/schema?db=${selectedDb}&schema=public&table=${tbl}`).then(r => r.json()),
                    fetch(
                        `/api/db-admin/table-data?db=${selectedDb}&schema=public&table=${tbl}&page=${pg}&pageSize=${pageSize}&search=${encodeURIComponent(srch)}${scol ? `&sort=${scol}&dir=${sdir}` : ''}`
                    ).then(r => r.json()),
                ]);
                setColumns(colRes.columns || []);
                setTableData(dataRes);
                setSelectedRows(new Set());
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingData(false);
            }
        },
        [selectedDb, pageSize]
    );

    useEffect(() => {
        if (selectedTable) {
            setPage(1);
            loadData(selectedTable, 1, search, sortCol, sortDir);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTable]);

    useEffect(() => {
        if (selectedTable) loadData(selectedTable, page, search, sortCol, sortDir);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, sortCol, sortDir]);

    // Debounced search
    useEffect(() => {
        if (!selectedTable) return;
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            setPage(1);
            loadData(selectedTable, 1, search, sortCol, sortDir);
        }, 400);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // ── Inline edit ───────────────────────────────────────────────────────────
    const startEdit = (rowIdx: number, col: string, currentVal: any) => {
        if (col === primaryKey) return; // don't edit PK
        setEditingCell({ rowIdx, col });
        setEditValue(formatValue(currentVal));
    };

    const commitEdit = async () => {
        if (!editingCell || !tableData) return;
        const row = tableData.rows[editingCell.rowIdx];
        const pk = row[primaryKey];
        setSavingCell(true);
        try {
            const res = await fetch('/api/db-admin/table-data', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dbId: selectedDb,
                    schema: 'public',
                    table: selectedTable,
                    primaryKey,
                    primaryValue: pk,
                    column: editingCell.col,
                    value: editValue,
                }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error);
            // Update local data
            setTableData(prev => {
                if (!prev) return prev;
                const newRows = [...prev.rows];
                newRows[editingCell.rowIdx] = { ...newRows[editingCell.rowIdx], [editingCell.col]: editValue };
                return { ...prev, rows: newRows };
            });
            showToast('✓ Celda actualizada');
        } catch (e: any) {
            showToast(e.message || 'Error al guardar', 'err');
        } finally {
            setSavingCell(false);
            setEditingCell(null);
        }
    };

    const cancelEdit = () => setEditingCell(null);

    // ── Delete rows ───────────────────────────────────────────────────────────
    const deleteSelectedRows = async () => {
        if (selectedRows.size === 0) return;
        if (!confirm(`¿Eliminar ${selectedRows.size} fila(s)? Esta acción no se puede deshacer.`)) return;
        try {
            const res = await fetch('/api/db-admin/table-data', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dbId: selectedDb,
                    schema: 'public',
                    table: selectedTable,
                    primaryKey,
                    primaryValues: Array.from(selectedRows),
                }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            showToast(`✓ ${selectedRows.size} fila(s) eliminada(s)`);
            loadData(selectedTable, page, search, sortCol, sortDir);
        } catch (e: any) {
            showToast(e.message || 'Error al eliminar', 'err');
        }
    };

    // ── Add row ───────────────────────────────────────────────────────────────
    const saveNewRow = async () => {
        setSavingRow(true);
        try {
            const filtered: Record<string, string> = {};
            Object.entries(newRowData).forEach(([k, v]) => { if (v.trim()) filtered[k] = v; });

            const res = await fetch('/api/db-admin/table-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dbId: selectedDb, schema: 'public', table: selectedTable, data: filtered }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            showToast('✓ Fila agregada');
            setShowAddRow(false);
            setNewRowData({});
            loadData(selectedTable, page, search, sortCol, sortDir);
        } catch (e: any) {
            showToast(e.message || 'Error al agregar', 'err');
        } finally {
            setSavingRow(false);
        }
    };

    // ── Sort toggle ───────────────────────────────────────────────────────────
    const toggleSort = (col: string) => {
        if (sortCol === col) {
            setSortDir(d => d === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortCol(col);
            setSortDir('ASC');
        }
    };

    // ── Row selection ─────────────────────────────────────────────────────────
    const toggleRow = (pk: any) => {
        setSelectedRows(prev => {
            const s = new Set(prev);
            s.has(pk) ? s.delete(pk) : s.add(pk);
            return s;
        });
    };

    const toggleAllRows = () => {
        if (!tableData) return;
        const allPks = tableData.rows.map(r => r[primaryKey]);
        if (selectedRows.size === allPks.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(allPks));
        }
    };

    // ── Styles ────────────────────────────────────────────────────────────────
    const S = {
        page: { display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' } as React.CSSProperties,
        leftPanel: {
            width: '260px', flexShrink: 0, background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)', display: 'flex',
            flexDirection: 'column' as const, overflow: 'hidden',
        },
        rightPanel: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
        sectionTitle: { fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', padding: '12px 16px 6px' },
        dbChip: (active: boolean, color: string): React.CSSProperties => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 16px', cursor: 'pointer', borderLeft: active ? `3px solid ${color}` : '3px solid transparent',
            background: active ? `rgba(99,102,241,0.08)` : 'transparent',
            transition: 'all 150ms ease',
        }),
        tblRow: (active: boolean): React.CSSProperties => ({
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px', cursor: 'pointer',
            background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
            borderLeft: active ? '3px solid var(--brand-primary)' : '3px solid transparent',
            transition: 'background 150ms ease',
        }),
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={S.page}>
            {/* ── Left sidebar: DBs + Tables ── */}
            <div style={S.leftPanel}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="2">
                            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>
                        </svg>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Database Viewer</span>
                    </div>
                </div>

                {/* Databases */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <p style={S.sectionTitle}>Bases de datos</p>
                    {loadingDbs ? (
                        <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando...</div>
                    ) : databases.map(db => (
                        <div
                            key={db.id}
                            style={S.dbChip(selectedDb === db.id, db.color)}
                            onClick={() => { setSelectedDb(db.id); setSelectedTable(''); }}
                            onMouseEnter={e => { if (selectedDb !== db.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                            onMouseLeave={e => { if (selectedDb !== db.id) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: db.status === 'connected' ? '#10b981' : '#ef4444', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{db.name}</p>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{db.status === 'connected' ? db.size || 'Conectada' : 'Sin conexión'}</p>
                            </div>
                        </div>
                    ))}

                    {/* Tables */}
                    {selectedDb && (
                        <>
                            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }} />
                            <p style={S.sectionTitle}>Tablas</p>
                            {loadingTables ? (
                                <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>Cargando tablas...</div>
                            ) : tables.length === 0 ? (
                                <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>Sin tablas</div>
                            ) : tables.map(t => (
                                <div
                                    key={t.table_name}
                                    style={S.tblRow(selectedTable === t.table_name)}
                                    onClick={() => setSelectedTable(t.table_name)}
                                    onMouseEnter={e => { if (selectedTable !== t.table_name) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                    onMouseLeave={e => { if (selectedTable !== t.table_name) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selectedTable === t.table_name ? 'var(--brand-primary)' : 'var(--text-muted)'} strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
                                        </svg>
                                        <span style={{ fontSize: '13px', color: selectedTable === t.table_name ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selectedTable === t.table_name ? 600 : 400 }}>
                                            {t.table_name}
                                        </span>
                                    </div>
                                    {t.row_count !== undefined && t.row_count !== null && (
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                                            {Number(t.row_count).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* ── Right panel: Table viewer ── */}
            <div style={S.rightPanel}>
                {!selectedTable ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
                        </svg>
                        <p style={{ fontSize: '15px', fontWeight: 600 }}>
                            {!selectedDb ? 'Selecciona una base de datos' : 'Selecciona una tabla para ver sus datos'}
                        </p>
                        <p style={{ fontSize: '13px' }}>
                            {!selectedDb ? '← Elige una DB en el panel izquierdo' : `${tables.length} tabla(s) disponibles`}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Toolbar */}
                        <div style={{
                            height: '52px', borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '0 16px', background: 'var(--bg-surface)', flexShrink: 0,
                        }}>
                            {/* Breadcrumb */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{databases.find(d => d.id === selectedDb)?.name}</span>
                                <span>/</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{selectedTable}</span>
                                {tableData && (
                                    <span style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--brand-primary)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, marginLeft: '4px' }}>
                                        {tableData.total.toLocaleString()} filas
                                    </span>
                                )}
                            </div>

                            <div style={{ flex: 1 }} />

                            {/* Search */}
                            <div style={{ position: 'relative' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                                </svg>
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar en tabla..."
                                    style={{
                                        paddingLeft: '32px', paddingRight: '12px', height: '32px', width: '220px',
                                        background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                                        borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                                    }}
                                />
                            </div>

                            {/* Actions */}
                            {selectedRows.size > 0 && (
                                <button
                                    onClick={deleteSelectedRows}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.4)',
                                        background: 'rgba(239,68,68,0.1)', color: '#f87171',
                                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                    </svg>
                                    Eliminar ({selectedRows.size})
                                </button>
                            )}

                            <button
                                onClick={() => { setNewRowData({}); setShowAddRow(true); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 14px', borderRadius: '8px', border: 'none',
                                    background: 'var(--brand-primary)', color: 'white',
                                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                Agregar fila
                            </button>

                            <button
                                onClick={() => loadData(selectedTable, page, search, sortCol, sortDir)}
                                title="Recargar"
                                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                                </svg>
                            </button>
                        </div>

                        {/* Column type hints */}
                        {columns.length > 0 && (
                            <div style={{
                                display: 'flex', gap: '6px', padding: '8px 16px',
                                background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)',
                                overflowX: 'auto', flexShrink: 0,
                            }}>
                                {columns.map(c => (
                                    <div key={c.column_name} style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        padding: '3px 8px', borderRadius: '6px',
                                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {c.is_primary_key && (
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                                                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                                            </svg>
                                        )}
                                        <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 600 }}>{c.column_name}</span>
                                        <span style={{ fontSize: '10px', color: typeColor(c.data_type), fontFamily: 'monospace' }}>{c.data_type}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Table grid */}
                        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                            {loadingData ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column', gap: '12px', color: 'var(--text-muted)' }}>
                                    <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-strong)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                    Cargando datos...
                                </div>
                            ) : !tableData || tableData.rows.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', gap: '8px' }}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4">
                                        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>
                                    </svg>
                                    <p>Sin datos en esta tabla</p>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'auto' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 10 }}>
                                            {/* Checkbox column */}
                                            <th style={{ width: '40px', padding: '0 12px', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={tableData.rows.length > 0 && selectedRows.size === tableData.rows.length}
                                                    onChange={toggleAllRows}
                                                    style={{ cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
                                                />
                                            </th>
                                            {/* Row number */}
                                            <th style={{ width: '50px', padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textAlign: 'center' }}>#</th>
                                            {/* Data columns */}
                                            {columns.map(col => (
                                                <th
                                                    key={col.column_name}
                                                    onClick={() => toggleSort(col.column_name)}
                                                    style={{
                                                        padding: '10px 14px', textAlign: 'left',
                                                        borderBottom: '1px solid var(--border-subtle)',
                                                        borderRight: '1px solid var(--border-subtle)',
                                                        color: 'var(--text-secondary)', fontWeight: 600, fontSize: '12px',
                                                        cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = ''}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        {col.is_primary_key && <span style={{ color: '#fbbf24', fontSize: '10px' }}>🔑</span>}
                                                        <span style={{ color: typeColor(col.data_type) }}>
                                                            {col.column_name}
                                                        </span>
                                                        {sortCol === col.column_name && (
                                                            <span style={{ color: 'var(--brand-primary)', fontSize: '10px' }}>
                                                                {sortDir === 'ASC' ? '↑' : '↓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.rows.map((row, rowIdx) => {
                                            const pk = row[primaryKey];
                                            const isSelected = selectedRows.has(pk);
                                            return (
                                                <tr
                                                    key={rowIdx}
                                                    style={{
                                                        background: isSelected
                                                            ? 'rgba(99,102,241,0.08)'
                                                            : rowIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                                        transition: 'background 100ms ease',
                                                    }}
                                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = rowIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'; }}
                                                >
                                                    <td style={{ padding: '0 12px', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleRow(pk)}
                                                            style={{ cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center' }}>
                                                        {(page - 1) * pageSize + rowIdx + 1}
                                                    </td>
                                                    {columns.map(col => {
                                                        const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.col === col.column_name;
                                                        const val = row[col.column_name];
                                                        const isPK = col.column_name === primaryKey;
                                                        return (
                                                            <td
                                                                key={col.column_name}
                                                                onDoubleClick={() => !isPK && startEdit(rowIdx, col.column_name, val)}
                                                                style={{
                                                                    padding: 0,
                                                                    borderBottom: '1px solid var(--border-subtle)',
                                                                    borderRight: '1px solid var(--border-subtle)',
                                                                    maxWidth: '320px',
                                                                    cursor: isPK ? 'default' : 'text',
                                                                    position: 'relative',
                                                                }}
                                                                title={isPK ? 'Primary key — no editable' : 'Doble click para editar'}
                                                            >
                                                                {isEditing ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                        <input
                                                                            autoFocus
                                                                            value={editValue}
                                                                            onChange={e => setEditValue(e.target.value)}
                                                                            onKeyDown={e => {
                                                                                if (e.key === 'Enter') commitEdit();
                                                                                if (e.key === 'Escape') cancelEdit();
                                                                            }}
                                                                            onBlur={commitEdit}
                                                                            style={{
                                                                                width: '100%', padding: '7px 10px',
                                                                                background: 'rgba(99,102,241,0.15)',
                                                                                border: '1px solid var(--brand-primary)',
                                                                                color: 'var(--text-primary)', fontSize: '13px',
                                                                                outline: 'none', fontFamily: 'inherit',
                                                                            }}
                                                                            disabled={savingCell}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div style={{
                                                                        padding: '8px 14px',
                                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                        color: val === null || val === undefined
                                                                            ? 'var(--text-muted)'
                                                                            : isPK ? '#a78bfa' : 'var(--text-primary)',
                                                                        fontFamily: (col.data_type === 'uuid' || col.is_primary_key) ? 'monospace' : 'inherit',
                                                                        fontSize: col.data_type === 'uuid' ? '11px' : '13px',
                                                                        fontStyle: val === null || val === undefined ? 'italic' : 'normal',
                                                                        background: isPK ? 'rgba(167,139,250,0.04)' : 'transparent',
                                                                    }}>
                                                                        {val === null || val === undefined
                                                                            ? 'null'
                                                                            : typeof val === 'boolean'
                                                                                ? (val ? '✓ true' : '✗ false')
                                                                                : typeof val === 'object'
                                                                                    ? <code style={{ fontSize: '11px', color: '#fbbf24' }}>{JSON.stringify(val)}</code>
                                                                                    : String(val)}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        {tableData && tableData.totalPages > 1 && (
                            <div style={{
                                height: '48px', borderTop: '1px solid var(--border-subtle)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0 16px', background: 'var(--bg-surface)', flexShrink: 0,
                            }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, tableData.total)} de {tableData.total.toLocaleString()} filas
                                </span>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <button onClick={() => setPage(1)} disabled={page === 1} style={paginBtnStyle(page === 1)}>«</button>
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={paginBtnStyle(page === 1)}>‹</button>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '0 8px' }}>
                                        Pág. <strong>{page}</strong> / {tableData.totalPages}
                                    </span>
                                    <button onClick={() => setPage(p => Math.min(tableData.totalPages, p + 1))} disabled={page === tableData.totalPages} style={paginBtnStyle(page === tableData.totalPages)}>›</button>
                                    <button onClick={() => setPage(tableData.totalPages)} disabled={page === tableData.totalPages} style={paginBtnStyle(page === tableData.totalPages)}>»</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Add Row Modal ── */}
            {showAddRow && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
                    onClick={e => { if (e.target === e.currentTarget) setShowAddRow(false); }}>
                    <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '560px', borderRadius: '14px', border: '1px solid var(--border-strong)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Agregar fila a <code style={{ color: 'var(--brand-primary)' }}>{selectedTable}</code></h2>
                            <button onClick={() => setShowAddRow(false)} style={{ border: '1px solid var(--border-strong)', background: 'transparent', color: 'var(--text-muted)', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <div style={{ overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {columns
                                .filter(c => !c.is_primary_key && !c.column_default?.includes('gen_random_uuid') && !c.column_default?.includes('CURRENT_TIMESTAMP'))
                                .map(col => (
                                    <div key={col.column_name}>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
                                            {col.column_name}
                                            <span style={{ color: typeColor(col.data_type), marginLeft: '6px', fontFamily: 'monospace', textTransform: 'none', letterSpacing: 0 }}>{col.data_type}</span>
                                            {col.is_nullable === 'NO' && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                                        </label>
                                        <input
                                            value={newRowData[col.column_name] ?? ''}
                                            onChange={e => setNewRowData(prev => ({ ...prev, [col.column_name]: e.target.value }))}
                                            placeholder={col.is_nullable === 'YES' ? 'null (opcional)' : 'Requerido'}
                                            style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                                        />
                                    </div>
                                ))}
                        </div>
                        <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowAddRow(false)} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                            <button onClick={saveNewRow} disabled={savingRow} style={{ padding: '8px 18px', background: 'var(--brand-primary)', border: 'none', color: 'white', borderRadius: '8px', cursor: savingRow ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', opacity: savingRow ? 0.7 : 1 }}>
                                {savingRow ? <>Guardando...</> : <>Guardar fila</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast notification ── */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
                    padding: '12px 20px', borderRadius: '10px',
                    background: toast.type === 'ok' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${toast.type === 'ok' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                    color: toast.type === 'ok' ? '#10b981' : '#ef4444',
                    fontWeight: 600, fontSize: '13px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    animation: 'slideIn 200ms ease',
                }}>
                    {toast.msg}
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideIn { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                td:hover { background: rgba(99,102,241,0.04); }
            `}</style>
        </div>
    );
}

function paginBtnStyle(disabled: boolean): React.CSSProperties {
    return {
        width: '28px', height: '28px', borderRadius: '6px',
        border: '1px solid var(--border-strong)',
        background: 'transparent',
        color: disabled ? 'var(--text-disabled)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', fontWeight: 600,
        opacity: disabled ? 0.4 : 1,
    };
}
