import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex, type MdsvexOptions } from 'mdsvex';
import remarkMath from 'remark-math';
import rehypeKatexSvelte from 'rehype-katex-svelte';
import { rehypeFigureComponent, figureImports } from './mdsvex-figure.js';

const mdsvexConfig: MdsvexOptions = {
	extensions: ['.md', '.svx'],
	remarkPlugins: [remarkMath],
	rehypePlugins: [
		rehypeKatexSvelte,
		// webp: true сохраняет вашу прежнюю подмену .png -> .webp; уберите, если не нужна
		[rehypeFigureComponent, { webp: true }]
	] as unknown as MdsvexOptions['rehypePlugins']
};

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({ fallback: '404.html' }),
			paths: {
				base: process.argv.includes('dev') ? '' : '/zateyki'
			},
			prerender: {
				handleHttpError: 'ignore',
				crawl: false
			},
			extensions: ['.svelte', '.svx', '.md'],
			preprocess: [mdsvex(mdsvexConfig), figureImports(), vitePreprocess()],
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			}
		})
	]
});