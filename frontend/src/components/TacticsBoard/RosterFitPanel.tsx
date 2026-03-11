/**
 * RosterFitPanel.tsx
 * Phase 4 – Micro-View: displays live fit errors as a compact floating overlay.
 * Shows one card per FitError with: position · role · missing action · fit score.
 */

import React from 'react';
import { Tag } from 'antd';
import { WarningFilled } from '@ant-design/icons';
import { FitError } from '../../types';
import { OFFENSIVE_ROLES } from '../../config/playerRoles';
import { ATOMIC_ACTIONS } from '../../config/atomicActions';
import { suggestBetterRole } from '../../utils/rosterFit';

interface RosterFitPanelProps {
  errors: FitError[];
  players: Array<{ id: string; number: string; role?: string; playerTag?: string }>;
}

const RosterFitPanel: React.FC<RosterFitPanelProps> = ({ errors, players }) => {
  if (!errors.length) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 12,
      left: 12,
      zIndex: 900,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      maxWidth: 320,
    }}>
      {/* Header badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(245,34,45,0.12)',
        border: '1px solid rgba(245,34,45,0.35)',
        borderRadius: 8,
        padding: '5px 10px',
      }}>
        <WarningFilled style={{ color: '#ff4d4f', fontSize: 13 }} />
        <span style={{ color: '#ff7875', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
          {errors.length} ROLE MISMATCH{errors.length > 1 ? 'ES' : ''} DETECTED
        </span>
      </div>

      {/* Error cards */}
      {errors.map((err) => {
        const player = players.find((p) => p.id === err.playerId);
        const roleLabel = OFFENSIVE_ROLES[err.currentRole]?.name ?? err.currentRole;
        const actionLabel = ATOMIC_ACTIONS[err.actionTag]?.name ?? err.actionTag;
        const suggestedRole = suggestBetterRole(err.actionTag);
        const suggestedLabel = OFFENSIVE_ROLES[suggestedRole]?.name ?? suggestedRole;
        const scoreColor = err.fitScore < 15 ? '#f5222d' : '#faad14';

        return (
          <div
            key={`${err.actionId}-${err.playerId}`}
            style={{
              background: 'rgba(10,14,22,0.88)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(245,34,45,0.28)',
              borderLeft: '3px solid #f5222d',
              borderRadius: 8,
              padding: '8px 10px',
              fontFamily: 'Inter, Segoe UI, sans-serif',
            }}
          >
            {/* Player identifier */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: '#f5222d', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>
                {player?.number ?? '?'}
              </div>
              <span style={{ color: '#c0c8d8', fontSize: 11 }}>
                {player?.role ?? ''} ·{' '}
                <span style={{ color: '#fff', fontWeight: 600 }}>{roleLabel}</span>
              </span>
              <Tag style={{
                marginLeft: 'auto', margin: 0,
                background: `${scoreColor}22`, border: `1px solid ${scoreColor}55`,
                color: scoreColor, fontSize: 10, fontWeight: 700,
              }}>
                Fit {err.fitScore}%
              </Tag>
            </div>

            {/* Missing action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ color: '#6f7b95', fontSize: 10 }}>Needs:</span>
              <Tag style={{ margin: 0, background: 'rgba(245,34,45,0.12)', border: '1px solid rgba(245,34,45,0.4)', color: '#ffb3b3', fontSize: 10 }}>
                {actionLabel}
              </Tag>
              <span style={{ color: '#6f7b95', fontSize: 10 }}>→ try</span>
              <Tag style={{ margin: 0, background: 'rgba(82,196,26,0.12)', border: '1px solid rgba(82,196,26,0.4)', color: '#b7eb8f', fontSize: 10 }}>
                {suggestedLabel} ({suggestedRole})
              </Tag>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RosterFitPanel;
