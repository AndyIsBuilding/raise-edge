import { HandRange, PositionName, TableSize, Card } from '../types';
// Import the strategy data statically to avoid importing database code in the browser
import gtoStrategyData from '../data/strategies/gto.json';

// Get the card name in the format used in the strategy database (e.g., "AKs")
const getHandName = (cards: Card[]): string => {
  if (cards.length !== 2) return '';
  
  console.log('DEBUG getHandName - Raw cards:', JSON.stringify(cards));
  
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
  
  console.log(`DEBUG getHandName - Sorted cards: ${card1.rank}${card1.suit}, ${card2.rank}${card2.suit}`);
  console.log(`DEBUG getHandName - isSuited: ${isSuited}`);
  
  // For pairs
  if (card1.rank === card2.rank) {
    const result = `${card1.rank}${card2.rank}`;
    console.log(`DEBUG getHandName - Pair result: ${result}`);
    return result;
  }
  
  // For suited/offsuit hands
  const result = `${card1.rank}${card2.rank}${isSuited ? 's' : 'o'}`;
  console.log(`DEBUG getHandName - Final result: ${result}`);
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
      console.log('DEBUG getRangeData - Accessing GTO strategy data');
      
      // Check if we have the expected structure
      if (!gtoStrategyData.ranges || !gtoStrategyData.ranges.GTO || !gtoStrategyData.ranges.GTO.hands) {
        console.error('DEBUG getRangeData - Missing expected structure in strategy data');
        console.log('Strategy data structure:', JSON.stringify(Object.keys(gtoStrategyData)));
        return {};
      }
      
      const rangeData = gtoStrategyData.ranges.GTO.hands as unknown as Record<string, HandRange>;
      console.log('DEBUG getRangeData - Found hand keys count:', Object.keys(rangeData).length);
      
      // Check if K8s exists in the data as a sanity check
      const hasK8s = Object.prototype.hasOwnProperty.call(rangeData, 'K8s');
      console.log('DEBUG getRangeData - K8s exists in range data?', hasK8s);
      
      // Use type assertion to handle the type compatibility
      return rangeData;
    }
    
    // For other strategies, safely return an empty object if not found
    console.log('DEBUG getRangeData - Strategy not found:', strategyName);
    return {};
  },

  // Get positions for a table size
  getPositions(tableSize: TableSize) {
    const key = tableSize === 6 ? "6handed" : "8handed";
    console.log(`Getting positions for table size ${tableSize}, using key: ${key}`);
    const positions = gtoStrategyData.positions[key] || [];
    console.log(`Found ${positions.length} positions:`, positions.map(p => `${p.name} (${p.displayName})`));
    return positions;
  },

  // Get hand range data for a specific hand
  getHandRange(handName: string, strategyName: string = 'GTO'): HandRange | undefined {
    const ranges = this.getRangeData(strategyName);
    
    // Add specific debugging for K8s
    if (handName === 'K8s') {
      console.log('DEBUG: Looking up K8s in strategy');
      console.log('Available hands in strategy:', Object.keys(ranges).filter(h => h.startsWith('K')));
      console.log('K8s exists in strategy?', Object.prototype.hasOwnProperty.call(ranges, 'K8s'));
      if (Object.prototype.hasOwnProperty.call(ranges, 'K8s')) {
        console.log('K8s data:', JSON.stringify(ranges['K8s']));
      }
    }
    
    return ranges[handName];
  },

  // Evaluate if a hand should be raised from a specific position
  evaluateRaiseDecision(handName: string, position: PositionName, tableSize: TableSize, strategyName: string = 'GTO'): boolean {
    console.log('===== EVALUATING RAISE DECISION =====');
    console.log('Hand:', handName);
    console.log('Current position:', position);
    console.log('Table size:', tableSize);
    
    // Skip evaluation for BB and SB positions since they can't be first to enter in a raise-first-in strategy
    if (position === 'BB' || position === 'SB') {
      console.log(`IMPORTANT: Skip evaluation for ${position} position - not applicable for first-in decisions`);
      return false; // Default to fold for these positions in a first-in strategy
    }
    
    // Special debugging for K8s
    if (handName === 'K8s') {
      console.log('DETAILED DEBUG FOR K8s:');
      console.log('Raw handName:', handName);
      console.log('Position being evaluated:', position);
      console.log('Table size for K8s lookup:', tableSize);
    }
    
    const handRange = this.getHandRange(handName, strategyName);
    console.log('Hand range data:', handRange);
    
    if (!handRange) {
      console.log('Decision: Fold (hand not found in strategy)');
      
      // For K8s specifically, do deep diagnostics if it wasn't found
      if (handName === 'K8s') {
        console.error('K8s was not found in strategy data - this is unexpected!');
        // Check if casing is an issue
        const ranges = this.getRangeData(strategyName);
        const allHandKeys = Object.keys(ranges);
        console.log('All hand keys starting with K:', allHandKeys.filter(key => key.startsWith('K')));
        console.log('K8s exists with exact match?', allHandKeys.includes('K8s'));
        // Check if there are any similar keys
        console.log('Similar keys to K8s:', allHandKeys.filter(key => key.toLowerCase() === 'k8s'));
      }
      
      return false; // If hand not found in strategy, default to fold
    }
    
    // If the hand should never be raised, return false
    if (!handRange.raise) {
      console.log('Decision: Fold (hand marked as not raisable)');
      return false;
    }
    
    // Get the earliest position to raise from
    const earliestPosition = tableSize === 6 
      ? handRange.earliestPosition6max 
      : handRange.earliestPosition8max;
    
    console.log('Earliest position to raise from:', earliestPosition);
    console.log('Table size for lookup:', tableSize);  
      
    if (!earliestPosition) {
      console.log('Decision: Fold (no earliest position defined)');
      return false; // If no earliest position defined, default to fold
    }
    
    // Handle positions - make sure we're only using valid position names
    // Type assertion to handle string type from JSON
    const validPosition = earliestPosition as PositionName;
    
    // Get position indices
    const positions = this.getPositions(tableSize);
    console.log('Available positions:', positions.map(p => p.name));
    
    const earliestPosIndex = positions.findIndex(pos => pos.name === validPosition);
    const currentPosIndex = positions.findIndex(pos => pos.name === position);
    
    console.log('Earliest position index:', earliestPosIndex, 'for position:', validPosition);
    console.log('Current position index:', currentPosIndex, 'for position:', position);
    
    if (earliestPosIndex === -1 || currentPosIndex === -1) {
      console.log('Decision: Fold (invalid position)');
      console.log('Position not found:', earliestPosIndex === -1 ? validPosition : position);
      return false; // Invalid position, default to fold
    }
    
    // IMPORTANT: In poker position indexes, HIGHER index = LATER position (better position)
    // If current position is equal to or later than the earliest position to raise, return true
    const result = currentPosIndex >= earliestPosIndex;
    console.log(`Decision: ${result ? 'Raise' : 'Fold'} (current position ${result ? 'is' : 'is not'} equal to or later than earliest position)`);
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
    
    // Debug specific position lookups
    if (handName === '66') {
      console.log('Position lookup for', handName, 'in', tableSize, 'max:');
      console.log('Raw position from strategy:', position);
      console.log('Position in 6max:', handRange.earliestPosition6max);
      console.log('Position in 8max:', handRange.earliestPosition8max);
    }
    
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
      console.log(`IMPORTANT: Selected position ${selectedPosition} is not applicable for first-in decisions`);
      return 0.0; // Mark as incorrect since these positions shouldn't be selected in a first-in strategy
    }
    
    const correctPosition = this.getEarliestPosition(handName, tableSize, strategyName);
    console.log('Calculate position correctness:', handName);
    console.log('Correct position:', correctPosition);
    console.log('Selected position:', selectedPosition);
    
    // If the hand should be folded
    if (!correctPosition) {
      console.log('Hand should never be raised, selected:', selectedPosition === null ? 'Never' : selectedPosition);
      return selectedPosition === null ? 1.0 : 0.0;
    }
    
    // If the player says to fold (selects "Never")
    if (selectedPosition === null) {
      console.log('User selected "Never" - incorrect because the hand can be raised');
      return 0.0;
    }
    
    // Handle position comparison directly with the selected position
    // Use the position names as they are in the code
    const positions = this.getPositions(tableSize);
    const correctIndex = positions.findIndex(pos => pos.name === correctPosition);
    const selectedIndex = positions.findIndex(pos => pos.name === selectedPosition);
    
    console.log('Position indices - correct:', correctIndex, ', selected:', selectedIndex);
    
    if (correctIndex === -1 || selectedIndex === -1) {
      console.log('Invalid position(s):', 
        correctIndex === -1 ? `Correct (${correctPosition}) not found` : '', 
        selectedIndex === -1 ? `Selected (${selectedPosition}) not found` : '');
      return 0.0; // Invalid position
    }
    
    if (correctIndex === selectedIndex) {
      console.log('Positions exactly match');
      return 1.0; // Exactly correct
    }
    
    // Calculate how far off the selection was
    const positionDiff = Math.abs(correctIndex - selectedIndex);
    const maxDiff = positions.length - 1; // Maximum possible difference
    const score = Math.max(0, 1 - (positionDiff / maxDiff));
    
    console.log(`Position difference: ${positionDiff}, max diff: ${maxDiff}, score: ${score}`);
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
  console.log('==== STARTING DECISION EVALUATION ====');
  console.log('Current position is:', position);
  
  // Convert cards to hand name for debugging, but don't use it for logic yet
  const handName = getHandName(hand);
  console.log('Debug - Hand name:', handName, 'Position:', position);
  
  // Extra check for A2o in BB - the specific case we're debugging
  if (handName === 'A2o' && position === 'BB') {
    console.log('==== FOUND A2o IN BB - SPECIAL CASE ====');
    console.log('This should be skipped as it is in BB position');
  }
  
  // Skip evaluation for BB and SB positions since they can't be first to enter in a raise-first-in strategy
  if (position === 'BB' || position === 'SB') {
    console.log(`==== SKIPPING EVALUATION FOR ${position} POSITION ====`);
    console.log(`${position} positions are not evaluated in a raise-first-in strategy`);
    
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

  // DEBUGGING: Log the hand and details
  console.log('==== DECISION EVALUATION ====');
  console.log('Hand:', handName);
  console.log('Current position:', position);
  console.log('Table size:', tableSize);
  console.log('User decision:', decision);
  console.log('Strategy name (raw):', strategyName);
  
  // Special debugging for K8s
  if (handName === 'K8s') {
    console.log('DEBUGGING K8s SPECIFICALLY:');
    console.log('Raw hand data:', JSON.stringify(hand));
    console.log('Position being evaluated:', position);
    console.log('Table size for K8s:', tableSize);
    console.log('User made raise decision?', decision.raiseDecision);
    console.log('User selected position:', decision.earliestPosition);
  }
  
  // Get hand range from the strategy
  const handRange = strategyEvaluator.getHandRange(handName, strategyName);
  console.log('Hand range data:', handRange);
  
  // Additional debugging for specific hands we're testing
  if (handName === '66') {
    console.log('DEBUGGING 66:');
    console.log('Raw data from strategy:', JSON.stringify(handRange));
    console.log('Should raise?', handRange?.raise);
    console.log('Earliest position 6max:', handRange?.earliestPosition6max);
    console.log('Earliest position 8max:', handRange?.earliestPosition8max);
  }
  
  // Get correct answer from strategy
  const shouldRaise = strategyEvaluator.evaluateRaiseDecision(handName, position, tableSize, strategyName);
  const correctEarliestPosition = strategyEvaluator.getEarliestPosition(handName, tableSize, strategyName);
  
  console.log('Should raise?', shouldRaise);
  console.log('Correct earliest position:', correctEarliestPosition);
  
  // DEBUGGING: Log positions for current table size
  const positions = strategyEvaluator.getPositions(tableSize);
  console.log('Positions for table size', tableSize, ':', positions);
  console.log('Position names:', positions.map(p => p.name));
  
  if (correctEarliestPosition) {
    const correctPosIndex = positions.findIndex(pos => pos.name === correctEarliestPosition);
    const currentPosIndex = positions.findIndex(pos => pos.name === position);
    console.log('Correct position index:', correctPosIndex, 'for position:', correctEarliestPosition);
    console.log('Current position index:', currentPosIndex, 'for position:', position);
    
    // Debug the position matching problem
    if (correctPosIndex === -1) {
      console.log('WARNING: Correct position not found in position list!');
      console.log('Available position names:', positions.map(p => p.name));
    }
  }
  
  // Evaluate raise/fold decision
  const isRaiseDecisionCorrect = decision.raiseDecision === shouldRaise;
  console.log('Is raise decision correct?', isRaiseDecisionCorrect);
  
  // Evaluate position selection - for both raise and fold decisions
  const positionCorrectness = strategyEvaluator.calculatePositionCorrectness(
    handName, 
    decision.earliestPosition, 
    tableSize, 
    strategyName
  );
  console.log('Position correctness score:', positionCorrectness);
  
  // If the raise/fold decision is incorrect, overall is incorrect regardless of position
  if (!isRaiseDecisionCorrect) {
    console.log('Final result: Incorrect (wrong raise/fold decision)');
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
  
  console.log('Is position correct?', isPositionCorrect);
  console.log('Final result:', isPositionCorrect ? 'Correct' : isPartiallyCorrect ? 'Partially correct' : 'Incorrect');
  
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