import { Card, PositionName, TableSize } from '../types';

export interface HandDecision {
  hand: Card[];
  handName: string; // For display purposes
  position: PositionName;
  userDecision: {
    raiseDecision: boolean | null;
    earliestPosition: PositionName | null;
  };
  correctAnswer: {
    raiseDecision: boolean;
    earliestPosition: PositionName | null;
  };
  isCorrect: boolean;
  partiallyCorrect?: boolean;
}

export interface SessionData {
  id: string;
  date: string;
  tableSize: TableSize;
  strategyName: string;
  handDecisions: HandDecision[];
  score: {
    correct: number;
    total: number;
  };
  raisePercentage?: number; // The percentage of hands user chose to raise
}

const SESSION_STORAGE_KEY = 'poker_trainer_current_session';

export const sessionStorage = {
  // Initialize a new session
  initSession(tableSize: TableSize, strategyName: string): SessionData {
    const sessionData: SessionData = {
      id: `session_${Date.now()}`,
      date: new Date().toISOString(),
      tableSize,
      strategyName,
      handDecisions: [],
      score: {
        correct: 0,
        total: 0,
      },
      raisePercentage: 0 // Initialize raise percentage to 0
    };
    
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    return sessionData;
  },
  
  // Get current session data
  getCurrentSession(): SessionData | null {
    const sessionData = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  },
  
  // Add a hand decision to the current session
  addHandDecision(handDecision: HandDecision): SessionData | null {
    const currentSession = this.getCurrentSession();
    if (!currentSession) return null;
    
    currentSession.handDecisions.push(handDecision);
    currentSession.score = {
      correct: currentSession.score.correct + (handDecision.isCorrect ? 1 : 0),
      total: currentSession.score.total + 1,
    };
    
    // Calculate the raise percentage
    const raisedHandsCount = currentSession.handDecisions.filter(
      decision => decision.userDecision.raiseDecision === true
    ).length;
    
    currentSession.raisePercentage = currentSession.score.total > 0
      ? Math.round((raisedHandsCount / currentSession.score.total) * 100)
      : 0;
    
    console.log('==== RAISE PERCENTAGE CALCULATION ====');
    console.log('Total hands:', currentSession.score.total);
    console.log('Raised hands:', raisedHandsCount);
    console.log('Raise percentage:', currentSession.raisePercentage + '%');
    
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSession));
    return currentSession;
  },
  
  // Clear the current session
  clearCurrentSession(): void {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}; 