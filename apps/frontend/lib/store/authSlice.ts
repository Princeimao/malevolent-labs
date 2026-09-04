import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api";

export interface User {
  id: number | string;
  email: string;
  name?: string;
  currentRole?: string;
  targetCompany?: string;
  targetRole?: string;
  interviewTypes?: string[];
  experienceLevel?: string;
  weeklyGoal?: string;
  isContributor?: boolean;
  contributorType?: "creator" | "sharer" | null;
  isOnboarded?: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
}

const getInitialToken = (key: string): string | null => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem(key) ||
      (key === "accessToken"
        ? localStorage.getItem("agora_interview_token")
        : null)
    );
  }
  return null;
};

const getInitialUser = (): User | null => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("agora_user_cache");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }
  return null;
};

const initialAccessToken = getInitialToken("accessToken");
const initialRefreshToken = getInitialToken("refreshToken");
const initialUser = getInitialUser();

const initialState: AuthState = {
  user: initialUser,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: Boolean(initialAccessToken),
  isInitialized: false,
  loading: false,
  error: null,
};

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token =
        state.auth.accessToken ||
        (typeof window !== "undefined"
          ? localStorage.getItem("accessToken") ||
            localStorage.getItem("agora_interview_token")
          : null);

      if (!token) {
        dispatch(setInitialized());
        return rejectWithValue("No access token available");
      }

      const response = await axios.get(`${BACKEND_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.user) {
        return response.data.user as User;
      }
      return rejectWithValue(response.data.error || "Failed to fetch user");
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error || err.message || "Failed to fetch user",
      );
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    credentials: { email: string; password: string },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/auth/login`,
        credentials,
      );
      const data = response.data;
      if (data.success) {
        const token = data.accessToken || data.token;
        dispatch(
          setTokens({
            accessToken: token,
            refreshToken: data.refreshToken || null,
          }),
        );
        dispatch(setUser(data.user));
        return data;
      }
      return rejectWithValue(data.error || "Login failed");
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error || err.message || "Login failed",
      );
    }
  },
);

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (
    credentials: { email: string; password: string; name?: string },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/auth/signup`,
        credentials,
      );
      const data = response.data;
      if (data.success) {
        const token = data.accessToken || data.token;
        dispatch(
          setTokens({
            accessToken: token,
            refreshToken: data.refreshToken || null,
          }),
        );
        dispatch(setUser(data.user));
        return data;
      }
      return rejectWithValue(data.error || "Signup failed");
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error || err.message || "Signup failed",
      );
    }
  },
);

export const setContributorMode = createAsyncThunk(
  "auth/setContributorMode",
  async (
    type: "creator" | "sharer" | "both" | "none",
    { getState, dispatch, rejectWithValue },
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const token =
        state.auth.accessToken ||
        (typeof window !== "undefined"
          ? localStorage.getItem("accessToken") ||
            localStorage.getItem("agora_interview_token")
          : null);

      const response = await axios.post(
        `${BACKEND_URL}/auth/contributor`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success && response.data.user) {
        dispatch(setUser(response.data.user));
        return response.data.user as User;
      }
      return rejectWithValue(
        response.data.error || "Failed to update contributor mode",
      );
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error ||
          err.message ||
          "Failed to update contributor mode",
      );
    }
  },
);

export const completeOnboarding = createAsyncThunk(
  "auth/completeOnboarding",
  async (
    payload: {
      currentRole: string;
      targetCompany: string;
      targetRole: string;
      interviewTypes: string[];
      experienceLevel: string;
      weeklyGoal?: string;
    },
    { getState, dispatch, rejectWithValue },
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const token =
        state.auth.accessToken ||
        (typeof window !== "undefined"
          ? localStorage.getItem("accessToken") ||
            localStorage.getItem("agora_interview_token")
          : null);

      const response = await axios.post(
        `${BACKEND_URL}/auth/onboarding`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success && response.data.user) {
        dispatch(setUser(response.data.user));
        return response.data.user as User;
      }
      return rejectWithValue(response.data.error || "Onboarding failed");
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error || err.message || "Onboarding failed",
      );
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { dispatch }) => {
    try {
      await axios.post(`${BACKEND_URL}/auth/logout`).catch(() => {});
    } finally {
      dispatch(clearAuth());
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken?: string | null;
      }>,
    ) => {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      state.isAuthenticated = Boolean(accessToken);
      if (refreshToken !== undefined) {
        state.refreshToken = refreshToken;
      }

      if (typeof window !== "undefined") {
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("agora_interview_token", accessToken);
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("agora_interview_token");
        }
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        } else if (refreshToken === null) {
          localStorage.removeItem("refreshToken");
        }
      }
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      // Merge with existing user to preserve fields like isOnboarded that
      // may not be returned by partial-update endpoints (e.g. contributor toggle)
      const updated = action.payload
        ? { ...state.user, ...action.payload }
        : null;
      state.user = updated;
      state.isAuthenticated = Boolean(action.payload || state.accessToken);

      if (typeof window !== "undefined") {
        if (updated) {
          localStorage.setItem("agora_user_cache", JSON.stringify(updated));
        } else {
          localStorage.removeItem("agora_user_cache");
        }
      }
    },
    setInitialized: (state, action: PayloadAction<boolean | void>) => {
      state.isInitialized =
        action.payload !== undefined ? Boolean(action.payload) : true;
      state.loading = false;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.loading = false;
      state.error = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("agora_interview_token");
        localStorage.removeItem("agora_user_cache");
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCurrentUser
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchCurrentUser.fulfilled,
        (state, action: PayloadAction<User>) => {
          const merged: User = {
            ...state.user,
            ...action.payload,
            isContributor:
              action.payload.isContributor ?? state.user?.isContributor ?? false,
            contributorType:
              action.payload.contributorType || state.user?.contributorType || null,
          };
          state.user = merged;
          state.isAuthenticated = true;
          state.isInitialized = true;
          state.loading = false;
          state.error = null;

          if (typeof window !== "undefined") {
            localStorage.setItem("agora_user_cache", JSON.stringify(merged));
          }
        },
      )
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.loading = false;
        state.error = (action.payload as string) || null;
      })
      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Login failed";
      })
      // signupUser
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Signup failed";
      });
  },
});

export const { setTokens, setUser, setInitialized, clearAuth } =
  authSlice.actions;
export default authSlice.reducer;
