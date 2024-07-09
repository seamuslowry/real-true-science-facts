'use client';
import { useEffect, useState } from 'react';
import type { Fact } from './page';
import React from 'react';

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
  const [showAmount, setShowAmount] = useState(1);

  useEffect(() => {
    if (showAmount < facts.length) {
      const timeout = setTimeout(
        () => {
          setShowAmount(c => c + 1);
        },
        Math.max((100 * (facts.length - showAmount)) / 100, 20)
      );

      return () => clearTimeout(timeout);
    }
  }, [facts.length, showAmount]);

  const visibleFacts = facts.slice(0, showAmount);

  return (
    <>
      {visibleFacts.map(fact => (
        <FactCard fact={fact} key={fact.slug} />
      ))}
    </>
  );
}
