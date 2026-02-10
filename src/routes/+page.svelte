<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	// --- 类型定义 ---
	interface Candidate {
		id: number;
		name: string;
		votes: number;
	}
	interface LogEntry {
		time: string;
		msg: string;
		candidateId?: number;
		amount?: number;
		invalidVote?: boolean;
	}

	type SortMode = 'import' | 'rank' | 'name';

	// --- 常量 ---
	const STORAGE_KEY = 'vote-system-data';
	const DEFAULT_CANDIDATES = '张三, 李四, 王五';

	// --- 状态 ---
	let title = $state<string>('现场计票系统');
	let candidates = $state<Candidate[]>([]);
	let logs = $state<LogEntry[]>([]);
	let invalidVotes = $state<number>(0);
	let step = $state<number>(1);
	let isSettingsOpen = $state<boolean>(false);
	let isUndoOpen = $state<boolean>(false);
	let settingsInput = $state<string>(DEFAULT_CANDIDATES);
	let editingId = $state<number | null>(null);
	let editingName = $state<string>('');
	let mounted = $state<boolean>(false);
	let editMode = $state<boolean>(false);
	let isPaused = $state<boolean>(false);
	let sortMode = $state<SortMode>('import');
	let animatingIds = $state<Set<number>>(new Set());

	// --- 派生状态 ---
	const validVotes = $derived<number>(candidates.reduce((sum, c) => sum + c.votes, 0));
	const totalVotes = $derived<number>(validVotes + invalidVotes);
	const sortedByRank = $derived<Candidate[]>([...candidates].sort((a, b) => b.votes - a.votes));
	const rankings = $derived.by<Map<number, number>>(() => {
		const map = new Map<number, number>();
		let lastVotes = -1;
		let lastRank = 0;
		sortedByRank.forEach((c, i) => {
			const rank = c.votes === lastVotes ? lastRank : i + 1;
			map.set(c.id, rank);
			lastVotes = c.votes;
			lastRank = rank;
		});
		return map;
	});

	// 计算最大票数用于 heatmap
	const maxVotes = $derived<number>(Math.max(...candidates.map((c) => c.votes), 1));
	const halfMaxVotes = $derived<number>(maxVotes / 2);

	// 排序后的候选人列表
	const displayCandidates = $derived.by<Candidate[]>(() => {
		if (sortMode === 'rank') {
			return sortedByRank;
		} else if (sortMode === 'name') {
			return [...candidates].sort((a, b) => {
				try {
					return new Intl.Collator('zh-CN').compare(a.name, b.name);
				} catch {
					return a.name.localeCompare(b.name);
				}
			});
		}
		return candidates; // 'import' - 保持原始顺序
	});

	// 计算状态 Hash
	const stateHash = $derived.by<string>(() => {
		const state = JSON.stringify({
			candidates: candidates
				.map((c) => ({ id: c.id, votes: c.votes, name: c.name }))
				.sort((a, b) => a.id - b.id),
			invalidVotes
		});
		let hash = 0;
		for (let i = 0; i < state.length; i++) {
			const char = state.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash;
		}
		return Math.abs(hash).toString(36).toUpperCase().slice(0, 5);
	});

	// 最近5票
	const recentVotes = $derived<LogEntry[]>(logs.slice(0, 5));

	// --- 持久化 ---
	function saveToStorage(): void {
		if (!mounted) return;
		const data = { title, candidates, logs, invalidVotes, settingsInput };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	}

	function loadFromStorage(): void {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const data = JSON.parse(raw);
				title = data.title ?? '现场计票系统';
				candidates = data.candidates ?? [];
				logs = data.logs ?? [];
				invalidVotes = data.invalidVotes ?? 0;
				settingsInput = data.settingsInput ?? DEFAULT_CANDIDATES;
			}
		} catch (e) {
			console.error('Failed to load from storage:', e);
		}
	}

	onMount(() => {
		mounted = true;
		loadFromStorage();
		if (candidates.length === 0) {
			parseAndSetCandidates(DEFAULT_CANDIDATES);
		}
	});

	$effect(() => {
		if (mounted) {
			saveToStorage();
		}
	});

	// --- 方法 ---
	function parseAndSetCandidates(input: string): void {
		const names = input
			.split(/[,，\n]/)
			.map((n) => n.trim())
			.filter((n): n is string => n.length > 0);
		candidates = names.map((name, i) => ({
			id: i + 1,
			name,
			votes: 0
		}));
	}

	function addVote(id: number, amount: number): void {
		if (isPaused) return;
		const c = candidates.find((x) => x.id === id);
		if (c) {
			c.votes += amount;
			candidates = [...candidates];
			addLog(`${c.name} ${amount > 0 ? '+' : ''}${amount}`, id, amount);
			triggerAnimation(id);
		}
	}

	function addInvalid(): void {
		if (isPaused) return;
		invalidVotes++;
		addLog('废票 +1', undefined, undefined, true);
	}

	function addLog(msg: string, candidateId?: number, amount?: number, invalidVote?: boolean): void {
		logs = [
			{ time: new Date().toLocaleTimeString(), msg, candidateId, amount, invalidVote },
			...logs
		].slice(0, 60);
	}

	function undoVote(log: LogEntry): void {
		if (log.invalidVote) {
			invalidVotes = Math.max(0, invalidVotes - 1);
			addLog('撤销: ' + log.msg);
		} else if (log.candidateId && log.amount) {
			const c = candidates.find((x) => x.id === log.candidateId);
			if (c) {
				c.votes = Math.max(0, c.votes - log.amount);
				candidates = [...candidates];
				addLog(`撤销: ${log.msg}`);
			}
		}
		// 从日志中移除被撤销的项
		logs = logs.filter((l) => l !== log);
		isUndoOpen = false;
	}

	function triggerAnimation(id: number): void {
		animatingIds.add(id);
		animatingIds = new Set(animatingIds);
		setTimeout(() => {
			animatingIds.delete(id);
			animatingIds = new Set(animatingIds);
		}, 300);
	}

	function addCandidate(): void {
		const maxId = candidates.reduce((m, c) => Math.max(m, c.id), 0);
		candidates = [...candidates, { id: maxId + 1, name: '新成员', votes: 0 }];
		editingId = maxId + 1;
		editingName = '新成员';
	}

	function removeCandidate(id: number): void {
		candidates = candidates.filter((c) => c.id !== id);
	}

	function startEdit(c: Candidate): void {
		editingId = c.id;
		editingName = c.name;
	}

	function commitEdit(): void {
		if (editingId !== null) {
			candidates = candidates.map((c) =>
				c.id === editingId ? { ...c, name: editingName || '未命名' } : c
			);
		}
		editingId = null;
		editingName = '';
	}

	function updateCandidates(): void {
		parseAndSetCandidates(settingsInput);
		logs = [];
		invalidVotes = 0;
		isSettingsOpen = false;
	}

	function resetAll(): void {
		if (confirm('确定要清空所有数据吗？')) {
			candidates = candidates.map((c) => ({ ...c, votes: 0 }));
			invalidVotes = 0;
			logs = [];
		}
	}

	function closeModal(e: MouseEvent): void {
		if (e.currentTarget === e.target) {
			isSettingsOpen = false;
			isUndoOpen = false;
		}
	}

	function toggleFullscreen(): void {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	}

	function cycleSortMode(): void {
		if (sortMode === 'import') sortMode = 'rank';
		else if (sortMode === 'rank') sortMode = 'name';
		else sortMode = 'import';
	}

	// Heatmap 颜色计算
	function getHeatmapColor(votes: number): string {
		const ratio = votes / maxVotes;
		if (ratio === 0) return 'rgb(255, 255, 255)';
		// 从白色到蓝色渐变
		const blue = Math.floor(255 - ratio * 100);
		const green = Math.floor(255 - ratio * 80);
		return `rgb(${blue}, ${green}, 255)`;
	}

	function isTopHalf(votes: number): boolean {
		return votes >= halfMaxVotes && maxVotes > 0;
	}
