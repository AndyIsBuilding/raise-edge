import { HandRange, PositionName, TableSize, Card } from '../types';
// Import the strategy data statically to avoid importing database code in the browser
import gtoStrategyData from '../data/strategies/gto.json';

// Get the card name in the format used in the strategy database (e.g., "AKs")
const getHandName = (cards: Card[]): string => {
  if (cards.length !== 2) return '';
  
  // Sort cards by rank (higher first)
  const sortedCards = [...cards].sort((a, b) => {
    // Get numeric values for ranks
    const rankValues: Record<string, number> = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
      '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    
    return rankValues[b.rank] - rankValues[a.rank];
  });
  
  const [card1, card2] = sortedCards;
  const isSuited = card1.suit === card2.suit;
  
  // For pairs
  if (card1.rank === card2.rank) {
    const result = `${card1.rank}${card2.rank}`;

    return result;
  }
  
  // For suited/offsuit hands
  const result = `${card1.rank}${card2.rank}${isSuited ? 's' : 'o'}`;

  return result;
};

// Strategy evaluator for determining correct decisions
export const strategyEvaluator = {
  // Get strategy data
  getStrategyData() {
    return gtoStrategyData;
  },

  // Get range data for a strategy
  getRangeData(strategyName: string = 'GTO'): Record<string, HandRange> {
    // Make strategy name comparison case-insensitive
    const normalizedStrategyName = strategyName.toUpperCase();
    
    // For GTO strategy, access it directly
    if (normalizedStrategyName === 'GTO') {

      
      // Check if we have the expected structure
      if (!gtoStrategyData.ranges || !gtoStrategyData.ranges.GTO || !gtoStrategyData.ranges.GTO.hands) {
        console.error('DEBUG getRangeData - Missing expected structure in strategy data');
        return {};
      }
      
      const rangeData = gtoStrategyData.ranges.GTO.hands as unknown as Record<string, HandRange>;

      
      // Use type assertion to handle the type compatibility
      return rangeData;
    }
    
    // For other strategies, safely return an empty object if not found
    return {};
  },

  // Get positions for a table size
  getPositions(tableSize: TableSize) {
    const key = tableSize === 6 ? "6handed" : "8handed";
    const positions = gtoStrategyData.positions[key] || [];
    return positions;
  },

  // Get hand range data for a specific hand
  getHandRange(handName: string, strategyName: string = 'GTO'): HandRange | undefined {
    const ranges = this.getRangeData(strategyName);
    
    
    return ranges[handName];
  },

  // Evaluate if a hand should be raised from a specific position
  evaluateRaiseDecision(handName: string, position: PositionName, tableSize: TableSize, strategyName: string = 'GTO'): boolean {
    
    // Skip evaluation for BB and SB positions since they can't be first to enter in a raise-first-in strategy
    if (position === 'BB' || position === 'SB') {
      return false; // Default to fold for these positions in a first-in strategy
    }
  
    
    const handRange = this.getHandRange(handName, strategyName);
    
    if (!handRange) {
      return false; // If hand not found in strategy, default to fold
    }
    
    // If the hand should never be raised, return false
    if (!handRange.raise) {
      return false;
    }
    
    // Get the earliest position to raise from
    const earliestPosition = tableSize === 6 
      ? handRange.earliestPosition6max 
      : handRange.earliestPosition8max;
    
      
    if (!earliestPosition) {
      return false; // If no earliest position defined, default to fold
    }
    
    // Handle positions - make sure we're only using valid position names
    // Type assertion to handle string type from JSON
    const validPosition = earliestPosition as PositionName;
    
    // Get position indices
    const positions = this.getPositions(tableSize);
    
    const earliestPosIndex = positions.findIndex(pos => pos.name === validPosition);
    const currentPosIndex = positions.findIndex(pos => pos.name === position);
    
    if (earliestPosIndex === -1 || currentPosIndex === -1) {
      return false; // Invalid position, default to fold
    }
    
    // IMPORTANT: In poker position indexes, HIGHER index = LATER position (better position)
    // If current position is equal to or later than the earliest position to raise, return true
    const result = currentPosIndex >= earliestPosIndex;
    return result;
  },
  
  // Get the earliest position to raise from for a hand
  getEarliestPosition(handName: string, tableSize: TableSize, strategyName: string = 'GTO'): PositionName | null {
    const handRange = this.getHandRange(handName, strategyName);
    
    if (!handRange || !handRange.raise) {
      return null; // If hand not found or should never be raised, return null
    }
    
    const position = tableSize === 6 
      ? handRange.earliestPosition6max 
      : handRange.earliestPosition8max;
    
    // If null, return null
    if (!position) {
      return null;
    }
    
    // Return the position name as a valid PositionName (using type assertion)
    return position as PositionName;
  },
  
  // Calculate how correct a position selection is (0.0 to 1.0)
  calculatePositionCorrectness(handName: string, selectedPosition: PositionName | null, tableSize: TableSize, strategyName: string = 'GTO'): number {
    // Skip evaluation for BB and SB positions in selected position
    if (selectedPosition === 'BB' || selectedPosition === 'SB') {
      return 0.0; // Mark as incorrect since these positions shouldn't be selected in a first-in strategy
    }
    
    const correctPosition = this.getEarliestPosition(handName, tableSize, strategyName);
    
    // If the hand should be folded
    if (!correctPosition) {
      return selectedPosition === null ? 1.0 : 0.0;
    }
    
    // If the player says to fold (selects "Never")
    if (selectedPosition === null) {
      return 0.0;
    }
    
    // Handle position comparison directly with the selected position
    // Use the position names as they are in the code
    const positions = this.getPositions(tableSize);
    const correctIndex = positions.findIndex(pos => pos.name === correctPosition);
    const selectedIndex = positions.findIndex(pos => pos.name === selectedPosition);
    
    
    if (correctIndex === -1 || selectedIndex === -1) {
      return 0.0; // Invalid position
    }
    
    if (correctIndex === selectedIndex) {
      return 1.0; // Exactly correct
    }
    
    // Calculate how far off the selection was
    const positionDiff = Math.abs(correctIndex - selectedIndex);
    const maxDiff = positions.length - 1; // Maximum possible difference
    const score = Math.max(0, 1 - (positionDiff / maxDiff));
    
    return score;
  }
};

