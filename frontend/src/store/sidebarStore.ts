import { create } from "zustand";

interface SidebarState {
  openMenus: Record<string, boolean>;
  toggleMenu: (title: string) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  openMenus: {},
  toggleMenu: (title) =>
    set((state) => ({
      openMenus: {
        ...state.openMenus,
        [title]: !state.openMenus[title],
      },
    })),
}));
