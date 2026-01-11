import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import { UserProfile, Hub } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  hubs: Hub[];
  currentHub: Hub | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setCurrentHub: (hub: Hub | null) => void;
  refreshUser: () => Promise<void>;
  refreshHubs: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [currentHub, setCurrentHub] = useState<Hub | null>(null);
  const [loading, setLoading] = useState(true);
  const [hubsRefreshed, setHubsRefreshed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const refreshUser = async (existingSession?: any) => {
    const startTime = performance.now();
    try {
      console.log('🔄 Refreshing user...');
      
      let session = existingSession;
      let sessionTime = 0;
      
      // Only get session if not provided
      if (!session) {
        const sessionStart = performance.now();
        const { data: { session: fetchedSession }, error: sessionError } = await supabase.auth.getSession();
        sessionTime = performance.now() - sessionStart;
        session = fetchedSession;
        
        console.log(`📋 Session check result (${sessionTime.toFixed(0)}ms):`, { 
          hasSession: !!session, 
          hasError: !!sessionError,
          error: sessionError?.message,
          sessionUser: session?.user?.email 
        });
        
        if (sessionError) {
          console.error('❌ Session error in refreshUser:', sessionError);
          setUser(null);
          setHubs([]);
          setCurrentHub(null);
          return;
        }
      } else {
        console.log('✅ Using existing session (no additional fetch)');
      }
      
      if (!session) {
        console.log('⚠️ No session in refreshUser - user needs to sign in');
        setUser(null);
        setHubs([]);
        setCurrentHub(null);
        return;
      }

      console.log('✅ Session found, has access_token:', !!session.access_token);
      console.log('📡 Calling /api/auth/user...');
      
      // Get user profile from backend
      const apiStart = performance.now();
      const response = await api.get('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        skipAuthInterceptor: true, // Skip interceptor - we already have the token
      } as any);
      const apiTime = performance.now() - apiStart;

      console.log(`📥 API response received (${apiTime.toFixed(0)}ms):`, response.status, response.statusText);

      if (response.data.success) {
        console.log('✅ User profile loaded:', response.data.data);
        setUser(response.data.data);
      } else {
        console.error('❌ Failed to load user profile:', response.data);
        setUser(null);
      }
      
      const totalTime = performance.now() - startTime;
      console.log(`⏱️ Total refreshUser time: ${totalTime.toFixed(0)}ms`);
    } catch (error: any) {
      const totalTime = performance.now() - startTime;
      console.error(`❌ Error refreshing user (${totalTime.toFixed(0)}ms):`, error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received. Is backend running?', error.request);
      } else {
        console.error('Error details:', error.message);
      }
      setUser(null);
    }
  };

  const refreshHubs = async (userForHubSelection?: UserProfile | null, existingSession?: any) => {
    const startTime = performance.now();
    try {
      const userToUse = userForHubSelection || user;
      console.log('🔄 refreshHubs called, user ID:', userToUse?.id);
      
      let session = existingSession;
      let sessionTime = 0;
      
      // Only get session if not provided
      if (!session) {
        const sessionStart = performance.now();
        const { data: { session: fetchedSession }, error: sessionError } = await supabase.auth.getSession();
        sessionTime = performance.now() - sessionStart;
        session = fetchedSession;
        
        console.log(`📋 Session check in refreshHubs (${sessionTime.toFixed(0)}ms)`);
        
        if (sessionError) {
          console.error('❌ Session error in refreshHubs:', sessionError);
          setHubs([]);
          setCurrentHub(null);
          return;
        }
      } else {
        console.log('✅ Using existing session (no additional fetch)');
      }
      
      if (!session) {
        console.log('⚠️ No session in refreshHubs');
        setHubs([]);
        setCurrentHub(null);
        return;
      }

      console.log('📡 Calling /api/auth/hubs...');
      const apiStart = performance.now();
      const response = await api.get('/api/auth/hubs', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        skipAuthInterceptor: true, // Skip interceptor - we already have the token
      } as any);
      const apiTime = performance.now() - apiStart;

      console.log(`📥 Hubs API response (${apiTime.toFixed(0)}ms):`, response.status, response.data);

      if (response.data.success) {
        const userHubs = response.data.data;
        console.log('✅ Hubs loaded:', userHubs.length, 'hubs');
        setHubs(userHubs as Hub[]);

        // Set current hub if not set or if it's no longer in the list
        setCurrentHub((prevHub) => {
          if (!prevHub || !userHubs.find((h: any) => h.id === prevHub.id)) {
            // Try to use last_active_hub_id from user
            if (userToUse?.last_active_hub_id) {
              const lastHub = userHubs.find((h: any) => h.id === userToUse.last_active_hub_id);
              if (lastHub) {
                console.log('✅ Setting current hub from last_active_hub_id:', lastHub.id);
                return lastHub as Hub;
              }
            }
            // Otherwise use first hub
            if (userHubs.length > 0) {
              console.log('✅ Setting current hub to first hub:', userHubs[0].id);
              return userHubs[0] as Hub;
            }
          }
          return prevHub;
        });
      } else {
        console.error('❌ Failed to load hubs:', response.data);
        setHubs([]);
        setCurrentHub(null);
      }
      
      const totalTime = performance.now() - startTime;
      console.log(`⏱️ Total refreshHubs time: ${totalTime.toFixed(0)}ms`);
    } catch (error: any) {
      const totalTime = performance.now() - startTime;
      console.error(`❌ Error refreshing hubs (${totalTime.toFixed(0)}ms):`, error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received. Is backend running?');
      }
      setHubs([]);
      setCurrentHub(null);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setHubs([]);
      setCurrentHub(null);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    // Check for auth session
    const checkSession = async () => {
      const totalStart = performance.now();
      setLoading(true);
      console.log('🔍 Checking session...');
      
      try {
        // Get session from Supabase (it handles localStorage automatically)
        const sessionStart = performance.now();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        const sessionTime = performance.now() - sessionStart;
        
        console.log(`📋 Session check result (${sessionTime.toFixed(0)}ms):`, { 
          hasSession: !!session, 
          hasError: !!sessionError,
          error: sessionError?.message,
          sessionUser: session?.user?.email
        });
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setUser(null);
          setHubs([]);
          setCurrentHub(null);
          setLoading(false);
          return;
        }
        
        if (session) {
          console.log('✅ Session found, loading user profile and hubs...');
          const dataStart = performance.now();
          // Pass session to avoid duplicate getSession calls
          await Promise.allSettled([refreshUser(session), refreshHubs(null, session)]);
          const dataTime = performance.now() - dataStart;
          console.log(`✅ User and hubs loaded (${dataTime.toFixed(0)}ms)`);
        } else {
          console.log('ℹ️ No session found');
          setUser(null);
          setHubs([]);
          setCurrentHub(null);
        }
      } catch (error) {
        console.error('❌ Error checking session:', error);
        setUser(null);
        setHubs([]);
        setCurrentHub(null);
      } finally {
        const totalTime = performance.now() - totalStart;
        console.log(`⏱️ Total checkSession time: ${totalTime.toFixed(0)}ms`);
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        // Pass session to avoid duplicate getSession calls
        await refreshUser(session);
        // refreshHubs will be called in useEffect when user state updates
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setHubs([]);
        setCurrentHub(null);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('🔄 Token refreshed');
        // No need to reload user data, just continue
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Refresh hubs when user is loaded/updated (only once)
  // Note: This is a fallback - hubs are also loaded in parallel in checkSession
  useEffect(() => {
    if (user && user.status === 'approved' && hubs.length === 0 && !hubsRefreshed) {
      console.log('🔄 User approved, refreshing hubs (fallback, hubs count:', hubs.length, ')...');
      setHubsRefreshed(true);
      refreshHubs(user);
    } else if (!user || user.status !== 'approved') {
      setHubsRefreshed(false);
    }
  }, [user?.id, user?.status, hubs.length, hubsRefreshed]);

  // Handle user status and routing
  useEffect(() => {
    console.log('🔄 Routing effect:', { 
      loading, 
      user: !!user, 
      userStatus: user?.status, 
      hubsCount: hubs.length, 
      currentHub: !!currentHub, 
      currentHubId: currentHub?.id,
      path: location.pathname 
    });
    
    // Don't route while loading
    if (loading) {
      console.log('⏸️ Skipping routing - still loading');
      return;
    }
    
    // If no user, let ProtectedRoutes handle the redirect
    if (!user) {
      return;
    }

    const path = location.pathname;
    
    // Redirect pending users to waiting approval page
    if (user.status === 'pending' && !path.startsWith('/waiting-approval') && !path.startsWith('/auth')) {
      console.log('🔄 Redirecting pending user to /waiting-approval');
      navigate('/waiting-approval', { replace: true });
      return;
    }

    // Only handle routing for approved users
    if (user.status !== 'approved') {
      console.log('⏸️ Skipping routing - user not approved, status:', user.status);
      return;
    }

    // If user is approved but has no hubs, show error or redirect
    if (hubs.length === 0) {
      console.log('⚠️ User approved but has no hubs');
      // Don't navigate - let the UI show an error or empty state
      return;
    }

    // Redirect approved users away from login/waiting-approval pages
    if ((path === '/login' || path === '/waiting-approval' || path === '/auth/callback') && hubs.length > 0) {
      console.log('🔄 User approved, redirecting from', path);
      const hubId = currentHub?.id || user.last_active_hub_id || hubs[0]?.id;
      console.log('📍 Hub ID for redirect:', hubId);
      if (hubId) {
        const hub = hubs.find(h => h.id === hubId) || hubs[0];
        if (hub && !currentHub) {
          setCurrentHub(hub);
        }
        console.log('✅ Navigating to:', `/hub/${hubId}/items`);
        navigate(`/hub/${hubId}/items`, { replace: true });
      }
      return;
    }

    // If user is approved but no hub selected, select first hub and navigate
    if (!currentHub && hubs.length > 0) {
      console.log('🔄 User approved, selecting first hub from', hubs.length, 'hubs');
      const hubId = user.last_active_hub_id || hubs[0].id;
      const hub = hubs.find(h => h.id === hubId) || hubs[0];
      console.log('✅ Setting current hub:', hub.id, hub.name);
      setCurrentHub(hub);
      
      // Navigate to the hub if not already there
      if (!path.startsWith(`/hub/${hub.id}`)) {
        console.log('🔄 Navigating to hub:', `/hub/${hub.id}/items`);
        navigate(`/hub/${hub.id}/items`, { replace: true });
      }
    }
  }, [user, hubs, currentHub, loading, location.pathname, navigate]);

  const handleSetCurrentHub = (hub: Hub | null) => {
    setCurrentHub(hub);
    if (hub && user) {
      // Update last_active_hub_id in backend (optional)
      // This could be done via API call
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        hubs,
        currentHub,
        loading,
        signInWithGoogle,
        signOut,
        setCurrentHub: handleSetCurrentHub,
        refreshUser,
        refreshHubs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
