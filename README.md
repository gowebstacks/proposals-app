# Proposals App

A web application for managing proposals.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint
- `pnpm check-types` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: CSS
- **Package Manager**: pnpm
- **Build Tool**: Turborepo

## Project Structure

```
proposals-app/
├── apps/
│   └── web/           # Next.js web application
├── packages/
│   ├── ui/            # Shared React components
│   ├── eslint-config/ # ESLint configurations
│   └── typescript-config/ # TypeScript configurations
└── turbo.json         # Turborepo configuration
```
