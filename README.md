# Real True Science Facts

This is a website to compile real, true science facts that are definitely real and should be believed without question or investigation.

## Getting Started

1. Install [`nvm`](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)
2. Ensure you're using the correct node version with `nvm install && nvm use`
3. Install dependencies `npm i`
4. Run the development server `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result

## Facts

All facts are stored in [`/public/facts.tsx`](./public/facts.csv). To add a new fact, add a line to the CSV file where the first column is the fact and the second column is a unique [slug](https://en.wikipedia.org/wiki/Clean_URL#Slug) for the fact. If the fact contains a comma, you must enclose the fact in quotes to ensure it is the first column.

## Deployments

The main site is deployed at https://realtruesciencefacts.com. When a PR is created, CI/CD will create a feature branch deployment and comment the deployed URL on completion.