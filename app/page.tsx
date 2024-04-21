import { readdir, readFile } from "fs/promises";
import matter from "gray-matter";

interface Fact {
  title: string;
  date: string;
  slug: string;
  content: string;
}

async function getFacts() {
  const entries = await readdir("./public/", { withFileTypes: true });

  const dirs = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  const fileContents = await Promise.all(
    dirs.map((dir) => readFile("./public/" + dir + "/index.md", "utf8")),
  );
  const facts = dirs.map((slug, i) => {
    const fileContent = fileContents[i];
    const { data, content } = matter(fileContent);
    return { slug, ...data, content } as Fact;
  });
  facts.sort((a, b) => {
    return Date.parse(a.date) < Date.parse(b.date) ? 1 : -1;
  });
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
  // TODO: render markdown
  // https://nextjs.org/docs/app/building-your-application/configuring/mdx
  return <div>{fact.content}</div>
}