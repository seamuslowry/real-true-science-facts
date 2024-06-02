'use client'
import { useEffect, useState } from "react";
import type { Fact } from './page'
import React from 'react'


export function FactCard({ fact }: { fact: Fact }) {
    const [visible, setVisible] = useState(false);

    // TODO: the fade in doesn't always work; visible being set too quickly???
    useEffect(() => {
        setVisible(true)
    }, [visible])

    return <div className={`transition-opacity fade-in duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>{fact.content}</div>
}


export function FactLoader({ facts }: { facts: Fact[] }) {
    const [showAmount, setShowAmount] = useState(1);

    useEffect(() => {
        if (showAmount < facts.length) {
            const timeout = setTimeout(() => {
                setShowAmount(c => c + 1);
            }, 500)

            return () => clearTimeout(timeout);
        }

    }, [facts.length, showAmount])


    const visibleFacts = facts.slice(0, showAmount);

    return (<>
        {visibleFacts.map(fact => <FactCard fact={fact} key={fact.slug} />)}
    </>);
}