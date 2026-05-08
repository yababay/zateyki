import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
//import remarkMath from 'remark-math';
//import rehypeKatex from 'rehype-katex-svelte';

const mdsvexConfig = {
	extensions: ['.md'],
	//remarkPlugins: [remarkMath],
	//rehypePlugins: [rehypeKatex]
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter({
			// default options are shown. On some platforms, these options are set automatically.
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
		prerender: {
			handleHttpError: 'warn'
		}
	},

	extensions: ['.svelte', '.md'],
	preprocess: [mdsvex(mdsvexConfig)],
};

export default config;
