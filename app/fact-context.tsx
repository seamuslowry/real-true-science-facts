'use client';
import {
  type ReactNode,
  createContext,
  use,
  useCallback,
  useMemo,
  useState
} from 'react';

const FactContext = createContext({
  index: 0,
  moveLeft: () => {},
  moveRight: () => {}
});

export const FactContextProvider = ({ children }: { children: ReactNode }) => {
  const [index, setIndex] = useState(0);

  const moveLeft = useCallback(() => setIndex(c => c - 1), []);
  const moveRight = useCallback(() => setIndex(c => c + 1), []);

  const value = useMemo(
    () => ({
      index,
      moveLeft,
      moveRight
    }),
    [index, moveLeft, moveRight]
  );

  return <FactContext value={value}>{children}</FactContext>;
};

export const useFactContext = () => {
  return use(FactContext);
};
