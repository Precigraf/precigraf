import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface UserData {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  status: string;
  must_change_password: boolean;
  created_at: string;
  last_login: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; mustChangePassword: boolean }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      return null;
    }

    return data as UserData;
  };

  const refreshUserData = async () => {
    if (user) {
      const data = await fetchUserData(user.id);
      setUserData(data);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            const data = await fetchUserData(session.user.id);
            setUserData(data);
            setLoading(false);
          }, 0);
        } else {
          setUserData(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id).then((data) => {
          setUserData(data);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null; mustChangePassword: boolean }> => {
    try {
      // First check if user exists and is active
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('status, must_change_password')
        .eq('email', email.toLowerCase())
        .single();

      if (userCheckError || !existingUser) {
        return { error: 'Credenciais inválidas', mustChangePassword: false };
      }

      if (existingUser.status !== 'ativo') {
        return { error: 'Sua conta está bloqueada. Entre em contato com o suporte.', mustChangePassword: false };
      }

      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        return { error: 'Credenciais inválidas', mustChangePassword: false };
      }

      // Update last_login
      if (data.user) {
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('user_id', data.user.id);
      }

      return { error: null, mustChangePassword: existingUser.must_change_password };
    } catch (err) {
      return { error: 'Erro ao fazer login. Tente novamente.', mustChangePassword: false };
    }
  };

  const signUp = async (email: string, password: string, name?: string): Promise<{ error: string | null }> => {
    try {
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'Este email já está cadastrado.' };
        }
        return { error: 'Erro ao criar conta. Tente novamente.' };
      }

      if (data.user) {
        // Create user in users table using the RPC function
        const { error: insertError } = await supabase.rpc('create_webhook_user', {
          p_user_id: data.user.id,
          p_email: email.toLowerCase(),
          p_name: name || null,
        });

        if (insertError) {
          console.error('Error creating user record:', insertError);
          // User was created in auth but not in users table - still allow login
        }
      }

      return { error: null };
    } catch (err) {
      return { error: 'Erro ao criar conta. Tente novamente.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserData(null);
  };

  const changePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        return { error: 'Erro ao alterar senha. Tente novamente.' };
      }

      // Update must_change_password flag
      if (user) {
        await supabase
          .from('users')
          .update({ must_change_password: false })
          .eq('user_id', user.id);

        // Refresh user data
        await refreshUserData();
      }

      return { error: null };
    } catch (err) {
      return { error: 'Erro ao alterar senha. Tente novamente.' };
    }
  };

  const value = {
    user,
    session,
    userData,
    loading,
    signIn,
    signUp,
    signOut,
    changePassword,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
