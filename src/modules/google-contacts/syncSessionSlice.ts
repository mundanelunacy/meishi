import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { SyncOutcome } from "../../shared/types/models";

interface SyncSessionState {
  lastOutcome: SyncOutcome | null;
  status: "idle" | "syncing" | "error" | "done";
  errorMessage: string | null;
}

const initialState: SyncSessionState = {
  lastOutcome: null,
  status: "idle",
  errorMessage: null,
};

const syncSessionSlice = createSlice({
  name: "syncSession",
  initialState,
  reducers: {
    startSync(state) {
      state.status = "syncing";
      state.errorMessage = null;
    },
    syncSucceeded(state, action: PayloadAction<SyncOutcome>) {
      state.status = "done";
      state.lastOutcome = action.payload;
      state.errorMessage = null;
    },
    syncFailed(state, action: PayloadAction<string>) {
      state.status = "error";
      state.errorMessage = action.payload;
    },
    resetSyncState() {
      return initialState;
    },
  },
});

export const { startSync, syncSucceeded, syncFailed, resetSyncState } = syncSessionSlice.actions;
export const syncSessionReducer = syncSessionSlice.reducer;

export const selectSyncStatus = (state: RootState) => state.syncSession.status;
export const selectLastSyncOutcome = (state: RootState) => state.syncSession.lastOutcome;
export const selectSyncError = (state: RootState) => state.syncSession.errorMessage;
