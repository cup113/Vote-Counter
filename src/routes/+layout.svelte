<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.ico';

	const UMAMI_SCRIPT_URL = "https://umami.cup11.top/script.js";
	const UMAMI_WEBSITE_ID = "05b27057-0c58-4801-a704-118a75407c73"
	let { children } = $props();
</script>

<svelte:head>
	<!-- 基础 HTML 元数据 -->
	<title>现场计票系统 | 实时投票计票</title>
	<meta name="description" content="实时投票计票系统，支持 48 人大屏显示" />
	<meta name="theme-color" content="#0f172a" />
	<link rel="icon" type="image/x-icon" href={favicon} />
	<link rel="apple-touch-icon" href={favicon} />
	<script defer src={UMAMI_SCRIPT_URL} data-website-id={UMAMI_WEBSITE_ID}></script>
</svelte:head>
{@render children()}
