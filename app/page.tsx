import { readFile } from 'fs/promises';
import { parse } from 'csv-parse';
import { FactLoader } from './fact';

export interface Fact {
  content: string;
  slug: string;
}

async function getFacts() {
  const csv = await readFile('./public/facts.csv', 'utf8');

  const facts: Fact[] = await parse(csv, {
    columns: true,
    skip_empty_lines: true
  }).toArray();

  return facts;
}

export default async function Home() {
  const facts = await getFacts();

  return (
    <main className="grid grid-cols-1 sm:grid-cols-2 gap-x-24 gap-y-12 mx-auto my-10 w-3/4">
      <FactLoader facts={facts} />
    </main>
  );
}
