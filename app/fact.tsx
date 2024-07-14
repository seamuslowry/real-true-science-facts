'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Fact } from './page';
import React from 'react';
import range from 'lodash.range';

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
    className="p-4 self-center flex items-center justify-center transition duration-500 hover:bg-slate-700 rounded-full"
  >
    {children}
  </button>
);

function virtualAccess(arr: Fact[], index: number) {
  const length = arr.length;
  // Adjust the index to fit within the bounds of the array length
  index = ((index % length) + length) % length;
  return arr[index];
}

const virtualSlice = (arr: Fact[], start: number, end: number) => {
  return range(start, end).map(n => virtualAccess(arr, n));
};

export const FactLoader = ({ facts }: { facts: Fact[] }) => {
  const [shuffledFacts, setShuffledFacts] = useState<Fact[]>([]);
  const [index, setIndex] = useState(0);

  const virtualPadding = useMemo(
    () => Math.floor(shuffledFacts.length / 2),
    [shuffledFacts]
  );

  useEffect(() => {
    const shuffledFacts = shuffleFacts(facts);
    setShuffledFacts(shuffledFacts);
  }, [facts]);

  const virtualizedFacts = useMemo(
    () =>
      virtualSlice(
        shuffledFacts,
        index - virtualPadding,
        index + virtualPadding
      ),
    [shuffledFacts, index, virtualPadding]
  );

  if (!shuffledFacts.length) return null;

  return (
    <div className="grid grid-cols-slider gap-x-12 h-full">
      <ArrowButton onClick={() => setIndex(c => c - 1)}>
        <ArrowLeft />
      </ArrowButton>
      <div
        className={`h-full w-full bg-slate-800 shadow-md shadow-slate-500 rounded overflow-hidden grid grid-cols-1 grid-rows-1 place-items-center`}
      >
        {virtualizedFacts.map((fact, factIndex) => {
          const left = factIndex < virtualPadding;
          const right = virtualPadding < factIndex;
          return (
            <p
              key={fact.slug}
              className={`row-start-1 col-start-1 p-8 text-9xl text-center transition-transform duration-500 ${right ? 'translate-x-full' : ''} ${left ? '-translate-x-full' : ''}`}
            >
              {fact.content}
            </p>
          );
        })}
      </div>
      <ArrowButton onClick={() => setIndex(c => c + 1)}>
        <ArrowRight />
      </ArrowButton>
    </div>
  );
};
