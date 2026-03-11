import React from 'react';
import { Group, Text, Label, Tag } from 'react-konva';
import { Action, Player, ViewMode } from '../../types';

interface DanmakuLayerProps {
  actions: Action[];
  entities: any[]; // Using any[] to match usage in TacticsBoard
  viewMode?: ViewMode;
  isPlaying: boolean;
  animationProgress: number; // 0 to 1
}

const DanmakuLayer: React.FC<DanmakuLayerProps> = ({ 
  actions, 
  entities, 
  isPlaying
}) => {
  // Only show labels during animation if intended, or always if they are static descriptions
  // The user requirement says "During animation process...". So maybe only when isPlaying?
  // But useful for debugging to see them always, let's keep it conditional on `isPlaying` for now as requested.
  // Actually, let's show them if there is an active action.
  
  if (!isPlaying) return null;

  const players = entities.filter(e => e.type === 'player') as Player[];

  // Filter actions that have labels
  // And also actions that are "active" for the current player?
  // Since `actions` usually contains all actions for the step.
  const labeledActions = actions.filter(a => a.label && a.label.trim() !== '');

  return (
    <Group>
      {labeledActions.map(action => {
        const player = players.find(p => p.id === action.playerId);
        if (!player) return null;

        // 1. Player-Anchored Narrative: Text "tied" to the player
        // Position: Side-Top relative to player
        // Player is at player.position.x, player.position.y (Center of player circle)
        
        // Calculate offset (e.g. Top-Right)
        const offsetDistance = 20; 
        const labelX = player.position.x + offsetDistance;
        const labelY = player.position.y - offsetDistance;

        // High-contrast subtitle card + type accent
        let tagBorderColor = 'rgba(120, 170, 255, 0.9)';
        let textColor = '#f7fbff';

        // Example Logic based on keywords or types
        if (action.type === 'screen') {
          tagBorderColor = 'rgba(255, 214, 102, 0.95)';
        } else if (action.type === 'move') {
             // Check label for "Cut"
             if (action.label?.toLowerCase().includes('cut')) {
             tagBorderColor = 'rgba(82, 196, 26, 0.95)';
             } else {
             tagBorderColor = 'rgba(58, 170, 255, 0.95)';
             }
        } else if (action.type === 'shoot') {
           tagBorderColor = 'rgba(255, 109, 109, 0.95)';
        }

        return (
          <Label 
            key={`danmaku-${action.id}`} 
            x={labelX} 
            y={labelY}
            opacity={0.9}
          >
            <Tag
              fill="rgba(8, 14, 24, 0.92)"
              stroke={tagBorderColor}
              strokeWidth={1.2}
              pointerDirection="down-left"
              pointerWidth={8}
              pointerHeight={8}
              lineJoin="round"
              shadowColor="black"
              shadowBlur={3}
              shadowOffset={{ x: 1, y: 1 }}
              shadowOpacity={0.4}
              cornerRadius={5}
            />
            <Text
              text={action.label}
              fontSize={15}
              fontStyle="700"
              fontFamily="Arial"
              padding={7}
              fill={textColor}
              stroke="rgba(0,0,0,0.9)"
              strokeWidth={0.9}
              shadowColor="rgba(0,0,0,0.85)"
              shadowBlur={2}
              shadowOffset={{ x: 0.6, y: 0.6 }}
            />
          </Label>
        );
      })}
    </Group>
  );
};

export default DanmakuLayer;
