import React, { useState, useEffect, useCallback } from 'react';
import { Card, PositionName, TableSize } from '../types';
import { createDeck, shuffleDeck, getHandName } from '../utils/card';
import { evaluateDecision } from '../lib/strategyEvaluator';
import { sessionStorage, HandDecision } from '../utils/session';
import Table from './Table';
import DecisionControls from './DecisionControls';

interface GameSessionProps {
  tableSize: TableSize;
  strategyName: string;
  className?: string;
  onEndSession: () => void;
}

// Score feedback messages
const FEEDBACK = {
  correct: 'Correct! This is the optimal play.',
  partiallyCorrect: 'Close! You have the right idea, but could be more specific.',
  incorrect: 'Not quite right. Let\'s see what the optimal play would be.',
};

const GameSession: React.FC<GameSessionProps> = ({
  tableSize,
  strategyName,
  className = '',
  onEndSession,
}) => {
  // Game state
  const [currentHand, setCurrentHand] = useState<Card[]>([]);
  const [heroPosition, setHeroPosition] = useState<PositionName>('BTN'); // Start at BTN position
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<{
    raiseDecision: boolean;
    earliestPosition: PositionName | null;
  } | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [score, setScore] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });
  const [userDecision, setUserDecision] = useState<{
    raiseDecision: boolean | null;
    earliestPosition: PositionName | null;
  }>({
    raiseDecision: null,
    earliestPosition: null
  });

  // Initialize session storage when component mounts
  useEffect(() => {
    sessionStorage.initSession(tableSize, strategyName);
  }, [tableSize, strategyName]);

  // Initialize the game
  const initializeGame = useCallback(() => {
    // Create and shuffle a new deck
    const newDeck = shuffleDeck(createDeck());
    
    // Deal a new hand (2 cards)
    const newHand = newDeck.slice(0, 2);
    
    // Update state
    setCurrentHand(newHand);
    setFeedback(null);
    setIsCorrect(null);
    setCorrectAnswer(null);
    setShowResults(false);
    setUserDecision({
      raiseDecision: null,
      earliestPosition: null
    });
  }, []);

  // Initialize the game when component mounts
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Handle the player's decision
  const handleDecision = (decision: {
    raiseDecision: boolean;
    earliestPosition: PositionName | null;
  }) => {
    // Save the user's decision
    setUserDecision(decision);
    
    // Evaluate the decision against the strategy
    const result = evaluateDecision({
      hand: currentHand,
      position: heroPosition,
      tableSize,
      strategyName,
      decision,
    });

    // Update score
    setScore(prev => ({
      correct: prev.correct + (result.isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    // Set feedback and correctness
    setIsCorrect(result.isCorrect);
    setCorrectAnswer(result.correctAnswer);
    
    if (result.isCorrect) {
      setFeedback(FEEDBACK.correct);
    } else if (result.partiallyCorrect) {
      setFeedback(FEEDBACK.partiallyCorrect);
    } else {
      setFeedback(FEEDBACK.incorrect);
    }
    
    setShowResults(true);
    
    // Store the decision in session storage
    const handDecision: HandDecision = {
      hand: currentHand,
      handName: getHandName(currentHand),
      position: heroPosition,
      userDecision: decision,
      correctAnswer: result.correctAnswer,
      isCorrect: result.isCorrect,
      partiallyCorrect: result.partiallyCorrect,
    };
    
    sessionStorage.addHandDecision(handDecision);
  };

  // Continue to the next hand
  const handleNextHand = () => {    
    // Define the correct position rotation order (excluding SB and BB)
    let positionRotation: PositionName[];
    
    if (tableSize === 8) {
      // 8-max rotation: BTN → CO → HJ → LJ → UTG+1 → UTG → BTN
      positionRotation = ['BTN', 'CO', 'HJ', 'LJ', 'UTG1', 'UTG'];
    } else {
      // 6-max rotation: BTN → CO → HJ → LJ → BTN
      positionRotation = ['BTN', 'CO', 'HJ', 'LJ'];
    }
    
    // Find the current position in our rotation
    const currentIndex = positionRotation.findIndex(pos => pos === heroPosition);
    
    // Move to the next position in our rotation
    const nextIndex = (currentIndex + 1) % positionRotation.length;
    const nextPosition = positionRotation[nextIndex];
    
    // First set the new position to allow animation to happen
    setHeroPosition(nextPosition);
    
    // Add a small delay to allow the position animation to complete before dealing a new hand
    setTimeout(() => {
      // Deal new hand
      initializeGame();
    }, 300); // Short delay for smoother transition
  };

  // Calculate score percentage
  const scorePercentage = score.total > 0 
    ? Math.round((score.correct / score.total) * 100) 
    : 0;

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      {/* Game information */}
      <div className="glass-container p-2 sm:p-4 rounded-lg mb-2 sm:mb-6 w-full">
        <h2 className="text-sm sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 text-zinc-200 whitespace-nowrap overflow-hidden text-ellipsis">
          Raise First In (RFI): {strategyName.toUpperCase()}, {tableSize}-handed
        </h2>
        <div className="flex justify-between items-center">
          <button
            onClick={onEndSession}
            className="button-accent px-2 sm:px-3 py-1 text-xs sm:text-sm"
          >
            End Session
          </button>
          <div className="flex flex-row sm:flex-col justify-between sm:justify-start gap-2 sm:gap-4">
            <p className="text-xs sm:text-sm text-zinc-300"><span className="font-medium text-zinc-200">Score:</span> {score.correct}/{score.total}</p>
            <p className="text-xs sm:text-sm text-zinc-300"><span className="font-medium text-zinc-200">Accuracy:</span> {scorePercentage}%</p>
          </div>
        </div>
      </div>
      
      {/* Main game area with table and controls side by side on desktop */}
      <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start flex-grow w-full">
        {/* Table column */}
        <div className="lg:w-3/5 xl:w-2/3 mb-2 sm:mb-6 lg:mb-0 flex flex-col items-center">
          <Table 
            tableSize={tableSize}
            currentPosition={heroPosition}
            currentHand={currentHand}
            fixedHeroPosition={true}
            className="mb-2 sm:mb-6"
          />
        </div>
        
        {/* Controls column - fixed minimum height to prevent layout shifts */}
        <div className="lg:w-2/5 xl:w-1/3 lg:sticky lg:top-8">
          {/* Decision controls with consistent height and behavior */}
          <div className="min-h-[300px] sm:min-h-[350px]">
            <DecisionControls
              tableSize={tableSize}
              onSubmit={handleDecision}
              disabled={false}
              showResults={showResults}
              feedback={feedback}
              isCorrect={isCorrect}
              correctAnswer={correctAnswer}
              onNextHand={handleNextHand}
              initialRaiseDecision={userDecision.raiseDecision}
              initialEarliestPosition={userDecision.earliestPosition}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSession; 