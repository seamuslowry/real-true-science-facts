'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Fact } from './page';
import React from 'react';
import VirtualList from './virtual-list';
import { useSwipeable } from 'react-swipeable';

const shuffleFacts = (facts: Fact[]) => {
  const newArray = [...facts];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const ArrowLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="size-6"
  >
    <path
      fillRule="evenodd"
      d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z"
      clipRule="evenodd"
    />
  </svg>
);

const ArrowRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="size-6"
  >
    <path
      fillRule="evenodd"
      d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
      clipRule="evenodd"
    />
  </svg>
);

const ArrowButton = ({
  children,
  onClick
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="p-1 sm:p-2 md:p-4 self-center flex items-center justify-center transition duration-500 hover:bg-gray-300 dark:hover:bg-slate-700 rounded-full"
  >
    {children}
  </button>
);

const FactSlider = ({
  facts,
  index,
  onMoveLeft,
  onMoveRight
}: {
  facts: VirtualList<Fact>;
  index: number;
  onMoveLeft: VoidFunction;
  onMoveRight: VoidFunction;
}) => {
  const virtualPadding = useMemo(
    () => Math.min(Math.floor(facts.length / 2) - 1, 10),
    [facts]
  );

  const factsToRender = useMemo(
    () => facts.slice(index - virtualPadding, index + virtualPadding),
    [facts, index, virtualPadding]
  );

  const handlers = useSwipeable({
    // swipe moves should be opposite of the swipe direction
    onSwipedLeft: onMoveRight,
    onSwipedRight: onMoveLeft,
    preventScrollOnSwipe: true
  });

  return (
    <div
      {...handlers}
      className={`h-full w-full bg-white dark:bg-slate-800 shadow-md dark:shadow-slate-500 rounded overflow-hidden grid grid-cols-1 grid-rows-1 place-items-center`}
    >
      {factsToRender.map((fact, factIndex) => {
        const left = factIndex < virtualPadding;
        const right = virtualPadding < factIndex;
        return (
          <FactText
            position={(left && 'LEFT') || (right && 'RIGHT') || undefined}
            key={fact.slug}
          >
            {fact.content}
          </FactText>
        );
      })}
    </div>
  );
};

type HiddenFactTextPosition = 'LEFT' | 'RIGHT';

const FactText = ({
  children,
  position
}: {
  children: string;
  position?: HiddenFactTextPosition;
}) => (
  <p
    className={`row-start-1 col-start-1 p-8 w-full text-2xl sm:text-5xl lg:text-7xl 2xl:text-8xl text-center transition-transform duration-500 ${position === 'RIGHT' ? 'translate-x-full' : ''} ${position === 'LEFT' ? '-translate-x-full' : ''}`}
  >
    {children}
  </p>
);

export const FactLoader = ({ facts }: { facts: Fact[] }) => {
  const [shuffledFacts, setShuffledFacts] = useState<VirtualList<Fact>>(
    new VirtualList<Fact>(...[])
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const shuffledFacts = shuffleFacts(facts);
    setShuffledFacts(new VirtualList(...shuffledFacts));
  }, [facts]);

  const moveLeft = useCallback(() => setIndex(c => c - 1), []);
  const moveRight = useCallback(() => setIndex(c => c + 1), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          moveLeft();
          break;
        case 'ArrowRight':
          moveRight();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [moveLeft, moveRight]);

  if (!shuffledFacts.length) return null;

  return (
    <div className="grid grid-cols-slider gap-x-4 md:gap-x-12 h-full">
      <ArrowButton onClick={moveLeft}>
        <ArrowLeft />
      </ArrowButton>
      <FactSlider
        onMoveLeft={moveLeft}
        onMoveRight={moveRight}
        facts={shuffledFacts}
        index={index}
      />
      <ArrowButton onClick={moveRight}>
        <ArrowRight />
      </ArrowButton>
    </div>
  );
};
