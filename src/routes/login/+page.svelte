<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let mode = $state<'login' | 'register'>('register');
	let busy = $state(false);
</script>

<svelte:head>
	<title>Log in · Rainbow Smiles Funtime Place</title>
</svelte:head>

<main>
	<a class="home" href="/">🏠 Back</a>
	<div class="card">
		{#if !data.accountsEnabled}
			<h1>Accounts are coming soon!</h1>
			<p>For now, your cats are saved on this device.</p>
		{:else}
			<div class="switch" role="tablist">
				<button
					role="tab"
					aria-selected={mode === 'register'}
					class:active={mode === 'register'}
					onclick={() => (mode = 'register')}>✨ New player</button
				>
				<button
					role="tab"
					aria-selected={mode === 'login'}
					class:active={mode === 'login'}
					onclick={() => (mode = 'login')}>👋 I've played before</button
				>
			</div>

			<h1>{mode === 'register' ? 'Make your account' : 'Welcome back!'}</h1>

			<form
				method="POST"
				action="?/{mode}"
				use:enhance={() => {
					busy = true;
					return async ({ update }) => {
						await update({ reset: false });
						busy = false;
					};
				}}
			>
				<label>
					<span>Your player name</span>
					<input
						name="username"
						autocomplete="username"
						required
						minlength="3"
						maxlength="20"
						value={form?.username ?? ''}
					/>
				</label>
				<label>
					<span>Secret password</span>
					<input
						name="password"
						type="password"
						autocomplete={mode === 'register' ? 'new-password' : 'current-password'}
						required
						minlength="6"
					/>
				</label>
				{#if form?.message}
					<p class="message">{form.message}</p>
				{/if}
				<button class="go" disabled={busy}>
					{mode === 'register' ? '🐱 Make my account' : '🐱 Log in'}
				</button>
			</form>
			{#if mode === 'register'}
				<p class="hint">Ask a grown-up to help you remember your password!</p>
			{/if}
		{/if}
	</div>
</main>

<style>
	main {
		max-width: 520px;
		margin: 0 auto;
		padding: 16px;
	}
	.home {
		font-size: 1.3rem;
		text-decoration: none;
		color: inherit;
		font-weight: 600;
	}
	.card {
		margin-top: 16px;
		background: var(--card);
		border-radius: 28px;
		box-shadow: 0 6px 24px #e9b6d455;
		padding: 24px;
	}
	h1 {
		margin: 8px 0 16px;
		font-size: 2rem;
	}
	.switch {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.switch button {
		flex: 1;
		font-size: 1.05rem;
		font-weight: 600;
		padding: 10px;
		border-radius: 999px;
		border: 3px solid transparent;
		background: #f6eefa;
		cursor: pointer;
	}
	.switch button.active {
		background: #fff;
		border-color: var(--accent);
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 1.2rem;
		font-weight: 600;
	}
	input {
		font: inherit;
		font-size: 1.4rem;
		padding: 10px 14px;
		border: 4px solid #f1e4f5;
		border-radius: 16px;
		outline: none;
	}
	input:focus {
		border-color: var(--accent);
	}
	.message {
		margin: 0;
		padding: 10px 14px;
		border-radius: 14px;
		background: #fff0f3;
		color: #c2185b;
		font-weight: 600;
	}
	.go {
		font-size: 1.4rem;
		font-weight: 700;
		padding: 12px;
		border: none;
		border-radius: 999px;
		background: var(--accent);
		color: white;
		cursor: pointer;
		box-shadow: 0 4px 0 var(--accent-dark);
	}
	.go:disabled {
		opacity: 0.6;
	}
	.hint {
		opacity: 0.8;
	}
</style>
