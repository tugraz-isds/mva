# Multidimensional Visual Analyser (MVA)

MVA web application is deployed at https://visualanalyser.app/.

## Web Application

### Developing

Install dependencies and start a development server:

```bash
npm install
npm run dev
```

### Building

To create a production version of your app:

```bash
npm run build
```

This command creates `build/` folder which can be deployed.

You can preview the production build with:

```bash
npm run preview
```

### Resources

MVA web application is built with SvelteKit using [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

---

## Native Application

### Developing

> Before continuing, make sure you have completed the [prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites/) to have a working development environment.

Once you've installed all Tauri prerequisites, install dependencies and start a development server:

```bash
npm install
npm run dev-tauri
```

You can find more detailed information in the official [Tauri guide for SvelteKit](https://tauri.app/v1/guides/getting-started/setup/sveltekit).

### Building

To create a production version of your app:

```bash
npm run build-tauri
```

This command creates `build-tauri/win32/` folder with executables and installables.

You can find more detailed information in the official [Tauri guide for building](https://tauri.app/v1/guides/building/).

### Resources

MVA native application is built with [Tauri](https://tauri.app/).

## Custom Scripts

We defined a few custom Gulp scripts in `gulpfile.js`:

1. `npm run clean` or `npx gulp clean`

Removes the existing `build/`, `build-tauri`, and `src-tauri/target` directories to enable a clean rebuild of the project.

2. `npm run clean-all` or `npx gulp cleanAll`

Removes existing `.svelte-kit/`, `build/`, `build-tauri`, `node_modules/` and `src-tauri/target` directories to enable a clean reinitialization of the project.

3. `npm run optimize-icons` or `npx gulp optimizeIcons`

If new icons are added or existing ones are updated, run this following script.
Icons should be added into `static/icons/` folder. The `optimize-icons` script reads `static/icons/` folder recursively and exports `.svg` files into TypeScript constants that are saved into `src/util/icon-definitions.ts` file.
