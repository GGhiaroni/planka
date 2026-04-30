/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import Paths from '../../../constants/Paths';

import styles from './TableView.module.scss';

const PRIORITY_RANK = {
  'MÁXIMA PRIORIDADE': 1,
  'URGÊNCIA': 2,
  'PENDÊNCIAS DE INSTALAÇÃO': 3,
  'ATUALIZAÇÃO DO TRATAMENTO': 4,
  'EM TRATAMENTO': 5,
  'MÉDIA GRAVIDADE': 6,
  'EM ESPERA': 7,
  'BAIXA PRIORIDADE': 8,
};

// Map priority label name → CSS class for row coloring (matches the legend image).
const PRIORITY_CLASS = {
  'BAIXA PRIORIDADE': 'priorityBaixa',
  'MÉDIA GRAVIDADE': 'priorityMedia',
  'URGÊNCIA': 'priorityUrgencia',
  'EM TRATAMENTO': 'priorityTratamento',
  'ATUALIZAÇÃO DO TRATAMENTO': 'priorityAtualizacao',
  'PENDÊNCIAS DE INSTALAÇÃO': 'priorityPendencias',
  'EM ESPERA': 'priorityEspera',
  'MÁXIMA PRIORIDADE': 'priorityMaxima',
};

function priorityClassFor(labels) {
  if (!labels.length) return '';
  // Use the highest-priority label (lowest rank number)
  const sorted = [...labels].sort(
    (a, b) => (PRIORITY_RANK[a.name] || 999) - (PRIORITY_RANK[b.name] || 999),
  );
  return PRIORITY_CLASS[sorted[0].name] || '';
}

const DATE_PRESETS = [
  { value: '', label: 'Todas as datas' },
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '15d', label: 'Últimos 15 dias' },
  { value: 'month', label: 'Mês atual' },
  { value: 'lastMonth', label: 'Mês anterior' },
  { value: 'custom', label: 'Personalizado...' },
];

function rankForLabels(labels) {
  if (!labels.length) return 999;
  return Math.min(...labels.map((l) => PRIORITY_RANK[l.name] ?? 500));
}

function uniqueValues(rows, key) {
  const set = new Set();
  rows.forEach((r) => {
    const v = r.fields[key]?.value;
    if (v) set.add(v);
  });
  return [...set].sort((a, b) => a.localeCompare(b));
}

// Parse a string in DD/MM/YYYY (or YYYY-MM-DD) format. Returns timestamp or null.
function parseDateString(s) {
  if (!s) return null;
  const trimmed = String(s).trim();

  // DD/MM/YYYY
  const br = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const [, d, m, y] = br;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(dt.getTime()) ? null : dt.getTime();
  }

  // YYYY-MM-DD (HTML date input format)
  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(dt.getTime()) ? null : dt.getTime();
  }

  return null;
}

// Resolve the card's "logical date" for filtering — prefers the
// "Data de Abertura" custom field, falling back to Planka's createdAt.
function resolveCardDate(row) {
  const fieldVal = row.fields?.['Data de Abertura']?.value;
  const parsed = parseDateString(fieldVal);
  if (parsed != null) return parsed;
  if (row.createdAt) {
    const t = new Date(row.createdAt).getTime();
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

// Resolve the [start, end] range (inclusive) for a given preset or custom dates.
function resolveDateRange(preset, customStart, customEnd) {
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case 'today':
      return [startOfDay(now), endOfDay(now)];
    case '7d': {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return [startOfDay(s), endOfDay(now)];
    }
    case '15d': {
      const s = new Date(now);
      s.setDate(s.getDate() - 14);
      return [startOfDay(s), endOfDay(now)];
    }
    case 'month':
      return [
        new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      ];
    case 'lastMonth':
      return [
        new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0),
        endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)),
      ];
    case 'custom': {
      const s = customStart ? startOfDay(new Date(`${customStart}T00:00:00`)) : null;
      const e = customEnd ? endOfDay(new Date(`${customEnd}T00:00:00`)) : null;
      return [s, e];
    }
    default:
      return [null, null];
  }
}

function EditableTextCell({ value, onSave, multiline, className }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select) inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(value || '');
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== (value || '')) onSave(draft);
  };

  const cancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  if (editing) {
    const InputTag = multiline ? 'textarea' : 'input';
    const extra = multiline ? { rows: 3 } : { type: 'text' };
    return (
      <td className={className}>
        <InputTag
          ref={inputRef}
          className={styles.cellInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') cancel();
          }}
          {...extra}
        />
      </td>
    );
  }

  return (
    <td
      className={`${className} ${styles.editable}`}
      title={value}
      onClick={() => setEditing(true)}
    >
      {value || <span className={styles.placeholder}>—</span>}
    </td>
  );
}

