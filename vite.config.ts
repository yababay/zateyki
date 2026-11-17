import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex, type MdsvexOptions } from 'mdsvex';
import type { PreprocessorGroup } from 'svelte/compiler';
import remarkMath from 'remark-math';
import rehypeKatexSvelte from 'rehype-katex-svelte';
import { rehypeFigureComponent, figureImports } from './mdsvex-figure.js';

const mdsvexConfig: MdsvexOptions = {
	extensions: ['.md', '.svx'],
	remarkPlugins: [remarkMath],
	rehypePlugins: [
		rehypeKatexSvelte,
		[rehypeFigureComponent, { webp: true }]
	] as unknown as MdsvexOptions['rehypePlugins']
};

// mdsvex 0.12.x генерирует <script context="module"> — синтаксис, устаревший в Svelte 5.
// Переписываем его в <script module>, пока код не дошёл до компилятора.
const modernModuleScript: PreprocessorGroup = {
	name: 'mdsvex-module-script',
	markup({ content, filename }) {
		if (!filename || !/\.(md|svx)$/.test(filename)) return;

		const code = content.replace(/<script\b([^>]*)>/gi, (tag, attrs: string) => {
			const context = /\scontext\s*=\s*(["'])(module|instance)\1/i.exec(attrs);
			if (!context) return tag;

			let rest = attrs.replace(context[0], '');
			if (context[2].toLowerCase() === 'module' && !/\bmodule\b/.test(rest)) {
				rest += ' module';
			}
			return `<script${rest}>`;
		});

		return code === content ? undefined : { code };
	}
};

export default defineConfig({
	server: {
		port: 5174,
		strictPort: true
	},
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
			preprocess: [
				mdsvex(mdsvexConfig),
				modernModuleScript,
				figureImports(),
				vitePreprocess()
			],
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			}
		})
	]
});