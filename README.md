# Multidimensional Visual Analyser (MVA)

## Developing

Once you've cloned the project and installed dependencies with `npm install` , start a development server:

```bash
npm run dev
```

The project uses [Svelte Material UI (SMUI)](https://sveltematerialui.com/) components. If you add additional SMUI components, make sure to build them with `npm run prepare` before starting the development server.

## Building

To create a production version of your app:

```bash
npm run build
```

This command creates `build/` folder which can be deployed.

You can preview the production build with:

```bash
npm run preview
```

## Resources

MVA is built with SvelteKit using [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).
