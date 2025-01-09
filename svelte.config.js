import { mdsvex } from 'mdsvex';
// import adapter from '@sveltejs/adapter-auto'; // 이건 ssr(server-side-rendering)을 사용할때,
import adapter from '@sveltejs/adapter-static'; // 이건 ssg(static-site-generator)를 사용할때
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [vitePreprocess(), mdsvex()],

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.

		/** default settings with adapter-auto */
		// adapter: adapter(),

		/** adapter-static settings */
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		})
	},

	extensions: ['.svelte', '.svx']
};

export default config;
