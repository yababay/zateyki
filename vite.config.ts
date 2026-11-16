import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex, type MdsvexOptions } from 'mdsvex';
import remarkMath from 'remark-math';
import rehypeKatexSvelte from 'rehype-katex-svelte';
import rehypeFigure from './rehype-figure.js';

const mdsvexConfig: MdsvexOptions = {
	extensions: ['.md', '.svx'],
	remarkPlugins: [remarkMath],
	rehypePlugins: [rehypeKatexSvelte, rehypeFigure]
};

export default defineConfig({
	plugins: [
		sveltekit({
			// Бывшие опции kit.* — теперь на верхнем уровне:
			adapter: adapter({ fallback: '404.html' }),
			paths: {
				base: process.argv.includes('dev') ? '' : '/zateyki'
			},
			prerender: {
				handleHttpError: 'ignore',
				crawl: false
			},
			// Эти опции Kit пробросит в vite-plugin-svelte:
			extensions: ['.svelte', '.svx', '.md'],
			preprocess: [mdsvex(mdsvexConfig), vitePreprocess()],
			compilerOptions: {
				// Принудительный runes-режим для проекта, кроме библиотек.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			}
		})
	]
});