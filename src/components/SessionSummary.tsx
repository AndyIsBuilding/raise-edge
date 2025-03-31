import React from 'react';
import { SessionData, HandDecision } from '../utils/session';
import HandComponent from './Hand';

interface SessionSummaryProps {
  sessionData: SessionData;
  onStartNewSession: () => void;
  onReturnToMenu: () => void;
}

const SessionSummary: React.FC<SessionSummaryProps> = ({
  sessionData,
  onStartNewSession,
  onReturnToMenu,
}) => {
  // Format date
  const formattedDate = new Date(sessionData.date).toLocaleString();
  
  // Calculate overall stats
  const scorePercentage = sessionData.score.total > 0 
    ? Math.round((sessionData.score.correct / sessionData.score.total) * 100) 
    : 0;
  
  // Get incorrect decisions for detailed review
  const incorrectDecisions = sessionData.handDecisions.filter(
    decision => !decision.isCorrect
  );
  
  // Calculate the raise percentage if it's not already calculated
  const raisePercentage = sessionData.raisePercentage ?? 0;
  
  return (
    <div className="w-full flex flex-col">
      {/* Session summary header */}
      <div className="glass-container p-6 rounded-lg mb-6 w-full">
        <h2 className="text-2xl font-bold mb-4 text-zinc-100">
          Training Session Summary
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-800 bg-opacity-40 p-4 rounded-lg">
            <h3 className="text-zinc-400 font-medium mb-1">Strategy</h3>
            <p className="text-lg text-zinc-100">{sessionData.strategyName.toUpperCase()}, {sessionData.tableSize}-handed</p>
          </div>
          
          <div className="bg-zinc-800 bg-opacity-40 p-4 rounded-lg">
            <h3 className="text-zinc-400 font-medium mb-1">Date</h3>
            <p className="text-lg text-zinc-100">{formattedDate}</p>
          </div>
          
          <div className="bg-zinc-800 bg-opacity-40 p-4 rounded-lg">
            <h3 className="text-zinc-400 font-medium mb-1">Hands Played</h3>
            <p className="text-lg text-zinc-100">{sessionData.score.total}</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          <div className="flex-1 bg-zinc-800 bg-opacity-40 p-4 rounded-lg text-center">
            <h3 className="text-zinc-400 font-medium mb-2">Overall Score</h3>
            <div className="flex flex-col items-center">
              <p className="text-3xl font-bold text-zinc-100 mb-1">
                {sessionData.score.correct}/{sessionData.score.total}
              </p>
              <div className={`text-lg rounded-full px-4 py-1 ${
                scorePercentage >= 80 ? 'bg-green-900 text-green-100' : 
                scorePercentage >= 60 ? 'bg-yellow-800 text-yellow-100' : 
                'bg-red-900 text-red-100'
              }`}>
                {scorePercentage}% Accuracy
              </div>
            </div>
          </div>
          
          {/* Preflop Raise Percentage Statistic */}
          <div className="flex-1 bg-zinc-800 bg-opacity-40 p-4 rounded-lg text-center">
            <h3 className="text-zinc-400 font-medium mb-2">Preflop Raise %</h3>
            <div className="flex flex-col items-center">
              <p className="text-3xl font-bold text-zinc-100 mb-1">
                {raisePercentage}%
              </p>
              <div className="text-lg text-zinc-400">
                Your raising frequency
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
          <button 
            onClick={onStartNewSession}
            className="button-primary px-6"
          >
            Start New Session
          </button>
          <button 
            onClick={onReturnToMenu}
            className="button-secondary px-6"
          >
            Return to Menu
          </button>
        </div>
      </div>
      
      {/* Incorrect decisions section */}
      {incorrectDecisions.length > 0 && (
        <div className="glass-container p-6 rounded-lg mb-6 w-full">
          <h2 className="text-xl font-bold mb-4 text-zinc-100">
            Incorrect Decisions ({incorrectDecisions.length})
          </h2>
          
          <div className="space-y-6">
            {incorrectDecisions.map((decision, index) => (
              <IncorrectDecisionCard key={index} decision={decision} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Component to display an incorrect decision
const IncorrectDecisionCard: React.FC<{ decision: HandDecision }> = ({ decision }) => {
  return (
    <div className="bg-zinc-800 bg-opacity-40 p-4 rounded-lg">
      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
        <div className="flex-shrink-0">
          <HandComponent cards={decision.hand} showName={true} />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            {decision.handName} from {decision.position}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <h4 className="text-sm text-zinc-400 font-medium mb-1">Your Raise/Fold Decision</h4>
              <p className="text-zinc-200">
                {decision.userDecision.raiseDecision !== null
                  ? decision.userDecision.raiseDecision 
                    ? 'Raise' 
                    : 'Fold'
                  : 'Not specified'
                }
              </p>
            </div>
            
            <div>
              <h4 className="text-sm text-zinc-400 font-medium mb-1">Correct Raise/Fold Decision</h4>
              <p className={`font-medium ${
                decision.userDecision.raiseDecision === decision.correctAnswer.raiseDecision
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                {decision.correctAnswer.raiseDecision ? 'Raise' : 'Fold'}
              </p>
            </div>

            <div>
              <h4 className="text-sm text-zinc-400 font-medium mb-1">Earliest Raise Position Decision</h4>
              <p className="text-zinc-200">
                {decision.userDecision.earliestPosition || 'None selected'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm text-zinc-400 font-medium mb-1">Correct Earliest Raise Position</h4>
              <p className={`font-medium ${
                decision.userDecision.earliestPosition === decision.correctAnswer.earliestPosition
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                {decision.correctAnswer.earliestPosition || 'N/A (Fold is correct)'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSummary; 