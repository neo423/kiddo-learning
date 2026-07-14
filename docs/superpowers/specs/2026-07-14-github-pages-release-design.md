# GitHub Pages Release Design

## Goal

Publish Kiddo Learning to `neo423/kiddo-learning` on the `main` branch and deploy the production build to GitHub Pages at `https://neo423.github.io/kiddo-learning/`.

## Scope

- Remove all committed machine-specific user-profile paths.
- Keep game behavior and visual presentation unchanged.
- Configure Vite and the web app manifest for the `/kiddo-learning/` GitHub Pages base path.
- Deploy `dist/` through the official GitHub Pages Actions artifact flow.
- Keep generated output, dependencies, environment files, and local tool state out of Git.

## Design

`start-app.bat` will use the `node` executable available on `PATH` and show an installation message when Node.js is unavailable. Historical development commands will use the portable `python` command instead of a machine-specific interpreter path.

Vite will build with `base: '/kiddo-learning/'`. The manifest link will use Vite's `%BASE_URL%` replacement, while manifest `start_url` and `scope` will use `./` so the installed app stays within the repository subpath. A GitHub Actions workflow will install locked dependencies, build the application, upload `dist/`, and deploy it using GitHub Pages' supported actions.

## Validation

- Search the staged tree for local absolute paths and sensitive patterns.
- Run `npm install` and `npm run build`.
- Confirm generated HTML references `/kiddo-learning/` assets.
- Confirm ignored content is absent from the staged file list.
- Push `main`, verify the Pages workflow succeeds, and request the deployed URL.
