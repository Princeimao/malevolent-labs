"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./store";
import { fetchCurrentUser, loginUser, signupUser, logoutUser, User } from "./store/authSlice";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, accessToken, loading, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!isInitialized && accessToken) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, isInitialized, accessToken]);

  const login = async (email: string, pass: string) => {
    try {
      const resultAction = await dispatch(loginUser({ email, password: pass }));
      if (loginUser.fulfilled.match(resultAction)) {
        return { success: true };
      } else {
        return { success: false, error: (resultAction.payload as string) || "Login failed" };
      }
    } catch (err: any) {
      return { success: false, error: err.message || "Login failed" };
    }
  };

  const signup = async (email: string, pass: string, name?: string) => {
    try {
      const resultAction = await dispatch(signupUser({ email, password: pass, name }));
      if (signupUser.fulfilled.match(resultAction)) {
        return { success: true };
      } else {
        return { success: false, error: (resultAction.payload as string) || "Signup failed" };
      }
    } catch (err: any) {
      return { success: false, error: err.message || "Signup failed" };
    }
  };

  const logout = () => {
    dispatch(logoutUser());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: accessToken,
        loading: loading || !isInitialized,
        login,
        signup,
        logout,
        isAuthenticated: isAuthenticated || !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
