import { HandDecision } from '../utils/session';

// Card Types
export type Suit = 'h' | 'd' | 'c' | 's'; // hearts, diamonds, clubs, spades
export type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
export type HandType = 'pair' | 'suited' | 'offsuit';

export interface Card {
  rank: Rank;
  suit: Suit;
  value: number; // Numeric value of the card (2-14, where 14 is Ace)
}

export interface Hand {
  card1: Card;
  card2: Card;
  handName?: string; // e.g., "AKs", "JTs", "76o"
}

// Position Types
export type PositionName = 'UTG' | 'UTG1' | 'UTG2' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type TableSize = 6 | 8;

export interface Position {
  id: number;
  name: PositionName;
  displayName: string;
  orderIndex: number;
  tableSize: TableSize;
  description: string;
}

// Decision Types
export type Decision = 'raise' | 'fold';

// Strategy Types
export interface Strategy {
  id: number;
  name: string;
  description: string;
  author: string;
  createdDate: string;
}

export interface HandRange {
  raise: boolean;
  earliestPosition8max: PositionName | null;
  earliestPosition6max: PositionName | null;
}

export interface RangeData {
  [handName: string]: HandRange;
}

export interface StrategyData {
  strategies: Strategy[];
  positions: {
    '8handed': Position[];
    '6handed': Position[];
  };
  hands: {
    id: number;
    handName: string;
    card1Rank: Rank;
    card1Suit: Suit;
    card2Rank: Rank;
    card2Suit: Suit;
    handType: HandType;
  }[];
  ranges: {
    [strategyName: string]: {
      hands: RangeData;
    };
  };
}

// Session Types
export interface SessionData {
  date: string;
  strategyName: string;
  tableSize: number;
  score: {
    total: number;
    correct: number;
  };
  handDecisions: HandDecision[];
  raisePercentage?: number;
}

export interface HandRecord {
  id?: number;
  sessionId?: number;
  handName: string;
  position: PositionName;
  raiseDecision: boolean;
  correctRaiseDecision: boolean;
  earliestPosition: PositionName | null;
  correctEarliestPosition: PositionName | null;
  positionCorrectness: number;
}

// Game State Types
export interface GameState {
  tableSize: TableSize;
  buttonPosition: number;
  currentPosition: number;
  currentHand: Hand | null;
  handHistory: HandRecord[];
  sessionStats: SessionData;
}

// Player Notes Types
export type NoteColor = 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'orange' | 'gray' | 'black';

export interface PlayerNote {
  id?: number;
  username: string;
  note?: string;
  color: NoteColor;
  vpip_pfr?: string;
  created_at?: string;
  updated_at?: string;
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
} 