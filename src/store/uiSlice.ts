import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type UiState = {
  sidebarOpen: boolean;
  denseMode: boolean;
};

const initialState: UiState = {
  sidebarOpen: true,
  denseMode: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setDenseMode(state, action: PayloadAction<boolean>) {
      state.denseMode = action.payload;
    }
  }
});

export const { setSidebarOpen, toggleSidebar, setDenseMode } = uiSlice.actions;
export default uiSlice.reducer;
