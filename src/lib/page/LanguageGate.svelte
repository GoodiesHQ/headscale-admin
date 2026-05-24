<script lang="ts">
	import { LOCALE_OPTIONS, type SupportedLocale } from '$lib/i18n';

	type LanguageGateProps = {
		onSelect: (language: SupportedLocale) => void | Promise<void>;
		selecting?: boolean;
	};

	let {
		onSelect,
		selecting = false,
	}: LanguageGateProps = $props();
</script>

<div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(241,245,249,1)_100%)] text-surface-900 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,1)_0%,_rgba(2,6,23,1)_100%)] dark:text-surface-50">
	<div class="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12">
		<div class="grid w-full gap-6 rounded-[2rem] border border-surface-300/70 bg-white/85 p-6 shadow-2xl shadow-sky-950/10 backdrop-blur md:p-10 dark:border-surface-700/60 dark:bg-surface-900/85 dark:shadow-black/30 lg:grid-cols-[1.15fr_0.85fr]">
			<div class="space-y-6">
				<div class="inline-flex rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-200">
					Language Setup
				</div>

				<div class="space-y-4">
					<h1 class="max-w-xl text-4xl font-black leading-tight tracking-[-0.03em] text-slate-950 dark:text-white">
						Choose your default language
						<br />
						选择默认界面语言
					</h1>
					<p class="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
						We did not find a saved language preference in your browser yet. Pick the language you want to use first, and you can still change it later in Settings.
					</p>
					<p class="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
						当前浏览器中还没有保存语言偏好。请先选择默认界面语言，后续仍可在“设置”中随时切换。
					</p>
				</div>

				<div class="grid gap-3 text-sm text-slate-500 dark:text-slate-400">
					<div class="rounded-2xl border border-surface-300/70 bg-surface-50/70 px-4 py-3 dark:border-surface-700/60 dark:bg-surface-800/60">
						The selected language will be saved locally in your browser.
					</div>
					<div class="rounded-2xl border border-surface-300/70 bg-surface-50/70 px-4 py-3 dark:border-surface-700/60 dark:bg-surface-800/60">
						所选语言会保存在当前浏览器中，后续访问将自动生效。
					</div>
				</div>
			</div>

			<div class="flex flex-col justify-center gap-4">
				{#each LOCALE_OPTIONS as option}
					<button
						type="button"
						class="group rounded-[1.6rem] border border-surface-300/70 bg-white px-5 py-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-950/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-surface-700/60 dark:bg-surface-900 dark:hover:border-sky-400 dark:hover:shadow-black/30"
						disabled={selecting}
						onclick={() => onSelect(option.code)}
					>
						<div class="flex items-start justify-between gap-4">
							<div>
								<div class="text-xl font-bold tracking-[-0.02em] text-slate-950 dark:text-white">
									{option.label}
								</div>
								<p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
									{option.description}
								</p>
							</div>
							<span class="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-200">
								{selecting ? 'Please wait / 请稍候' : 'Select / 选择'}
							</span>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>
