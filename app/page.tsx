import { readFile } from "fs/promises";
import {parse} from 'csv-parse'

interface Fact {
  content: string;
  slug: string;
}

async function getFacts() {
  const csv = await readFile('./public/facts.csv', 'utf8')

  const facts: Fact[] = await parse(csv, {columns: true, skip_empty_lines: true}).toArray();

  return facts;
}

export default async function Home() {
  const facts = await getFacts();

  return (
    <main>
      {facts.map(fact => <FactCard fact={fact} key={fact.slug} />)}
    </main>
  );
}

async function FactCard({fact}:{fact: Fact}) {
  return <div>{fact.content}</div>
}