// The function that GameSession.tsx is trying to import
export const evaluateDecision = ({
  hand,
  position,
  tableSize,
  strategyName,
  decision
}: {
  hand: Card[];
  position: PositionName;
  tableSize: TableSize;
  strategyName: string;
  decision: {
    raiseDecision: boolean;
    earliestPosition: PositionName | null;
  };
}) => {
  
  // Convert cards to hand name for debugging, but don't use it for logic yet
  const handName = getHandName(hand);
  
  // Skip evaluation for BB and SB positions since they can't be first to enter in a raise-first-in strategy
  if (position === 'BB' || position === 'SB') {
    
    // For a raise-first-in strategy, any decision in BB/SB is considered correct
    // The user is expected to know these positions are not evaluated
    return {
      isCorrect: true, // Always mark as correct since these positions aren't evaluated
      partiallyCorrect: false,
      correctAnswer: {
        raiseDecision: false, // Default to fold for these positions in a first-in strategy
        earliestPosition: null
      },
      message: `The ${position} position is not evaluated in a raise-first-in strategy.`
    };
  }

  
  // Get correct answer from strategy
  const shouldRaise = strategyEvaluator.evaluateRaiseDecision(handName, position, tableSize, strategyName);
  const correctEarliestPosition = strategyEvaluator.getEarliestPosition(handName, tableSize, strategyName);
  
  // Evaluate raise/fold decision
  const isRaiseDecisionCorrect = decision.raiseDecision === shouldRaise;
  
  // Evaluate position selection - for both raise and fold decisions
  const positionCorrectness = strategyEvaluator.calculatePositionCorrectness(
    handName, 
    decision.earliestPosition, 
    tableSize, 
    strategyName
  );
  
  // If the raise/fold decision is incorrect, overall is incorrect regardless of position
  if (!isRaiseDecisionCorrect) {
    return {
      isCorrect: false,
      partiallyCorrect: false,
      correctAnswer: {
        raiseDecision: shouldRaise,
        earliestPosition: correctEarliestPosition
      }
    };
  }
  
  // Both raise/fold decision and position must be correct (or very close)
  const isPositionCorrect = positionCorrectness > 0.9; // Allow for some leeway
  const isPartiallyCorrect = positionCorrectness > 0.5; // If somewhat close
  
  
  return {
    isCorrect: isPositionCorrect,
    partiallyCorrect: isPartiallyCorrect && !isPositionCorrect,
    correctAnswer: {
      raiseDecision: shouldRaise,
      earliestPosition: correctEarliestPosition
    }
  };
};

export default strategyEvaluator; 