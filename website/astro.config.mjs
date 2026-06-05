// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Force BASE_URL to the correct path to prevent interference from root .env
process.env.BASE_URL = '/test-playwright-protocol/';

// https://astro.build/config
export default defineConfig({
	site: 'https://yashwant-das.github.io',
	base: '/test-playwright-protocol',
	integrations: [
		starlight({
			title: 'Smart Playwright Protocol',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/yashwant-das/test-playwright-protocol' }],
			sidebar: [
				{
					label: 'Introduction',
					items: [
						{ label: 'Home', slug: 'index' },
						{ label: 'Quick Start', slug: 'quick-start' },
					],
				},
				{
					label: 'Core Protocol',
					items: [
						{ label: 'Protocol', slug: 'protocol' },
						{ label: 'AI Agents', slug: 'agents' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'CLI', slug: 'cli' },
						{ label: 'Roadmap', slug: 'roadmap' },
					],
				},
			],
		}),
	],
});
