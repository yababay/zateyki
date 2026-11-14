import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	ROOT_TITLE: {
		public: true,
		static: true
	},
	ROOT_DESCRIPTION: {
		public: true,
		static: true
	}
});
