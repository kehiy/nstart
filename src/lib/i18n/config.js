export const availableLanguages = [
	{ code: 'en', name: 'English', default: true },
	{ code: 'it', name: 'Italiano' }
];

export const defaultLanguage =
	availableLanguages.find((lang) => lang.default) || availableLanguages[0];
