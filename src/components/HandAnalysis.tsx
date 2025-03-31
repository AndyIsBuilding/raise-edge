import React, { useState, useEffect, useMemo } from 'react';

interface HandAnalysisProps {
  userId: number;
}

interface HandStatistics {
  hand: string;
  totalHands: number;
  correctDecisions: number;
  winRate: number;
  averageScore: number;
}

interface HandDecision {
  id: number;
  hand: string;
  position: string;
  decision: string;
  score: number;
  timestamp: string;
}

const HandAnalysis: React.FC<HandAnalysisProps> = ({ userId }) => {
  const [selectedHand, setSelectedHand] = useState<string>('');
  const [handOptions, setHandOptions] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<HandStatistics | null>(null);
  const [recentDecisions, setRecentDecisions] = useState<HandDecision[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Common hand categories
  const commonHands = useMemo(() => ({
    'Premium Pairs': ['AA', 'KK', 'QQ', 'JJ'],
    'Medium Pairs': ['TT', '99', '88', '77'],
    'Small Pairs': ['66', '55', '44', '33', '22'],
    'Big Broadway': ['AKs', 'AQs', 'AJs', 'AKo', 'AQo'],
    'Medium Suited': ['KQs', 'KJs', 'QJs', 'JTs'],
    'Suited Connectors': ['T9s', '98s', '87s', '76s', '65s'],
    'Suited Aces': ['A5s', 'A4s', 'A3s', 'A2s'],
  }), []);

  // Load all user hands on component mount
  useEffect(() => {
    const loadUserHands = async () => {
      try {
        // Since we don't have real data yet, just use the common hands
        const allHands = Object.values(commonHands).flat();
        setHandOptions(allHands);
      } catch (error) {
        console.error('Error loading user hands:', error);
      }
    };

    loadUserHands();
  }, [userId, commonHands]);

  // Load analysis data when a hand is selected
  useEffect(() => {
    if (!selectedHand) return;
    
    const loadHandData = async () => {
      setLoading(true);
      try {
        // Mock statistics for now
        const mockStats: HandStatistics = {
          hand: selectedHand,
          totalHands: 0,
          correctDecisions: 0,
          winRate: 0,
          averageScore: 0
        };
        setStatistics(mockStats);
        
        // Mock recent decisions
        setRecentDecisions([]);
      } catch (error) {
        console.error('Error loading hand data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHandData();
  }, [selectedHand, userId]);

  // Generate hand category dropdown options
  const renderHandCategories = () => {
    return Object.entries(commonHands).map(([category, hands]) => (
      <optgroup key={category} label={category}>
        {hands.map(hand => (
          <option key={hand} value={hand}>{hand}</option>
        ))}
      </optgroup>
    ));
  };

  // Generate general advice for the hand
  const renderHandAdvice = () => {
    if (!selectedHand) return null;
    
    // This could be expanded with a more detailed strategy database
    const isPair = selectedHand[0] === selectedHand[1];
    const isSuited = selectedHand.endsWith('s');
    const firstRank = selectedHand[0];
    const secondRank = selectedHand[1];
    
    let advice = '';
    
    if (isPair) {
      if (['A', 'K', 'Q', 'J'].includes(firstRank)) {
        advice = 'Premium pair. Generally play aggressively from any position. Consider 3-betting or 4-betting with these hands.';
      } else if (['T', '9', '8', '7'].includes(firstRank)) {
        advice = 'Medium pair. These are strong hands that play well in most situations. Consider raising from early position and 3-betting in late position.';
      } else {
        advice = 'Small pair. These hands play best by trying to hit a set. Consider limping from early position and calling raises when the pot odds are favorable.';
      }
    } else if (isSuited) {
      if (firstRank === 'A') {
        advice = 'Suited ace. These hands have good flush potential. Play more aggressively from late position.';
      } else if (['K', 'Q', 'J', 'T'].includes(firstRank) && ['K', 'Q', 'J', 'T'].includes(secondRank)) {
        advice = 'Suited broadway. These hands have strong showdown value and flush potential. Consider raising or 3-betting from middle to late position.';
      } else if (Math.abs(firstRank.charCodeAt(0) - secondRank.charCodeAt(0)) === 1) {
        advice = 'Suited connector. These hands can make strong draws. Better played from late position or in multiway pots.';
      } else {
        advice = 'Suited gapper. These hands have moderate potential. Play cautiously from early position.';
      }
    } else { // Offsuit
      if (firstRank === 'A' && ['K', 'Q', 'J'].includes(secondRank)) {
        advice = 'Strong offsuit ace. These hands have good showdown value. Play aggressively from most positions.';
      } else if (['K', 'Q', 'J', 'T'].includes(firstRank) && ['K', 'Q', 'J', 'T'].includes(secondRank)) {
        advice = 'Broadway offsuit. These hands have decent showdown value. Better played from middle to late position.';
      } else {
        advice = 'Weak offsuit hand. Be cautious with these hands, especially from early position.';
      }
    }
    
    return advice;
  };

  // Position-specific advice for the selected hand
  const getPositionAdvice = () => {
    if (!selectedHand) return {};
    
    const positions = ['UTG', 'UTG1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    const advice: {[key: string]: string} = {};
    
    // This is simplified advice and could be expanded with a proper strategy database
    const isPair = selectedHand[0] === selectedHand[1];
    const isSuited = selectedHand.endsWith('s');
    const firstRank = selectedHand[0];
    
    positions.forEach(pos => {
      let posAdvice = '';
      
      // Early position
      if (pos === 'UTG' || pos === 'UTG1') {
        if (isPair && ['A', 'K', 'Q', 'J', 'T'].includes(firstRank)) {
          posAdvice = 'Raise';
        } else if (!isPair && firstRank === 'A' && ['K', 'Q'].includes(selectedHand[1])) {
          posAdvice = isSuited ? 'Raise' : 'Raise';
        } else if (isSuited && ['K', 'Q', 'J'].includes(firstRank) && ['K', 'Q', 'J'].includes(selectedHand[1])) {
          posAdvice = 'Raise';
        } else {
          posAdvice = 'Fold';
        }
      }
      // Middle position
      else if (pos === 'LJ' || pos === 'HJ' || pos === 'CO') {
        if (isPair) {
          posAdvice = 'Raise';
        } else if (firstRank === 'A') {
          posAdvice = 'Raise';
        } else if (isSuited && ['K', 'Q', 'J', 'T'].includes(firstRank)) {
          posAdvice = 'Raise';
        } else if (!isSuited && ['K', 'Q', 'J'].includes(firstRank) && ['K', 'Q', 'J'].includes(selectedHand[1])) {
          posAdvice = 'Raise';
        } else if (isSuited && Math.abs(firstRank.charCodeAt(0) - selectedHand[1].charCodeAt(0)) === 1) {
          posAdvice = 'Call/Raise';
        } else {
          posAdvice = 'Fold';
        }
      }
      // Button or Cutoff
      else if (pos === 'BTN') {
        if (isPair || firstRank === 'A' || isSuited) {
          posAdvice = 'Raise';
        } else if (['K', 'Q', 'J', 'T'].includes(firstRank)) {
          posAdvice = 'Raise';
        } else {
          posAdvice = 'Call/Fold';
        }
      }
      // Small Blind
      else if (pos === 'SB') {
        if (isPair || firstRank === 'A' || (isSuited && ['K', 'Q', 'J', 'T', '9'].includes(firstRank))) {
          posAdvice = 'Raise';
        } else {
          posAdvice = 'Call/Fold';
        }
      }
      // Big Blind
      else if (pos === 'BB') {
        posAdvice = 'Check if no raise, Call small raises with most hands, Raise with premium hands';
      }
      
      advice[pos] = posAdvice;
    });
    
    return advice;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Hand Analysis</h2>
      
      <div className="mb-6">
        <label htmlFor="handSelect" className="block text-gray-700 font-bold mb-2">
          Select a Hand
        </label>
        <select
          id="handSelect"
          value={selectedHand}
          onChange={e => setSelectedHand(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select Hand --</option>
          {/* Static list of common hands by category */}
          {renderHandCategories()}
          {/* User's played hands that aren't in the common categories */}
          {handOptions.length > 0 && (
            <optgroup label="Your Played Hands">
              {handOptions
                .filter(hand => !Object.values(commonHands).flat().includes(hand))
                .map(hand => (
                  <option key={hand} value={hand}>{hand}</option>
                ))}
            </optgroup>
          )}
        </select>
      </div>
      
      {loading && <div className="text-center py-4">Loading hand data...</div>}
      
      {selectedHand && !loading && (
        <div>
          {/* Hand visualization */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-2">Hand: {selectedHand}</h3>
            <div className="flex justify-center bg-green-100 py-8 rounded-lg">
              <div className="flex space-x-4">
                <div className="bg-white rounded-lg shadow-md p-3 text-2xl font-bold">
                  {selectedHand[0]}
                </div>
                <div className="bg-white rounded-lg shadow-md p-3 text-2xl font-bold">
                  {selectedHand[1]}
                </div>
                {selectedHand.length > 2 && (
                  <div className="flex items-center text-lg text-gray-700">
                    {selectedHand.endsWith('s') ? 'Suited' : 'Offsuit'}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* General advice */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-2">General Strategy</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p>{renderHandAdvice()}</p>
            </div>
          </div>
          
          {/* Position-specific advice */}
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-2">Position-Based Strategy (6-max)</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2">UTG</th>
                    <th className="p-2">UTG1</th>
                    <th className="p-2">LJ</th>
                    <th className="p-2">HJ</th>
                    <th className="p-2">CO</th>
                    <th className="p-2">BTN</th>
                    <th className="p-2">SB</th>
                    <th className="p-2">BB</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-center">
                    {['UTG', 'UTG1', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'].map(pos => {
                      const advice = getPositionAdvice();
                      let bgColor = 'bg-gray-50';
                      if (advice[pos]?.includes('Raise')) bgColor = 'bg-green-100';
                      if (advice[pos]?.includes('Call')) bgColor = 'bg-yellow-100';
                      if (advice[pos]?.includes('Fold')) bgColor = 'bg-red-100';
                      
                      return (
                        <td key={pos} className={`p-3 ${bgColor}`}>
                          {advice[pos]}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* User statistics for this hand */}
          {statistics && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Your Performance with {selectedHand}</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm">Total Decisions</p>
                  <p className="text-2xl font-bold">{statistics.totalHands || 0}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm">Correct Decisions</p>
                  <p className="text-2xl font-bold">{statistics.correctDecisions || 0}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm">Accuracy</p>
                  <p className="text-2xl font-bold">
                    {statistics.totalHands > 0 ? Math.round((statistics.correctDecisions / statistics.totalHands) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Recent decisions */}
          {recentDecisions.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-2">Recent Decisions with {selectedHand}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-2">Position</th>
                      <th className="text-left p-2">Decision</th>
                      <th className="text-center p-2">Result</th>
                      <th className="text-left p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDecisions.map(decision => {
                      const decisionDate = new Date(decision.timestamp);
                      return (
                        <tr key={decision.id} className="border-b">
                          <td className="p-2 capitalize">{decision.position}</td>
                          <td className="p-2 uppercase">{decision.decision}</td>
                          <td className="p-2 text-center">
                            {decision.score > 0 ? (
                              <span className="inline-block bg-green-100 text-green-800 py-1 px-2 rounded text-xs">
                                Correct
                              </span>
                            ) : (
                              <span className="inline-block bg-red-100 text-red-800 py-1 px-2 rounded text-xs">
                                Incorrect
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-gray-500 text-sm">
                            {decisionDate.toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {!statistics && recentDecisions.length === 0 && (
            <div className="text-center py-4 text-gray-600">
              You haven't played this hand yet. Start training to see your statistics!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HandAnalysis; 