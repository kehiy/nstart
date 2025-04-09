<script lang="ts">
	import '../app.css';
	import { setContext } from 'svelte';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { theme } from '$lib/store';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import ThemeSwitcher from '$lib/ThemeSwitcher.svelte';
	import { availableLanguages, defaultLanguage } from '$lib/i18n/config';
	import { setLanguage, currentLanguage, translationsLoaded } from '$lib/i18n';

	let isModal = browser && window.self !== window.top;
	setContext('isModal', isModal);

	let mediaQuery: MediaQueryList | null = null;
	let systemTheme: string | null = null;

	function updateTheme(preferredTheme: string) {
		if (!browser) return;

		const themeToApply =
			preferredTheme === 'system'
				? systemTheme || (mediaQuery?.matches ? 'dark' : 'light')
				: preferredTheme;

		if (themeToApply === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	function handleThemeUpdate(event: MessageEvent) {
		if (event.data.type === 'THEME_UPDATE') {
			systemTheme = event.data.systemTheme;
			const configuredTheme = event.data.configuredTheme;

			if (configuredTheme === 'system') {
				$theme = systemTheme;
			} else {
				$theme = configuredTheme;
			}
		}
	}

	async function changeLanguage(event: Event) {
		const newLang = (event.target as HTMLSelectElement).value;
		const currentPath = $page.url.pathname;

		// First set the language and load translations
		await setLanguage(newLang);

		// Then navigate to new URL
		if (currentPath.match(/^\/[a-z]{2}(\/.+)?$/)) {
			// If already on a language path, replace the language segment
			const newPath = currentPath.replace(/^\/[a-z]{2}/, `/${newLang}`);

			// Use replaceState to change URL without triggering navigation
			if (browser) {
				history.replaceState(null, '', newPath);
				window.location.reload();
			}
		} else {
			// If on the root or a non-language path, do full navigation
			goto(`/${newLang}/`);
		}
	}

	onMount(async () => {
		if (browser) {
			mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			systemTheme = mediaQuery.matches ? 'dark' : 'light';

			// Initialize theme based on URL parameter or system preference
			const params = new URLSearchParams(window.location.search);

			const forcedTheme = params.get('am');
			if (forcedTheme === 'light' || forcedTheme === 'dark') {
				$theme = forcedTheme;
			} else {
				$theme = systemTheme;
			}

			// Listen for theme updates from parent window
			window.addEventListener('message', handleThemeUpdate);

			// Initialize language based on URL structure or param
			const queryString = window.location.search;
			const currentLanguage = params.get('al');
			if (currentLanguage != null) {
				console.log('Set lang with al param');
				setLanguage(currentLanguage);
				goto(`/${currentLanguage}/${queryString}`);
			} else {
				const lang = $page.params.lang;
				if (lang && availableLanguages.find((l) => l.code === lang)) {
					setLanguage(lang);
				} else {
					setLanguage(defaultLanguage.code);
					goto(`/${defaultLanguage.code}/${queryString}`);
				}
			}
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('message', handleThemeUpdate);
		}
	});

	// Subscribe to theme changes
	$: updateTheme($theme);
</script>

{#if !isModal}
	<div class="absolute right-4 top-4 z-50 flex items-center gap-3">
		{#if $page.route.id === '/[lang]'}
			<!-- Language Selector -->
			<select
				class="rounded-md border border-neutral-300 bg-transparent px-4 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
				on:change={changeLanguage}
				value={$currentLanguage}
				disabled={!$translationsLoaded}
			>
				{#each availableLanguages as language}
					<option value={language.code}>{language.name}</option>
				{/each}
			</select>
		{/if}
		<!-- Theme Switcher -->
		<ThemeSwitcher />
	</div>
{/if}

{#if $translationsLoaded}
	<slot />
{/if}