EditableTextCell.propTypes = {
  value: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  multiline: PropTypes.bool,
  className: PropTypes.string,
};
EditableTextCell.defaultProps = { value: '', multiline: false, className: '' };

function EditableSelectCell({ value, options, onSave, className, renderDisplay }) {
  const [editing, setEditing] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    if (editing && selectRef.current) selectRef.current.focus();
  }, [editing]);

  if (editing) {
    return (
      <td className={className}>
        <select
          ref={selectRef}
          className={styles.cellInput}
          value={value || ''}
          onChange={(e) => {
            onSave(e.target.value);
            setEditing(false);
          }}
          onBlur={() => setEditing(false)}
        >
          <option value="">—</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </td>
    );
  }

  return (
    <td className={`${className} ${styles.editable}`} onClick={() => setEditing(true)}>
      {renderDisplay ? renderDisplay(value) : value || <span className={styles.placeholder}>—</span>}
    </td>
  );
}

EditableSelectCell.propTypes = {
  value: PropTypes.string,
  options: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  onSave: PropTypes.func.isRequired,
  className: PropTypes.string,
  renderDisplay: PropTypes.func,
};
EditableSelectCell.defaultProps = { value: '', className: '', renderDisplay: null };

const TableView = React.memo(({ cardIds }) => {
  const [t] = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { columns, rows } = useSelector((state) =>
    selectors.selectTableDataForCards(state, cardIds),
  );
  const boardLabels = useSelector(selectors.selectLabelsForCurrentBoard) || [];
  const boardListsRaw = useSelector(selectors.selectAvailableListsForCurrentBoard) || [];
  const boardLists = useMemo(
    () => boardListsRaw.filter((l) => l.type === 'active'),
    [boardListsRaw],
  );

  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // listId
  const [filterCidade, setFilterCidade] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [searchOs, setSearchOs] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [dragOverListId, setDragOverListId] = useState(null);

  const hasAnyLabel = useMemo(() => rows.some((r) => r.labels.length > 0), [rows]);
  const hasCidade = useMemo(() => columns.some((c) => c.name === 'Cidade'), [columns]);
  const hasEstado = useMemo(() => columns.some((c) => c.name === 'Estado'), [columns]);
  const hasOs = useMemo(() => columns.some((c) => c.name === 'OS Nº'), [columns]);
  // Cliente OR Nome Do Posto — same role across the two boards.
  const clientFieldName = useMemo(() => {
    if (columns.some((c) => c.name === 'Cliente')) return 'Cliente';
    if (columns.some((c) => c.name === 'Nome Do Posto')) return 'Nome Do Posto';
    return null;
  }, [columns]);
  const hasCliente = !!clientFieldName;

  const priorityOptions = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => r.labels.forEach((l) => set.add(l.name)));
    return [...set].sort((a, b) => (PRIORITY_RANK[a] || 500) - (PRIORITY_RANK[b] || 500));
  }, [rows]);

  const cidadeOptions = useMemo(() => uniqueValues(rows, 'Cidade'), [rows]);
  const estadoOptions = useMemo(() => uniqueValues(rows, 'Estado'), [rows]);

  const dateRange = useMemo(
    () => resolveDateRange(datePreset, dateStart, dateEnd),
    [datePreset, dateStart, dateEnd],
  );

  const filteredRows = useMemo(() => {
    let out = rows;
    if (filterPriority) out = out.filter((r) => r.labels.some((l) => l.name === filterPriority));
    if (filterStatus) out = out.filter((r) => r.listId === filterStatus);
    if (filterCidade) out = out.filter((r) => (r.fields.Cidade?.value || '') === filterCidade);
    if (filterEstado) out = out.filter((r) => (r.fields.Estado?.value || '') === filterEstado);
    if (searchOs.trim()) {
      const q = searchOs.trim().toLowerCase();
      out = out.filter((r) => (r.fields['OS Nº']?.value || '').toLowerCase().includes(q));
    }
    if (searchCliente.trim()) {
      const q = searchCliente.trim().toLowerCase();
      out = out.filter((r) => {
        const cli = (
          r.fields.Cliente?.value ||
          r.fields['Nome Do Posto']?.value ||
          ''
        ).toLowerCase();
        return cli.includes(q) || (r.name || '').toLowerCase().includes(q);
      });
    }
    const [start, end] = dateRange;
    if (start || end) {
      out = out.filter((r) => {
        const t = resolveCardDate(r);
        if (t == null) return false;
        if (start && t < start.getTime()) return false;
        if (end && t > end.getTime()) return false;
        return true;
      });
    }
    return [...out].sort((a, b) => rankForLabels(a.labels) - rankForLabels(b.labels));
  }, [rows, filterPriority, filterCidade, filterEstado, searchOs, searchCliente, dateRange]);

  // Group filtered rows by list, ordered by list position.
  const grouped = useMemo(() => {
    const map = new Map();
    boardLists.forEach((l) => map.set(l.id, { list: l, rows: [] }));
    filteredRows.forEach((r) => {
      if (map.has(r.listId)) map.get(r.listId).rows.push(r);
    });
    return [...map.values()].sort((a, b) => a.list.position - b.list.position);
  }, [filteredRows, boardLists]);

  const handleOpenCard = (cardId) => () => {
    navigate(Paths.CARDS.replace(':id', cardId));
  };

  const handleRename = (cardId) => (newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed) return;
    dispatch(entryActions.updateCard(cardId, { name: trimmed }));
  };

  const handleMoveList = (cardId) => (listId) => {
    if (!listId) return;
    dispatch(entryActions.moveCard(cardId, listId, 0));
  };

  const handleChangePriority = (cardId, currentLabels) => (labelName) => {
    currentLabels.forEach((l) => {
      dispatch(entryActions.removeLabelFromCard(l.id, cardId));
    });
    if (labelName) {
      const label = boardLabels.find((l) => l.name === labelName);
      if (label) dispatch(entryActions.addLabelToCard(label.id, cardId));
    }
  };

  const handleChangeField = (cardId, fieldEntry) => (newValue) => {
    if (!fieldEntry?.groupId || !fieldEntry?.fieldId) return;
    dispatch(
      entryActions.updateCustomFieldValue(cardId, fieldEntry.groupId, fieldEntry.fieldId, {
        content: newValue,
      }),
    );
  };

  // Auto-scroll while dragging near the top/bottom viewport edges.
  const wrapperRef = useRef(null);
  const scrollRafRef = useRef(null);
  const scrollSpeedRef = useRef(0);

  // Walk up the DOM from the wrapper to find the actual scrolling ancestor.
  const findScrollContainer = () => {
    let el = wrapperRef.current;
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);
      const oy = style.overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) {
        return el;
      }
      el = el.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  };

  const stopAutoScroll = () => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
    scrollSpeedRef.current = 0;
  };

  const tickAutoScroll = () => {
    if (scrollSpeedRef.current === 0) {
      scrollRafRef.current = null;
      return;
    }
    const target = findScrollContainer();
    if (target) target.scrollTop += scrollSpeedRef.current;
    scrollRafRef.current = requestAnimationFrame(tickAutoScroll);
  };

  const handleDragStart = (cardId) => (e) => {
    setDraggingCardId(cardId);
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingCardId(null);
    setDragOverListId(null);
    stopAutoScroll();
  };

  // Document-level drag tracking for auto-scroll.
  useEffect(() => {
    if (!draggingCardId) return undefined;

    const onDragOverDoc = (e) => {
      const EDGE = 80; // px from edge to trigger scroll
      const MAX_SPEED = 18;
      const vh = window.innerHeight;
      const y = e.clientY;

      let speed = 0;
      if (y < EDGE) {
        speed = -Math.ceil(((EDGE - y) / EDGE) * MAX_SPEED);
      } else if (y > vh - EDGE) {
        speed = Math.ceil(((y - (vh - EDGE)) / EDGE) * MAX_SPEED);
      }

      scrollSpeedRef.current = speed;
      if (speed !== 0 && !scrollRafRef.current) {
        scrollRafRef.current = requestAnimationFrame(tickAutoScroll);
      }
    };

    const onDropDoc = () => stopAutoScroll();

    document.addEventListener('dragover', onDragOverDoc);
    document.addEventListener('drop', onDropDoc);
    document.addEventListener('dragend', onDropDoc);

    return () => {
      document.removeEventListener('dragover', onDragOverDoc);
      document.removeEventListener('drop', onDropDoc);
      document.removeEventListener('dragend', onDropDoc);
      stopAutoScroll();
    };
  }, [draggingCardId]);

  const handleSectionDragOver = (listId) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverListId !== listId) setDragOverListId(listId);
  };

  const handleSectionDrop = (listId) => (e) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain') || draggingCardId;
    setDraggingCardId(null);
    setDragOverListId(null);
    if (cardId) dispatch(entryActions.moveCard(cardId, listId, 0));
  };

  const hasActiveFilter =
    filterPriority ||
    filterStatus ||
    filterCidade ||
    filterEstado ||
    searchOs ||
    searchCliente ||
    datePreset;
  const clearFilters = () => {
    setFilterPriority('');
    setFilterStatus('');
    setFilterCidade('');
    setFilterEstado('');
    setSearchOs('');
    setSearchCliente('');
    setDatePreset('');
    setDateStart('');
    setDateEnd('');
  };

  if (rows.length === 0) {
    return <div className={styles.empty}>{t('common.noCards', 'Nenhum card encontrado.')}</div>;
  }

  const listOptions = boardLists.map((l) => ({ value: l.id, label: l.name }));
  const priorityLabelOptions = boardLabels
    .slice()
    .sort((a, b) => (PRIORITY_RANK[a.name] || 500) - (PRIORITY_RANK[b.name] || 500))
    .map((l) => ({ value: l.name, label: l.name }));

  const totalColumns = 4 + (hasAnyLabel ? 1 : 0) + columns.length;

  const renderRow = (row, idx, ownerListId) => (
    <tr
      key={row.id}
      className={`${styles.row} ${draggingCardId === row.id ? styles.rowDragging : ''} ${
        styles[priorityClassFor(row.labels)] || ''
      } ${dragOverListId === ownerListId && draggingCardId ? styles.rowDropTarget : ''}`}
      draggable
      onDragStart={handleDragStart(row.id)}
      onDragEnd={handleDragEnd}
      onDragOver={ownerListId ? handleSectionDragOver(ownerListId) : undefined}
      onDragLeave={() => setDragOverListId(null)}
      onDrop={ownerListId ? handleSectionDrop(ownerListId) : undefined}
    >
      <td className={styles.rowNum}>
        <span className={styles.dragHandle} title="Arraste para mover">⋮⋮</span>
        {idx + 1}
      </td>
      <td className={styles.cellAction}>
        <button
          type="button"
          className={styles.openBtn}
          onClick={handleOpenCard(row.id)}
          title="Abrir card"
        >
          ↗
        </button>
      </td>
      <EditableTextCell
        value={row.name}
        onSave={handleRename(row.id)}
        className={styles.cellBold}
      />
      <EditableSelectCell
        value={row.listId || ''}
        options={listOptions}
        onSave={handleMoveList(row.id)}
        className={styles.cell}
        renderDisplay={() => row.listName || <span className={styles.placeholder}>—</span>}
      />
      {hasAnyLabel && (
        <EditableSelectCell
          value={row.labels[0]?.name || ''}
          options={priorityLabelOptions}
          onSave={handleChangePriority(row.id, row.labels)}
          className={styles.cell}
          renderDisplay={() =>
            row.labels.length > 0 ? (
              row.labels.map((lbl) => (
                <span
                  key={lbl.id}
                  className={`${styles.labelPill} ${styles[`color-${lbl.color}`] || ''}`}
                >
                  {lbl.name}
                </span>
              ))
            ) : (
              <span className={styles.placeholder}>—</span>
            )
          }
        />
      )}
      {columns.map((col) => {
        const entry = row.fields[col.key] || { value: '' };
        const value = entry.value || '';
        const isBoolean =
          col.name === 'Garantia' ||
          col.name.startsWith('Tem ') ||
          col.name === 'Troca de Óleo';
        const isLong = col.name === 'Motivo do Chamado' || col.name === 'Observações';

        if (isBoolean) {
          return (
            <EditableSelectCell
              key={col.key}
              value={value}
              options={[
                { value: 'Sim', label: 'Sim' },
                { value: 'Não', label: 'Não' },
              ]}
              onSave={handleChangeField(row.id, entry)}
              className={styles.cell}
            />
          );
        }

        return (
          <EditableTextCell
            key={col.key}
            value={value}
            multiline={isLong}
            onSave={handleChangeField(row.id, entry)}
            className={isLong ? styles.cellWrap : styles.cell}
          />
        );
      })}
    </tr>
  );

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.filterBar}>
        {hasOs && (
          <div className={styles.filter}>
            <label>Buscar OS Nº</label>
            <input
              type="search"
              className={styles.searchInput}
              value={searchOs}
              onChange={(e) => setSearchOs(e.target.value)}
              placeholder="Número da OS..."
            />
          </div>
        )}
        {hasCliente && (
          <div className={styles.filter}>
            <label>Buscar Cliente</label>
            <input
              type="search"
              className={styles.searchInput}
              value={searchCliente}
              onChange={(e) => setSearchCliente(e.target.value)}
              placeholder="Nome do cliente..."
            />
          </div>
        )}
        <div className={styles.filter}>
          <label>Período</label>
          <select value={datePreset} onChange={(e) => setDatePreset(e.target.value)}>
            {DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        {datePreset === 'custom' && (
          <>
            <div className={styles.filter}>
              <label>De</label>
              <input
                type="date"
                className={styles.searchInput}
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
            </div>
            <div className={styles.filter}>
              <label>Até</label>
              <input
                type="date"
                className={styles.searchInput}
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>
          </>
        )}
        {hasAnyLabel && priorityOptions.length > 0 && (
          <div className={styles.filter}>
            <label>Prioridade</label>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="">Todas</option>
              {priorityOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        )}
        {!hasAnyLabel && boardLists.length > 0 && (
          <div className={styles.filter}>
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Todos</option>
              {boardLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {hasCidade && cidadeOptions.length > 0 && (
          <div className={styles.filter}>
            <label>Cidade</label>
            <select value={filterCidade} onChange={(e) => setFilterCidade(e.target.value)}>
              <option value="">Todas</option>
              {cidadeOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
        {hasEstado && estadoOptions.length > 0 && (
          <div className={styles.filter}>
            <label>Estado</label>
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
              <option value="">Todos</option>
              {estadoOptions.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        )}
        {hasActiveFilter && (
          <button type="button" className={styles.clearBtn} onClick={clearFilters}>
            Limpar filtros
          </button>
        )}
        <div className={styles.rowCount}>
          {filteredRows.length} de {rows.length} chamados
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.headerCell}>#</th>
            <th className={styles.headerCell}></th>
            <th className={styles.headerCell}>Card</th>
            <th className={styles.headerCell}>Lista</th>
            {hasAnyLabel && <th className={styles.headerCell}>Prioridade</th>}
            {columns.map((col) => (
              <th key={col.key} className={styles.headerCell}>
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grouped.map(({ list, rows: listRows }) => {
            const isDropTarget = dragOverListId === list.id && draggingCardId;
            return (
              <React.Fragment key={list.id}>
                <tr
                  className={`${styles.groupHeader} ${isDropTarget ? styles.dropTarget : ''}`}
                  onDragOver={handleSectionDragOver(list.id)}
                  onDragLeave={() => setDragOverListId(null)}
                  onDrop={handleSectionDrop(list.id)}
                >
                  <td className={styles.groupHeaderCell} colSpan={totalColumns}>
                    <span className={styles.groupName}>{list.name}</span>
                    <span className={styles.groupCount}>
                      {listRows.length} {listRows.length === 1 ? 'card' : 'cards'}
                    </span>
                    {isDropTarget && <span className={styles.dropHint}>Soltar aqui</span>}
                  </td>
                </tr>
                {listRows.length === 0 ? (
                  <tr
                    className={`${styles.emptyGroupRow} ${isDropTarget ? styles.dropTarget : ''}`}
                    onDragOver={handleSectionDragOver(list.id)}
                    onDragLeave={() => setDragOverListId(null)}
                    onDrop={handleSectionDrop(list.id)}
                  >
                    <td colSpan={totalColumns} className={styles.emptyGroupCell}>
                      Nenhum card nesta lista
                    </td>
                  </tr>
                ) : (
                  listRows.map((row, idx) => renderRow(row, idx, list.id))
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

TableView.propTypes = {
  cardIds: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  isCardsFetching: PropTypes.bool,
  isAllCardsFetched: PropTypes.bool,
  onCardsFetch: PropTypes.func,
  onCardCreate: PropTypes.func,
  onCardPaste: PropTypes.func,
};

TableView.defaultProps = {
  isCardsFetching: undefined,
  isAllCardsFetched: undefined,
  onCardsFetch: undefined,
  onCardCreate: undefined,
  onCardPaste: undefined,
};

export default TableView;
