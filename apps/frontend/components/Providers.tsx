"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store, useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchCurrentUser, setInitialized } from "@/lib/store/authSlice";
import { Loader2 } from "lucide-react";

import { AuthProvider } from "@/lib/auth-context";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isInitialized, accessToken } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If we have an access token, fetch the user info
    if (accessToken) {
      dispatch(fetchCurrentUser());
    } else {
      dispatch(setInitialized());
    }
  }, [dispatch, accessToken]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          <p className="text-xs text-neutral-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AuthInitializer>{children}</AuthInitializer>
      </AuthProvider>
    </Provider>
  );
}
