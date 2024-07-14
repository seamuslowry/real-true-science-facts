'use client';
import { useEffect, useState } from 'react';
import type { Fact } from './page';
import React from 'react';

function shuffleFacts(facts: Fact[]) {
  const newArray = [...facts];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function FactCard({ fact }: { fact: Fact }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(true);
    }, 50);

    return () => clearTimeout(timeout);
  }, [visible]);

  return (
    <div
      className={`bg-slate-800 shadow-md shadow-slate-500 rounded transition fade-in duration-500 hover:scale-105 hover:bg-slate-900 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <p className="p-8 text-4xl">{fact.content}</p>
    </div>
  );
}

export function FactLoader({ facts }: { facts: Fact[] }) {
  const [shuffledFacts, setShuffledFacts] = useState<Fact[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setShuffledFacts(shuffleFacts(facts));
  }, [facts]);

  if (!shuffledFacts.length) return null;

  const fact = shuffledFacts[index];

  return (
    <div className="grid grid-cols-3 gap-x-24">
      <button
        onClick={() =>
          setIndex(c => (c - 1 + shuffledFacts.length) % shuffledFacts.length)
        }
      >
        &lt;
      </button>
      <FactCard fact={fact} key={fact.slug} />
      <button onClick={() => setIndex(c => (c + 1) % shuffledFacts.length)}>
        &gt;
      </button>
    </div>
  );
}
