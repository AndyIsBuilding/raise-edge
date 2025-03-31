import React, { useState, useEffect } from 'react';
import { sessionStorage, SessionData } from '../utils/session';

const History: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    const loadHistory = () => {
      try {
        const currentSession = sessionStorage.getCurrentSession();
        setSessionData(currentSession);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading history...</div>;
  }

  if (!sessionData || sessionData.handDecisions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Your Decision History</h2>
        <p className="text-gray-600">You haven't made any decisions yet. Start playing to see your history!</p>
      </div>
    );
  }

  // Calculate session stats
  const totalDecisions = sessionData.handDecisions.length;
  const correctDecisions = sessionData.handDecisions.filter(d => d.isCorrect).length;
  const accuracy = totalDecisions > 0 ? Math.round((correctDecisions / totalDecisions) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Your Decision History</h2>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">
            Session on {new Date(sessionData.date).toLocaleDateString()}
          </h3>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="font-medium">{sessionData.tableSize}-handed</span>
              <span className="mx-1">•</span>
              <span className="capitalize">{sessionData.strategyName}</span>
            </div>
            <div className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-medium">
              {accuracy}% correct
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">Hand</th>
                <th className="text-left p-2">Position</th>
                <th className="text-left p-2">Decision</th>
                <th className="text-center p-2">Result</th>
                <th className="text-left p-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {sessionData.handDecisions.map((decision, index) => {
                const decisionTime = new Date(sessionData.date);
                const formattedTime = decisionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-mono">{decision.handName}</td>
                    <td className="p-2 capitalize">{decision.position}</td>
                    <td className="p-2">
                      {decision.userDecision.raiseDecision ? 'Raise' : 'Fold'}
                      {decision.userDecision.earliestPosition && ` (${decision.userDecision.earliestPosition})`}
                    </td>
                    <td className="p-2 text-center">
                      {decision.isCorrect ? (
                        <span className="inline-block bg-green-100 text-green-800 py-1 px-2 rounded text-xs">
                          Correct
                        </span>
                      ) : decision.partiallyCorrect ? (
                        <span className="inline-block bg-yellow-100 text-yellow-800 py-1 px-2 rounded text-xs">
                          Partial
                        </span>
                      ) : (
                        <span className="inline-block bg-red-100 text-red-800 py-1 px-2 rounded text-xs">
                          Incorrect
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-gray-500 text-sm">{formattedTime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History; 