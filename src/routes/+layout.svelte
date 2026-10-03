<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap"
	/>
</svelte:head>

{#if data.accountsEnabled}
	<nav class="account">
		{#if data.user}
			<span class="who">🐱 {data.user.username}</span>
			<form method="POST" action="/logout">
				<button>Log out</button>
			</form>
		{:else}
			<a href="/login">👤 Log in</a>
		{/if}
	</nav>
{/if}

{@render children()}

<style>
	:global(:root) {
		--ink: #3b2a40;
		--card: #ffffffcc;
		--accent: #ff7fb0;
		--accent-dark: #e05590;
		--rainbow: linear-gradient(
			90deg,
			#ff6b6b,
			#ffa94d,
			#ffd43b,
			#69db7c,
			#4dabf7,
			#9775fa,
			#f783ac
		);
	}
	:global(body) {
		margin: 0;
		min-height: 100vh;
		font-family: Fredoka, 'Comic Sans MS', system-ui, sans-serif;
		color: var(--ink);
		background:
			radial-gradient(circle at 15% 20%, #ffe3f1 0, transparent 40%),
			radial-gradient(circle at 85% 15%, #e3f0ff 0, transparent 40%),
			radial-gradient(circle at 70% 85%, #e8ffe9 0, transparent 45%), #fff9fc;
	}
	:global(button) {
		font-family: inherit;
		color: inherit;
	}
	.account {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 10px;
		padding: 10px 16px 0;
		font-size: 1.05rem;
		font-weight: 600;
	}
	.account a,
	.account button {
		text-decoration: none;
		color: inherit;
		font: inherit;
		padding: 6px 14px;
		border-radius: 999px;
		border: none;
		background: #fff;
		box-shadow: 0 2px 8px #e9b6d455;
		cursor: pointer;
	}
	.account form {
		margin: 0;
	}
</style>
