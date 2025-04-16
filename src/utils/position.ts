import { Position, PositionName, TableSize } from '../types';

// Define position data for 6-handed and 8-handed tables
export const positions: {
  '6handed': Position[];
  '8handed': Position[];
} = {
  '6handed': [
    { id: 1, name: 'LJ', displayName: 'LJ', orderIndex: 1, tableSize: 6, description: "12 o'clock position" },
    { id: 2, name: 'HJ', displayName: 'HJ', orderIndex: 2, tableSize: 6, description: 'Hijack' },
    { id: 3, name: 'CO', displayName: 'CO', orderIndex: 3, tableSize: 6, description: 'Cutoff' },
    { id: 4, name: 'BTN', displayName: 'BTN', orderIndex: 4, tableSize: 6, description: "6 o'clock position" },
    { id: 5, name: 'SB', displayName: 'SB', orderIndex: 5, tableSize: 6, description: 'Small Blind' },
    { id: 6, name: 'BB', displayName: 'BB', orderIndex: 6, tableSize: 6, description: 'Big Blind' }
  ],
  '8handed': [
    { id: 7, name: 'UTG', displayName: 'UTG', orderIndex: 1, tableSize: 8, description: "12 o'clock position" },
    { id: 8, name: 'UTG1', displayName: 'UTG+1', orderIndex: 2, tableSize: 8, description: 'Under the Gun+1' },
    { id: 9, name: 'LJ', displayName: 'LJ', orderIndex: 3, tableSize: 8, description: 'Lojack' },
    { id: 10, name: 'HJ', displayName: 'HJ', orderIndex: 4, tableSize: 8, description: 'Hijack' },
    { id: 11, name: 'CO', displayName: 'CO', orderIndex: 5, tableSize: 8, description: "6 o'clock position" },
    { id: 12, name: 'BTN', displayName: 'BTN', orderIndex: 6, tableSize: 8, description: 'Button - Dealer' },
    { id: 13, name: 'SB', displayName: 'SB', orderIndex: 7, tableSize: 8, description: 'Small Blind' },
    { id: 14, name: 'BB', displayName: 'BB', orderIndex: 8, tableSize: 8, description: 'Big Blind' }
  ]
};

// Get an array of positions based on table size
export const getPositionsForTableSize = (tableSize: TableSize): Position[] => {
  return tableSize === 6 ? positions['6handed'] : positions['8handed'];
};

// Get the position object by name and table size
export const getPositionByName = (name: PositionName, tableSize: TableSize): Position | undefined => {
  const tablePositions = getPositionsForTableSize(tableSize);
  return tablePositions.find(pos => pos.name === name);
};

// Get the position name at a specific index
export const getPositionNameAtIndex = (index: number, tableSize: TableSize): PositionName => {
  const tablePositions = getPositionsForTableSize(tableSize);
  // Ensure the index is within bounds
  const normalizedIndex = ((index % tablePositions.length) + tablePositions.length) % tablePositions.length;
  return tablePositions[normalizedIndex].name;
};

// Calculate button and blinds positions
export const calculateTablePositions = (buttonIndex: number, tableSize: TableSize): {
  buttonPosition: number;
  sbPosition: number;
  bbPosition: number;
} => {
  const totalPositions = tableSize === 6 ? 6 : 8;
  
  // Normalize the button position to be within the range of positions
  const normalizedButtonIndex = ((buttonIndex % totalPositions) + totalPositions) % totalPositions;
  
  // Calculate small blind and big blind positions (clockwise from button)
  const sbPosition = (normalizedButtonIndex + 1) % totalPositions;
  const bbPosition = (normalizedButtonIndex + 2) % totalPositions;
  
  return {
    buttonPosition: normalizedButtonIndex,
    sbPosition,
    bbPosition
  };
};

// Rotate positions (move button clockwise)
export const rotatePositions = (currentButtonIndex: number, tableSize: TableSize): number => {
  const totalPositions = tableSize === 6 ? 6 : 8;
  return (currentButtonIndex + 1) % totalPositions;
};

// Calculate the position relative to the button
export const calculateRelativePosition = (position: number, buttonPosition: number, tableSize: TableSize): string => {
  const totalPositions = tableSize === 6 ? 6 : 8;
  
  // Calculate positions relative to the button
  const sbPosition = (buttonPosition + 1) % totalPositions;
  const bbPosition = (buttonPosition + 2) % totalPositions;
  
  if (position === buttonPosition) return 'BTN';
  if (position === sbPosition) return 'SB';
  if (position === bbPosition) return 'BB';
  
  // Calculate how many positions away from the button
  const positionsFromButton = (position - buttonPosition - 3 + totalPositions) % totalPositions;
  
  // Map to standard position names
  if (tableSize === 6) {
    switch (positionsFromButton) {
      case 0: return 'LJ';
      case 1: return 'HJ';
      case 2: return 'CO';
      default: return 'Unknown';
    }
  } else { // 8-handed
    switch (positionsFromButton) {
      case 0: return 'UTG';
      case 1: return 'UTG1';
      case 2: return 'LJ';
      case 3: return 'HJ';
      case 4: return 'CO';
      default: return 'Unknown';
    }
  }
};

// Compare two positions to determine which is earlier
export const isEarlierPosition = (pos1: PositionName, pos2: PositionName, tableSize: TableSize): boolean => {
  const tablePositions = getPositionsForTableSize(tableSize);
  const pos1Index = tablePositions.findIndex(pos => pos.name === pos1);
  const pos2Index = tablePositions.findIndex(pos => pos.name === pos2);
  
  if (pos1Index === -1 || pos2Index === -1) {
    throw new Error(`Invalid position name: ${pos1Index === -1 ? pos1 : pos2}`);
  }
  
  return pos1Index < pos2Index;
}; 