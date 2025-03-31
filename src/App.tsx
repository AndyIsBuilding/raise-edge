import React, { useState, useEffect } from 'react';
import { TableSize } from './types';
import GameSession from './components/GameSession';
import SessionSummary from './components/SessionSummary';
import PlayerNotes from './pages/PlayerNotes';
import { sessionStorage, SessionData } from './utils/session';
import { supabase } from './lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Session } from '@supabase/supabase-js';
import SignUpForm from './components/SignUpForm';
import './styles/App.css';
import { migrateLocalNotesToSupabase } from './utils/migration';

const App: React.FC = () => {
  // Application state
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [showSessionSummary, setShowSessionSummary] = useState<boolean>(false);
  const [showPlayerNotes, setShowPlayerNotes] = useState<boolean>(false);
  const [tableSize, setTableSize] = useState<TableSize>(6);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const strategy = 'gto';

  useEffect(() => {
    console.log('App component mounted');
    
    // Check if Supabase is configured
    const isConfigured = Boolean(
      import.meta.env.VITE_SUPABASE_URL && 
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    console.log('Supabase configuration check:', { 
      isConfigured,
      hasUrl: Boolean(import.meta.env.VITE_SUPABASE_URL),
      hasKey: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
    });
    setIsSupabaseConfigured(isConfigured);

    let subscription: { unsubscribe: () => void };

    const initializeAuth = async () => {
      if (isConfigured) {
        try {
          console.log('Initializing Supabase auth...');
          const { data: { session }, error } = await supabase.auth.getSession();
          console.log('Initial session check:', { 
            hasSession: Boolean(session),
            error: error?.message,
            userId: session?.user?.id
          });
          setSession(session);

          // Set up auth state change subscription
          const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            // Skip INITIAL_SESSION events as we already have the session
            if (_event === 'INITIAL_SESSION') return;

            console.log('Auth state changed:', { 
              event: _event,
              hasSession: Boolean(session),
              userId: session?.user?.id
            });
            setSession(session);
            setShowAuth(false);

            // If user just signed in, check for local notes to migrate
            if (_event === 'SIGNED_IN') {
              console.log('User signed in, checking for local notes to migrate...');
              await migrateLocalNotesToSupabase();
            }
          });

          subscription = authSubscription;
        } catch (error) {
          console.error('Error initializing Supabase auth:', error);
          setIsSupabaseConfigured(false);
        }
      } else {
        console.log('Running in local-only mode');
      }
      
      // Set initialized after everything is done
      setIsInitialized(true);
    };

    initializeAuth();

    // Cleanup function
    return () => {
      console.log('Cleaning up auth subscription');
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array to run only once

  // Start new game session
  const handleStartGame = () => {
    setIsGameStarted(true);
    setShowSessionSummary(false);
    setShowPlayerNotes(false);
    setShowAuth(false);
    // Clear any existing session data
    sessionStorage.clearCurrentSession();
  };

  // Don't render anything until initialization is complete
  if (!isInitialized) {
    console.log('App not yet initialized, showing loading screen');
    return (
      <div className="w-full min-h-screen text-gray-200 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // If Supabase is not configured, show local-only mode UI
  if (!isSupabaseConfigured) {
    return (
      <div className="w-full min-h-screen text-gray-200 flex flex-col items-center justify-center">
        <div className="text-xl mb-4">Running in Local Mode</div>
        <button
          onClick={handleStartGame}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Start Game
        </button>
      </div>
    );
  }

  // Log current state when rendering (only in development)
  if (import.meta.env.DEV) {
    console.log('App rendering with state:', {
      isGameStarted,
      showSessionSummary,
      showPlayerNotes,
      showAuth,
      isSupabaseConfigured,
      hasSession: Boolean(session),
      isInitialized,
      authMode
    });
  }

  // Return to main menu
  const handleReturnToMenu = () => {
    setIsGameStarted(false);
    setShowSessionSummary(false);
    setShowPlayerNotes(false);
    setShowAuth(false);
  };

  // End the current session and show summary
  const handleEndSession = () => {
    const currentSession = sessionStorage.getCurrentSession();
    if (currentSession) {
      setSessionData(currentSession);
      setShowSessionSummary(true);
      setIsGameStarted(false);
      setShowPlayerNotes(false);
      setShowAuth(false);
    }
  };

  // Open player notes page
  const handleOpenPlayerNotes = () => {
    setShowPlayerNotes(true);
    setIsGameStarted(false);
    setShowSessionSummary(false);
    setShowAuth(false);
  };

  // Handle table size change
  const handleTableSizeChange = () => {
    // Toggle between 6 and 8
    setTableSize(tableSize === 6 ? 8 : 6);
  };

  // Handle login prompt
  const handleLoginPrompt = () => {
    if (isSupabaseConfigured) {
      setShowAuth(true);
    } else {
      alert('Supabase is not configured. Please check your environment variables.');
    }
  };

  // Handle signup success
  const handleSignUpSuccess = () => {
    setAuthError(null);
    // You might want to show a success message or automatically switch to login mode
    setAuthMode('login');
  };

  // Handle auth error
  const handleAuthError = (error: string) => {
    setAuthError(error);
  };

  // Add logout handler
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Session state will be automatically updated by the auth subscription
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="w-full min-h-screen text-gray-200 flex flex-col items-center">
      <header className="w-full bg-zinc-900 text-white p-2 sm:p-4 shadow-md flex justify-center border-b border-zinc-800">
        <div className="container max-w-6xl px-2 sm:px-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Raise Edge</h1>
          <div className="flex items-center gap-2">
            {isSupabaseConfigured && session ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">
                  {session.user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="button-secondary px-2 sm:px-3 py-1 text-xs sm:text-sm"
                >
                  Logout
                </button>
              </div>
            ) : isSupabaseConfigured ? (
              <button
                onClick={handleLoginPrompt}
                className="button-secondary px-2 sm:px-3 py-1 text-xs sm:text-sm"
              >
                Login
              </button>
            ) : null}
            {(isGameStarted || showSessionSummary || showPlayerNotes) && (
              <button
                onClick={handleReturnToMenu}
                className="button-secondary px-2 sm:px-3 py-1 text-xs sm:text-sm"
              >
                Return to Menu
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="w-full flex justify-center">
        <div className="container max-w-6xl py-2 sm:py-4 md:py-8 px-2 sm:px-4">
          {showAuth && isSupabaseConfigured ? (
            <div className="max-w-md mx-auto">
              <div className="glass-container rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-zinc-100">
                  {authMode === 'login' ? 'Login to Save Your Notes' : 'Create an Account'}
                </h2>
                
                {authError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
                    {authError}
                  </div>
                )}

                {authMode === 'login' ? (
                  <>
                    <Auth
                      supabaseClient={supabase}
                      appearance={{ theme: ThemeSupa }}
                      theme="dark"
                      providers={['google']}
                    />
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setAuthMode('signup')}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Don't have an account? Sign up
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <SignUpForm
                      onSuccess={handleSignUpSuccess}
                      onError={handleAuthError}
                    />
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setAuthMode('login')}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Already have an account? Log in
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : !isGameStarted && !showSessionSummary && !showPlayerNotes ? (
            <div className="max-w-md mx-auto space-y-6">
              <div className="glass-container rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-zinc-100">Poker Training</h2>
                
                <div className="mb-4">
                  <label className="block text-zinc-300 font-bold mb-2">
                    Table Size
                  </label>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleTableSizeChange}
                      className={`px-4 py-2 rounded-md ${tableSize === 6 ? 'button-accent' : 'button-secondary'}`}
                    >
                      6-Max
                    </button>
                    <button
                      onClick={handleTableSizeChange}
                      className={`px-4 py-2 rounded-md ${tableSize === 8 ? 'button-accent' : 'button-secondary'}`}
                    >
                      8-Max
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="strategy" className="block text-zinc-300 font-bold mb-2">
                    Strategy
                  </label>
                  <div className="w-full px-3 py-2 border border-zinc-600 rounded text-zinc-300"
                    style={{ background: 'linear-gradient(145deg, #383844 0%, #2d2d36 100%)' }}>
                    GTO (Game Theory Optimal)
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">
                    More strategies will be available in future updates.
                  </p>
                </div>
                
                <button
                  onClick={handleStartGame}
                  className="button-primary w-full"
                >
                  Start Training
                </button>
              </div>
              
              <div className="glass-container rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-zinc-100">Poker Tools</h2>
                <button
                  onClick={handleOpenPlayerNotes}
                  className="button-secondary w-full"
                >
                  Player Notes
                </button>
              </div>
            </div>
          ) : showSessionSummary && sessionData ? (
            <SessionSummary 
              sessionData={sessionData}
              onStartNewSession={handleStartGame}
              onReturnToMenu={handleReturnToMenu}
            />
          ) : showPlayerNotes ? (
            <PlayerNotes onLoginPrompt={handleLoginPrompt} />
          ) : (
            <div className="flex justify-center w-full">
              <GameSession
                tableSize={tableSize}
                strategyName={strategy}
                className="w-full"
                onEndSession={handleEndSession}
              />
            </div>
          )}
        </div>
      </main>
      
      <footer className="w-full bg-zinc-900 text-zinc-400 py-2 sm:py-4 mt-auto flex justify-center border-t border-zinc-800">
        <div className="container max-w-6xl px-2 sm:px-4 text-center text-xs sm:text-sm">
          <p>Raise Edge &copy; {new Date().getFullYear()}</p>
          <p className="hidden sm:block">Poker tools to help you raise your edge</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
