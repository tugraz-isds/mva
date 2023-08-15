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
npm run tauri dev
```

You can find more detailed information in the official [Tauri guide for SvelteKit](https://tauri.app/v1/guides/getting-started/setup/sveltekit).

### Building

To create a production version of your app:

```bash
npm run tauri build
```

This command creates `src-tauri/target/release/mva.exe` executable.

You can find more detailed information in the official [Tauri guide for building](https://tauri.app/v1/guides/building/).

### Resources

MVA native application is built with [Tauri](https://tauri.app/).
