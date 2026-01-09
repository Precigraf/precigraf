import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface UserData {
  id: string;
  user_id: string;
  email: string;
  status: string;
  must_change_password: boolean;
  name?: string;
  created_at: string;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user data:", error);
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
          // Use setTimeout to avoid potential race conditions
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const data = await fetchUserData(session.user.id);
        setUserData(data);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        return { error: "Credenciais inválidas" };
      }

      if (data.user) {
        const userData = await fetchUserData(data.user.id);
        
        if (!userData) {
          await supabase.auth.signOut();
          return { error: "Usuário não encontrado no sistema" };
        }

        if (userData.status !== "ativo") {
          await supabase.auth.signOut();
          return { error: "Sua conta está bloqueada. Entre em contato com o suporte." };
        }

        // Atualizar last_login
        await supabase
          .from("users")
          .update({ last_login: new Date().toISOString() })
          .eq("user_id", data.user.id);

        setUserData(userData);
      }

      return { error: null };
    } catch (err) {
      console.error("Sign in error:", err);
      return { error: "Erro ao fazer login. Tente novamente." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
    setSession(null);
  };

  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: "Erro ao atualizar senha. Tente novamente." };
      }

      // Atualizar must_change_password para false
      if (user) {
        await supabase
          .from("users")
          .update({ must_change_password: false })
          .eq("user_id", user.id);

        // Atualizar userData local
        setUserData((prev) => prev ? { ...prev, must_change_password: false } : null);
      }

      return { error: null };
    } catch (err) {
      console.error("Update password error:", err);
      return { error: "Erro ao atualizar senha. Tente novamente." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        session,
        loading,
        signIn,
        signOut,
        updatePassword,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
