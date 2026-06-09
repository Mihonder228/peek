import { create } from 'zustand';

export type GameState = 'menu' | 'note' | 'playing' | 'jumpscare' | 'win';
export type MonsterType = 'none' | 'peek' | 'stare' | 'trap' | 'bird' | 'twin_left' | 'twin_right';
export type KillerType = 'none' | 'peek' | 'stare' | 'trap' | 'click' | 'bird' | 'twin_left' | 'twin_right';

interface StoreState {
  gameState: GameState;
  isPeeking: boolean;
  score: number;
  activeMonster: MonsterType;
  killerMonster: KillerType;
  clickMonsterActive: boolean;
  lookDirection: 'center' | 'left';
  isLocked: boolean;
  isRedEffect: boolean;
  timeHour: number;
  timeMinute: number;
  night: number;
  clicksRemaining: number;
  flashlightOn: boolean;
  flashlightBattery: number;
  setGameState: (state: GameState, killer?: KillerType) => void;
  setIsPeeking: (peek: boolean) => void;
  setActiveMonster: (type: MonsterType) => void;
  setClickMonsterActive: (active: boolean) => void;
  setLookDirection: (dir: 'center' | 'left') => void;
  setIsLocked: (locked: boolean) => void;
  setIsRedEffect: (red: boolean) => void;
  setTime: (hour: number, minute: number) => void;
  setNight: (night: number) => void;
  setClicksRemaining: (clicks: number) => void;
  decrementClicks: () => void;
  incrementScore: () => void;
  reset: (nextNight?: boolean) => void;
  setFlashlightOn: (on: boolean) => void;
  drainBattery: (amount: number) => void;
}

export const useStore = create<StoreState>((set) => ({
  gameState: 'menu',
  isPeeking: false,
  score: 0,
  activeMonster: 'none',
  killerMonster: 'none',
  clickMonsterActive: false,
  lookDirection: 'center',
  isLocked: false,
  isRedEffect: false,
  timeHour: 0,
  timeMinute: 0,
  night: 1,
  clicksRemaining: 0,
  flashlightOn: false,
  flashlightBattery: 100,
  setGameState: (state, killer = 'none') => set({ gameState: state, killerMonster: killer }),
  setIsPeeking: (peek) => set({ isPeeking: peek }),
  setActiveMonster: (type) => set({ activeMonster: type }),
  setClickMonsterActive: (active) => set({ clickMonsterActive: active }),
  setLookDirection: (dir) => set({ lookDirection: dir }),
  setIsLocked: (locked) => set({ isLocked: locked }),
  setIsRedEffect: (red) => set({ isRedEffect: red }),
  setTime: (hour, minute) => set({ timeHour: hour, timeMinute: minute }),
  setNight: (night) => set({ night }),
  setClicksRemaining: (clicks) => set({ clicksRemaining: clicks }),
  decrementClicks: () => set((state) => ({ clicksRemaining: Math.max(0, state.clicksRemaining - 1) })),
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  reset: (nextNight = false) => set((state) => ({ 
    gameState: 'note', 
    isPeeking: false, 
    score: 0, 
    activeMonster: 'none', 
    killerMonster: 'none',
    clickMonsterActive: false,
    lookDirection: 'center',
    isLocked: false, 
    isRedEffect: false,
    timeHour: 0,
    timeMinute: 0,
    night: nextNight ? Math.min(state.night + 1, 5) : state.night,
    clicksRemaining: 0,
    flashlightOn: false,
    flashlightBattery: 100,
  })),
  setFlashlightOn: (on) => set((state) => ({ flashlightOn: state.flashlightBattery > 0 ? on : false })),
  drainBattery: (amount) => set((state) => ({ 
    flashlightBattery: Math.max(0, state.flashlightBattery - amount),
    flashlightOn: state.flashlightBattery - amount <= 0 ? false : state.flashlightOn
  })),
}));

