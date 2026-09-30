import { create } from 'zustand';

export type Section = 'chats' | 'settings';

interface UiState {
  section: Section;
  setSection: (section: Section) => void;
}

export const useUiStore = create<UiState>((set) => ({
  section: 'chats',
  setSection: (section) => set({ section }),
}));
