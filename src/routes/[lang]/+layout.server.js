import { availableLanguages, defaultLanguage } from '$lib/i18n/config';

export function load({ params }) {
	const { lang } = params;

	// Validate the language
	const validLang = availableLanguages.find((l) => l.code === lang) ? lang : defaultLanguage.code;

	return {
		lang: validLang
	};
}
