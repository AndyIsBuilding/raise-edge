import React, { useState } from 'react';
import { PositionName, TableSize } from '../types';
import { getPositionsForTableSize } from '../utils/position';

interface DecisionControlsProps {
  tableSize: TableSize;
  onSubmit: (decision: {
    raiseDecision: boolean;
    earliestPosition: PositionName | null;
  }) => void;
  disabled?: boolean;
  className?: string;
  // New props for feedback and result mode
  showResults?: boolean;
  feedback?: string | null;
  isCorrect?: boolean | null;
  correctAnswer?: {
    raiseDecision: boolean;
    earliestPosition: PositionName | null;
  } | null;
  onNextHand?: () => void;
  // Optional initial values for controlled component mode
  initialRaiseDecision?: boolean | null;
  initialEarliestPosition?: PositionName | null;
}

const DecisionControls: React.FC<DecisionControlsProps> = ({
  tableSize,
  onSubmit,
  disabled = false,
  className = '',
  showResults = false,
  feedback = null,
  isCorrect = null,
  correctAnswer = null,
  onNextHand = () => {},
  initialRaiseDecision = null,
  initialEarliestPosition = null,
}) => {
  // Get positions for the table size (excluding SB and BB which are not valid raise positions)
  const positions = getPositionsForTableSize(tableSize)
    .filter(pos => pos.name !== 'SB' && pos.name !== 'BB');
  
  // State for user decisions
  const [raiseDecision, setRaiseDecision] = useState<boolean | null>(initialRaiseDecision);
  const [earliestPosition, setEarliestPosition] = useState<PositionName | null>(initialEarliestPosition);
  
  // Handle raise/fold button click
  const handleRaiseClick = () => {
    if (showResults) return;
    setRaiseDecision(true);
  };
  
  const handleFoldClick = () => {
    if (showResults) return;
    setRaiseDecision(false);
  };
  
  // Handle position selection
  const handlePositionClick = (position: PositionName) => {
    if (showResults) return;
    setEarliestPosition(position);
  };
  
  // Handle "Never" selection
  const handleNeverClick = () => {
    if (showResults) return;
    setEarliestPosition(null);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showResults) {
      onNextHand();
      return;
    }
    
    if (raiseDecision === null) {
      alert('Please select Raise or Fold');
      return;
    }
    
    if (earliestPosition === null && raiseDecision === true) {
      alert('Please select the earliest position to raise from or "Never"');
      return;
    }
    
    onSubmit({
      raiseDecision,
      earliestPosition,
    });
  };
  
  return (
    <div className={`glass-container p-3 sm:p-6 rounded-lg ${className}`}>
      <form onSubmit={handleSubmit} className="min-h-[200px] flex flex-col">
        {/* Decision section with fixed height */}
        <div className="mb-3 sm:mb-6">
          <label className="block text-zinc-200 font-bold mb-2 sm:mb-4 text-base sm:text-lg">
            Would you raise or fold this hand?
          </label>
          <div className="flex space-x-3 sm:space-x-4 justify-center">
            <button
              type="button"
              onClick={handleRaiseClick}
              className={`w-24 sm:w-28 md:w-36 px-3 sm:px-4 py-2 sm:py-3 rounded-md font-bold transition-colors text-sm sm:text-base ${
                raiseDecision === true
                  ? 'bg-emerald-600 text-white'
                  : 'button-secondary'
              } ${showResults && 'opacity-60'}`}
              disabled={disabled || showResults}
            >
              Raise
            </button>
            <button
              type="button"
              onClick={handleFoldClick}
              className={`w-24 sm:w-28 md:w-36 px-3 sm:px-4 py-2 sm:py-3 rounded-md font-bold transition-colors text-sm sm:text-base ${
                raiseDecision === false
                  ? 'bg-red-700 text-white'
                  : 'button-secondary'
              } ${showResults && 'opacity-60'}`}
              disabled={disabled || showResults}
            >
              Fold
            </button>
          </div>
        </div>
        
        {/* Position selection with buttons - always visible */}
        <div className="mb-2">
          <label className="block text-zinc-200 font-bold mb-2 sm:mb-3 text-sm sm:text-base">
            What's the earliest position you would raise this hand from?
          </label>
          <div className="flex flex-wrap gap-1 sm:gap-2 justify-center mb-1 sm:mb-2">
            <button
              type="button"
              onClick={handleNeverClick}
              className={`px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                earliestPosition === null
                  ? 'bg-red-700 text-white'
                  : 'button-secondary'
              } ${showResults && 'opacity-60'}`}
              title="This hand should never be raised from any position"
              disabled={disabled || showResults}
            >
              Never
            </button>
            {positions.map((position) => (
              <button
                key={position.id}
                type="button"
                onClick={() => handlePositionClick(position.name)}
                className={`px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  earliestPosition === position.name
                    ? 'button-accent'
                    : 'button-secondary'
                } ${showResults && 'opacity-60'}`}
                title={position.description}
                disabled={disabled || showResults}
              >
                {position.displayName}
              </button>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 text-center">
            SB and BB positions are not evaluated.
          </p>
        </div>
        
        {/* Fixed-height result feedback area */}
        <div className="h-[70px] sm:h-[80px] mb-3 sm:mb-4">
          {showResults && feedback && (
            <div>
              <h3 className={`text-sm sm:text-base font-bold mb-1 ${
                isCorrect ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {feedback}
              </h3>
              
              {!isCorrect && correctAnswer && (
                <div>
                  <p className="text-xs sm:text-sm text-zinc-200">
                    <span className="font-medium text-zinc-300">Optimal play: </span>
                    {correctAnswer.raiseDecision 
                      ? `Raise from ${correctAnswer.earliestPosition} or later` 
                      : correctAnswer.earliestPosition 
                        ? `Fold this hand, but could raise from ${correctAnswer.earliestPosition} or later`
                        : 'Fold this hand, should never be raised'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Submit or Next Hand button - always at the bottom of the form */}
        <div className="mt-auto">
          <button
            type="submit"
            className="button-primary w-full py-2 sm:py-3 px-3 sm:px-4 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              disabled ||
              (!showResults && raiseDecision === null)
            }
          >
            {showResults ? 'Next Hand' : 'Submit Decision'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DecisionControls; 