</script>

<div class="min-h-screen bg-slate-100 p-3 font-sans text-slate-900 md:p-4">
	<!-- 顶部栏 -->
	<header class="mx-auto mb-4 flex max-w-7xl items-center justify-between px-2">
		<div class="flex items-center gap-3">
			<span class="text-3xl">🗳️</span>
			<h1 class="text-xl font-bold text-slate-700">{title}</h1>
			<span class="ml-2 rounded bg-slate-200 px-3 py-1 text-sm font-medium">
				{candidates.length}人
			</span>
		</div>
		<div class="flex items-center gap-3">
			<!-- 统计徽章 -->
			<div class="flex gap-2 text-sm">
				<span class="rounded bg-blue-100 px-3 py-1.5 font-medium text-blue-700">
					有效票数 {validVotes}
				</span>
				<span class="rounded bg-red-100 px-3 py-1.5 font-medium text-red-600">
					废票数 {invalidVotes}
				</span>
				<span class="rounded bg-slate-200 px-3 py-1.5 font-medium text-slate-600">
					总票数 {totalVotes}
				</span>
			</div>

			<!-- 全屏按钮 -->
			<button
				type="button"
				onclick={toggleFullscreen}
				class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200"
				aria-label="全屏"
				title="全屏"
			>
				⛶
			</button>

			<!-- 设置按钮 -->
			<button
				type="button"
				onclick={() => (isSettingsOpen = true)}
				class="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200"
				aria-label="设置"
				title="设置"
			>
				⚙️
			</button>
		</div>
	</header>

	<!-- 控制栏 -->
	<div class="mx-auto mb-4 flex max-w-7xl items-center gap-3 px-2">
		<div class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
			<span class="text-slate-500">步长:</span>
			<input
				type="number"
				bind:value={step}
				class="w-12 rounded border-none bg-slate-100 px-2 py-1 text-center font-bold"
			/>
		</div>

		<button
			type="button"
			onclick={addInvalid}
			class="rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
			disabled={isPaused}
		>
			+废票
		</button>

		<!-- 排序切换 -->
		<button
			type="button"
			onclick={cycleSortMode}
			class="rounded-lg bg-purple-50 px-4 py-2 text-sm font-bold text-purple-600 hover:bg-purple-100"
			title="切换排序"
		>
			{sortMode === 'import' ? '📋 导入序' : sortMode === 'rank' ? '🏆 排名序' : '🔤 字母序'}
		</button>

		<!-- 编辑模式 -->
		<button
			type="button"
			onclick={() => (editMode = !editMode)}
			class="rounded-lg px-4 py-2 text-sm font-bold transition-colors {editMode
				? 'bg-orange-500 text-white'
				: 'bg-orange-50 text-orange-600 hover:bg-orange-100'}"
		>
			{editMode ? '🔒 编辑中，点击锁定' : '🔓 进入编辑模式'}
		</button>

		<!-- 快捷撤销 -->
		<button
			type="button"
			onclick={() => (isUndoOpen = true)}
			class="rounded-lg bg-yellow-50 px-4 py-2 text-sm font-bold text-yellow-700 hover:bg-yellow-100"
			disabled={logs.length === 0}
		>
			↶ 撤销
		</button>

		<!-- 暂停 -->
		<button
			type="button"
			onclick={() => (isPaused = !isPaused)}
			class="rounded-lg px-4 py-2 text-sm font-bold transition-colors {isPaused
				? 'bg-red-500 text-white'
				: 'bg-green-50 text-green-600 hover:bg-green-100'}"
		>
			{isPaused ? '▶️ 已暂停' : '⏸ 点击暂停'}
		</button>

		<div class="flex-1"></div>
		{#if editMode}
			<div class="text-sm text-slate-400">
				<strong>编辑模式</strong>：可删除候选人、显示减票按钮
			</div>
		{/if}
	</div>

	<!-- 主区域 -->
	<main class="mx-auto max-w-7xl">
		<!-- 人员网格 - 紧凑模式 -->
		<div
			class="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12"
		>
			{#each displayCandidates as c (c.id)}
				<div
					class="group relative flex flex-col rounded-lg p-3 shadow-sm transition-all hover:shadow-md {isTopHalf(
						c.votes
					)
						? 'ring-2 ring-blue-400'
						: 'ring-1 ring-slate-200'} {animatingIds.has(c.id) ? 'animate-flash' : ''}"
					style="background-color: {getHeatmapColor(c.votes)}"
				>
					<!-- 排名角标 -->
					<div
						class="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold {rankings.get(
							c.id
						) === 1
							? 'bg-yellow-400 text-yellow-900'
							: rankings.get(c.id) === 2
								? 'bg-slate-300 text-slate-700'
								: rankings.get(c.id) === 3
									? 'bg-amber-600 text-white'
									: 'bg-slate-200 text-slate-500'}"
					>
						{rankings.get(c.id)}
					</div>

					<!-- 名字 -->
					{#if editingId === c.id}
						<input
							type="text"
							bind:value={editingName}
							onblur={commitEdit}
							onkeydown={(e) => e.key === 'Enter' && commitEdit()}
							class="mt-2 w-full rounded border border-blue-300 px-2 py-1 text-center text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
							autofocus
						/>
					{:else}
						<button
							type="button"
							onclick={() => startEdit(c)}
							class="mt-2 truncate text-center text-lg font-bold text-slate-800 hover:text-blue-600"
							title="点击编辑"
						>
							{c.name}
						</button>
					{/if}

					<!-- 票数显示/按钮 -->
					<div class="mt-2 flex gap-1">
						{#if editMode}
							<!-- 编辑模式：显示减票按钮 -->
							<button
								type="button"
								onclick={() => addVote(c.id, -step)}
								class="flex-1 rounded-md bg-red-500 py-2 text-lg font-black text-white transition-all hover:bg-red-600 active:scale-95"
								title="减票"
								disabled={isPaused}
							>
								−
							</button>
						{/if}
						<button
							type="button"
							onclick={() => addVote(c.id, step)}
							oncontextmenu={(e) => {
								e.preventDefault();
								if (!editMode) addVote(c.id, -step);
							}}
							class="rounded-md bg-blue-500 py-2 text-xl font-black text-white transition-all hover:bg-blue-600 active:scale-95 {editMode
								? 'flex-1'
								: 'w-full'} {animatingIds.has(c.id) ? 'animate-bounce-vote' : ''}"
							title={editMode ? '加票' : '左键加票，右键减票'}
							disabled={isPaused}
						>
							{c.votes}
						</button>
					</div>

					<!-- 删除按钮 - 仅编辑模式 -->
					{#if editMode}
						<button
							type="button"
							onclick={() => removeCandidate(c.id)}
							class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
							title="删除"
						>
							✕
						</button>
					{/if}
				</div>
			{/each}

			<!-- 添加按钮 - 仅编辑模式 -->
			{#if editMode}
				<button
					type="button"
					onclick={addCandidate}
					class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-3 text-slate-400 transition-colors hover:border-blue-400 hover:text-blue-500"
				>
					<span class="text-2xl">+</span>
				</button>
			{/if}
		</div>

		<!-- 底部日志区 (可折叠) -->
		<details class="mx-auto mt-4 max-w-7xl">
			<summary
				class="cursor-pointer rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm hover:text-slate-800"
			>
				📋 操作记录 ({logs.length})
			</summary>
			<div
				class="mt-2 grid max-h-40 grid-cols-2 gap-x-12 overflow-y-auto rounded-lg bg-white p-3 shadow-sm lg:grid-cols-4"
			>
				{#each logs as log}
					<div class="flex justify-between border-b border-slate-100 py-1 text-sm last:border-0">
						<span class="text-slate-600">{log.msg}</span>
						<span class="text-slate-400">{log.time}</span>
					</div>
				{:else}
					<p class="text-center text-sm text-slate-400">暂无记录</p>
				{/each}
			</div>
		</details>
	</main>
	<!-- Footer 区域 -->
	<footer class="mx-auto mt-6 max-w-7xl border-t border-slate-200 bg-white/50 px-4 py-4">
		<div class="flex flex-col items-center justify-between gap-2 sm:flex-row">
			<div class="flex items-center gap-3 text-xs text-slate-500">
				<span>© 2021-2026 Jason Li</span>
				<span class="hidden sm:inline">·</span>
				<a
					href="https://github.com/cup113/Vote-Counter"
					target="_blank"
					class="flex items-center gap-1 hover:text-blue-600"
				>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>v3.0.0</span>
				</a>
			</div>
			<div class="flex items-center gap-3 text-xs text-slate-500">
				<a
					href="https://mit-license.org/"
					target="_blank"
					class="hover:text-blue-600"
				>
					MIT License
				</a>
				<span class="hidden sm:inline">·</span>
				<a
					href="https://github.com/cup113/Vote-Counter/issues"
					target="_blank"
					class="hover:text-blue-600"
				>
					Report Issue
				</a>
			</div>
		</div>
	</footer>
</div>

<!-- 暂停遮罩 -->
{#if isPaused}
	<div
		class="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
	>
		<div class="rounded-2xl bg-white/95 p-8 text-center shadow-2xl">
			<div class="mb-4 text-6xl">⏸</div>
			<div class="mb-2 text-2xl font-bold text-slate-700">投票已暂停</div>
			<div class="mb-4 text-sm text-slate-500">状态已锁定</div>
			<div class="rounded-lg bg-slate-100 px-6 py-3">
				<div class="text-xs text-slate-500">状态校验码</div>
				<div class="mt-1 font-mono text-3xl font-black text-blue-600">{stateHash}</div>
			</div>
			<div class="mt-4">
				<button
					type="button"
					class="rounded-lg bg-green-50 px-4 py-2 text-lg font-bold text-green-600 hover:bg-green-100"
					onclick={() => (isPaused = false)}>继续</button
				>
			</div>
		</div>
	</div>
{/if}

<!-- 快捷撤销弹窗 -->
{#if isUndoOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
		onclick={closeModal}
		role="dialog"
		aria-modal="true"
	>
		<div
			transition:fade={{ duration: 150 }}
			class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between border-b border-slate-100 p-4">
				<h2 class="text-lg font-bold">↶ 快捷撤销</h2>
				<button
					type="button"
					onclick={() => (isUndoOpen = false)}
					class="text-slate-400 hover:text-slate-600"
				>
					✕
				</button>
			</div>

			<div class="p-4">
				{#if recentVotes.length > 0}
					<div class="space-y-2">
						{#each recentVotes as log}
							<div
								class="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
							>
								<div class="flex-1">
									<div class="font-medium text-slate-700">{log.msg}</div>
									<div class="text-xs text-slate-400">{log.time}</div>
								</div>
								<button
									type="button"
									onclick={() => undoVote(log)}
									class="ml-3 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
								>
									撤销
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="py-8 text-center text-sm text-slate-400">暂无可撤销的操作</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- 设置弹窗 -->
{#if isSettingsOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
		onclick={closeModal}
		role="dialog"
		aria-modal="true"
	>
		<div
			transition:fade={{ duration: 150 }}
			class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between border-b border-slate-100 p-4">
				<h2 class="text-lg font-bold">⚙️ 系统设置</h2>
				<button
					type="button"
					onclick={() => (isSettingsOpen = false)}
					class="text-slate-400 hover:text-slate-600"
				>
					✕
				</button>
			</div>

			<div class="space-y-4 p-4">
				<div>
					<label class="mb-2 block text-sm font-bold text-slate-600">投票标题</label>
					<input
						type="text"
						bind:value={title}
						class="w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label class="mb-2 block text-sm font-bold text-slate-600">
						批量导入 (逗号或换行分隔)
					</label>
					<textarea
						bind:value={settingsInput}
						rows={6}
						class="w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-blue-500"
						placeholder="张三&#10;李四&#10;王五&#10;或: 张三, 李四, 王五"
					></textarea>
					<p class="mt-2 text-xs text-slate-400">💡 提示：支持逗号分隔或每行一个名字</p>
				</div>

				<!-- 当前人员列表 -->
				<div>
					<label class="mb-2 block text-sm font-bold text-slate-600">
						当前人员 ({candidates.length})
					</label>
					<div class="max-h-40 overflow-y-auto rounded-lg bg-slate-50 p-3">
						<div class="flex flex-wrap gap-2">
							{#each candidates as c}
								<span class="rounded bg-white px-3 py-1 text-sm shadow-sm">
									{c.name}
								</span>
							{/each}
						</div>
					</div>
				</div>

				<div class="flex gap-2 pt-2">
					<button
						type="button"
						onclick={updateCandidates}
						class="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700"
					>
						✓ 应用名单
					</button>
					<button
						type="button"
						onclick={resetAll}
						class="rounded-lg bg-red-50 px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-100"
					>
						重置票数
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@reference 'tailwindcss';

	details > summary {
		list-style: none;
	}
	details > summary::-webkit-details-marker {
		display: none;
	}

	/* 闪烁动画 */
	@keyframes flash {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
			transform: scale(1.02);
		}
	}

	.animate-flash {
		animation: flash 0.3s ease-in-out;
	}

	/* 票数弹跳动画 */
	@keyframes bounce-vote {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.15);
		}
	}

	.animate-bounce-vote {
		animation: bounce-vote 0.3s ease-in-out;
	}
</style>
