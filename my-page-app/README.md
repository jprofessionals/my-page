# My page - the frontend

This app is a NextJS project built with:

- [TypeScript](https://www.typescriptlang.org/)
- [React](https://react.dev/) + [NextJS](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Server state with [TanStack/React Query](https://tanstack.com/query/v3/)
- Kept sane with [prettier](https://prettier.io/) and
  [eslint](https://eslint.org/)

The components under ./src/components/ui are from
[shadcn/ui](https://ui.shadcn.com/), with slight modifications.

## Available Scripts

In the project directory, you can run:

### npm run dev

This starts up the Next server locally, enabling you to develop and see changes
as you save.

### npm run build

This will build a production build of your current project. It will cleanse out
the previous built version through `rm -rf ./build` and build it fresh.

### npm run start

This starts up the production build built with `npm run build`, unlike
`npm run dev`, this will not reflect changes done when changing files.

### npm run lint

This performs a scan of the project using eslint. Generally meant to be ran as
part of the CI/CD pipeline in Github Actions, to ensure consistent linting
across all contributers contributions.

Ideally, you should be able to set your editor up to warn you about these
warnings/errors while developing, and fix them as you go.

### npm run format

Same as `lint`, but scans the project for consistency in formatting.

### npm run format:fix

Same as `format`, but this attempts to fix all the issues automatically.

We _HIGHLY_ recommend you to set up your editor to automatically format the file
you're working on `on save`, during development. This script will run in Github
Actions, so the formatting should be consistent anyways, but its nice to work on
formatted code.

### Deployment

We host our NextJS on Google Cloud AppEngine. We've set up the project to
automatically deploy once new pull requests merge into `main`, so there's no
need for manual deployment.
