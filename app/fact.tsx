'use client';
import { useEffect, useState } from 'react';
import type { Fact } from './page';
import React from 'react';

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

const FactCard = ({ fact }: { fact: Fact }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(true);
    }, 50);

    return () => clearTimeout(timeout);
  }, [visible]);

  return (
    <div
      className={`h-full w-full grid place-items-center bg-slate-800 shadow-md shadow-slate-500 rounded transition fade-in duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <p className="p-8 text-9xl text-center">{fact.content}</p>
    </div>
  );
};

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

export const FactLoader = ({ facts }: { facts: Fact[] }) => {
  const [shuffledFacts, setShuffledFacts] = useState<Fact[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setShuffledFacts(shuffleFacts(facts));
  }, [facts]);

  if (!shuffledFacts.length) return null;

  const fact = shuffledFacts[index];

  return (
    <div className="grid grid-cols-slider gap-x-12 h-full">
      <ArrowButton
        onClick={() =>
          setIndex(c => (c - 1 + shuffledFacts.length) % shuffledFacts.length)
        }
      >
        <ArrowLeft />
      </ArrowButton>
      <FactCard fact={fact} key={fact.slug} />
      <ArrowButton
        onClick={() => setIndex(c => (c + 1) % shuffledFacts.length)}
      >
        <ArrowRight />
      </ArrowButton>
    </div>
  );
};
