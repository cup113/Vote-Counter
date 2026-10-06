<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import {
		ArrowDownAZ,
		ArrowUpDown,
		Ban,
		Check,
		History,
		Lightbulb,
		ListOrdered,
		Lock,
		LockOpen,
		Maximize,
		Minimize,
		Minus,
		Pause,
		Play,
		Plus,
		RotateCcw,
		Settings,
		Trophy,
		Undo2,
		Users,
		Vote,
		X
	} from '$lib/icons';

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
	const MIN_STEP = 1;
	const MAX_STEP = 999;

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
	let isFullscreen = $state<boolean>(false);
	let sortMode = $state<SortMode>('import');
	let animatingIds = new SvelteSet<number>();

	// --- 派生状态 ---
	const validVotes = $derived<number>(candidates.reduce((sum, c) => sum + c.votes, 0));
	const totalVotes = $derived<number>(validVotes + invalidVotes);
	const sortedByRank = $derived<Candidate[]>([...candidates].sort((a, b) => b.votes - a.votes));
	const rankings = $derived.by<Map<number, number>>(() => {
		const map = new SvelteMap<number, number>();
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
		const syncFullscreen = (): void => {
			isFullscreen = document.fullscreenElement !== null;
		};
		document.addEventListener('fullscreenchange', syncFullscreen);
		return () => document.removeEventListener('fullscreenchange', syncFullscreen);
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

	// 步长钳制：保证每次点击增减的票量始终是 1–999 的整数
	function clampStep(value: number): number {
		if (!Number.isFinite(value)) return MIN_STEP;
		return Math.min(MAX_STEP, Math.max(MIN_STEP, Math.round(value)));
	}

	function bumpStep(delta: number): void {
		step = clampStep(step + delta);
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
		setTimeout(() => animatingIds.delete(id), 300);
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
			document.documentElement.requestFullscreen().catch(() => {});
		} else {
			document.exitFullscreen().catch(() => {});
		}
	}

	// 重命名输入框出现时聚焦并选中原名（替代 autofocus，避免 a11y 警告）
	function focusOnMount(node: HTMLInputElement): void {
		node.focus();
		node.select();
	}

	// Heatmap：以强调色低透明度坡道叠加在面板底色上，保证深色文字始终可读
	function getHeatmapColor(votes: number): string {
		const ratio = maxVotes > 0 ? votes / maxVotes : 0;
		if (ratio <= 0) return 'var(--color-console-surface)';
		const pct = 6 + Math.round(ratio * 34);
		return `color-mix(in srgb, var(--color-accent) ${pct}%, var(--color-console-surface))`;
	}

	function isTopHalf(votes: number): boolean {
		return votes >= halfMaxVotes && maxVotes > 0;
	}
</script>

<div class="min-h-screen bg-console-bg p-3 font-sans text-console-ink md:p-4">
	<!-- 顶部栏：品牌 + 人数 + 票数读数 + 工具按钮 -->
	<header class="mx-auto mb-3 flex max-w-7xl flex-wrap items-center justify-between gap-3 px-2">
		<div class="flex items-center gap-2.5">
			<span
				class="grid h-9 w-9 place-items-center rounded-console border border-console-line bg-console-surface text-console-ink"
			>
				<Vote size={18} />
			</span>
			<h1 class="text-base font-semibold tracking-tight text-console-ink">{title}</h1>
			<span
				class="flex items-center gap-1 rounded-console border border-console-line bg-console-surface px-2 py-1 font-mono text-xs text-console-muted tabular-nums"
				title="候选人数量"
			>
				<Users size={12} />
				{candidates.length}
			</span>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<!-- 读数面板 -->
			<div
				class="flex items-stretch divide-x divide-console-line rounded-console border border-console-line bg-console-surface"
				role="group"
				aria-label="票数读数"
			>
				<div class="flex flex-col justify-center px-3 py-1">
					<span class="text-[10px] leading-none font-medium tracking-[0.08em] text-console-faint"
						>有效票</span
					>
					<span class="mt-0.5 font-mono text-base leading-none font-semibold tabular-nums"
						>{validVotes}</span
					>
				</div>
				<div class="flex flex-col justify-center px-3 py-1">
					<span class="text-[10px] leading-none font-medium tracking-[0.08em] text-console-faint"
						>废票</span
					>
					<span
						class="mt-0.5 font-mono text-base leading-none font-semibold text-danger tabular-nums"
						>{invalidVotes}</span
					>
				</div>
				<div class="flex flex-col justify-center px-3 py-1">
					<span class="text-[10px] leading-none font-medium tracking-[0.08em] text-console-faint"
						>总计</span
					>
					<span class="mt-0.5 font-mono text-base leading-none font-semibold tabular-nums"
						>{totalVotes}</span
					>
				</div>
			</div>

			<div class="flex items-center gap-1.5">
				<button
					type="button"
					onclick={toggleFullscreen}
					class="grid h-9 w-9 place-items-center rounded-console border border-console-line bg-console-surface text-console-muted transition-colors hover:bg-console-raise hover:text-console-ink"
					aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
					title={isFullscreen ? '退出全屏' : '进入全屏'}
				>
					{#if isFullscreen}
						<Minimize size={16} />
					{:else}
						<Maximize size={16} />
					{/if}
				</button>

				<button
					type="button"
					onclick={() => (isSettingsOpen = true)}
					class="grid h-9 w-9 place-items-center rounded-console border border-console-line bg-console-surface text-console-muted transition-colors hover:bg-console-raise hover:text-console-ink"
					aria-label="设置"
					title="设置"
				>
					<Settings size={16} />
				</button>
			</div>
		</div>
	</header>

	<!-- 控制栏：步长 / 废票 / 顺序 / 模式 / 运行状态，一格一组的模块化单元 -->
	<section
		aria-label="控制台"
		class="mx-auto mb-3 flex max-w-7xl flex-wrap items-stretch gap-2 px-2"
	>
		<!-- 步长 -->
		<div
			role="group"
			aria-label="步长"
			class="flex items-center gap-2 rounded-console border border-console-line bg-console-surface px-2.5 py-1.5"
		>
			<ArrowUpDown size={14} class="shrink-0 text-console-faint" />
			<span class="text-[10px] leading-none font-medium tracking-[0.08em] text-console-faint"
				>步长</span
			>
			<div
				class="flex items-stretch divide-x divide-console-line overflow-hidden rounded-console border border-console-line"
			>
				<button
					type="button"
					onclick={() => bumpStep(-1)}
					disabled={step <= MIN_STEP}
					class="grid h-8 w-8 place-items-center text-console-muted transition-colors hover:bg-console-raise hover:text-console-ink disabled:opacity-40 disabled:hover:bg-transparent"
					aria-label="减小步长"
					title="减小步长"
				>
					<Minus size={14} />
				</button>
				<input
					type="number"
					min={MIN_STEP}
					max={MAX_STEP}
					step="1"
					inputmode="numeric"
					bind:value={step}
					onblur={() => (step = clampStep(step))}
					class="w-12 [appearance:textfield] bg-transparent text-center font-mono text-sm text-console-ink tabular-nums focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
					aria-label="步长数值"
					title="每次点击增减的票数（1–999）"
				/>
				<button
					type="button"
					onclick={() => bumpStep(1)}
					disabled={step >= MAX_STEP}
					class="grid h-8 w-8 place-items-center text-console-muted transition-colors hover:bg-console-raise hover:text-console-ink disabled:opacity-40 disabled:hover:bg-transparent"
					aria-label="增大步长"
					title="增大步长"
				>
					<Plus size={14} />
				</button>
			</div>
		</div>

		<!-- 废票 -->
		<div
			role="group"
			aria-label="废票"
			class="flex items-center gap-2 rounded-console border border-console-line bg-console-surface px-2.5 py-1.5"
		>
			<Ban size={14} class="shrink-0 text-console-faint" />
			<span class="text-[10px] leading-none font-medium tracking-[0.08em] text-console-faint"
				>废票</span
			>
			<button
				type="button"
				onclick={addInvalid}
				disabled={isPaused}
				class="flex h-8 items-center gap-1.5 rounded-console border border-danger/40 bg-danger-soft px-2.5 text-xs font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-40"
				title="新增 1 张废票"
			>
				<Ban size={13} />
				+1
			</button>
		</div>

		<!-- 顺序 -->
		<div
			role="group"
			aria-label="候选人显示顺序"
			class="flex items-center gap-2 rounded-console border border-console-line bg-console-surface px-2.5 py-1.5"
		>
			<span class="text-[10px] leading-none font-medium tracking-[0.08em] text-console-faint"
				>顺序</span
			>
			<div
				class="flex items-stretch divide-x divide-console-line overflow-hidden rounded-console border border-console-line"
			>
				<button
					type="button"
					onclick={() => (sortMode = 'import')}
					aria-pressed={sortMode === 'import'}
					class="flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors {sortMode ===
					'import'
						? 'bg-accent text-white'
						: 'text-console-muted hover:bg-console-raise hover:text-console-ink'}"
					title="按导入顺序显示"
				>
					<ListOrdered size={13} />
					导入序
				</button>
				<button
					type="button"
					onclick={() => (sortMode = 'rank')}
					aria-pressed={sortMode === 'rank'}
					class="flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors {sortMode ===
					'rank'
						? 'bg-accent text-white'
						: 'text-console-muted hover:bg-console-raise hover:text-console-ink'}"
					title="按票数排名显示"
				>
					<Trophy size={13} />
					排名序
				</button>
				<button
					type="button"
					onclick={() => (sortMode = 'name')}
					aria-pressed={sortMode === 'name'}
					class="flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium transition-colors {sortMode ===
					'name'
						? 'bg-accent text-white'
						: 'text-console-muted hover:bg-console-raise hover:text-console-ink'}"
					title="按姓名排序显示"
				>
					<ArrowDownAZ size={13} />
					字母序
				</button>
			</div>
		</div>

		<!-- 模式与操作 -->
		<div
			role="group"
			aria-label="模式与操作"
			class="flex items-center gap-2 rounded-console border border-console-line bg-console-surface px-2.5 py-1.5"
		>
			<span class="text-[10px] leading-none font-medium tracking-[0.08em] text-console-faint"
				>模式</span
			>
			<button
				type="button"
				onclick={() => (editMode = !editMode)}
				class="flex h-8 items-center gap-1.5 rounded-console border px-2.5 text-xs font-medium transition-colors {editMode
					? 'border-console-ink bg-console-ink text-white'
					: 'border-console-line bg-console-surface text-console-muted hover:bg-console-raise hover:text-console-ink'}"
				aria-label={editMode ? '编辑模式已开启，点击关闭' : '编辑模式已关闭，点击开启'}
				title="编辑模式：可删除候选人并显示减票按钮"
			>
				{#if editMode}
					<LockOpen size={13} />
					编辑中
				{:else}
					<Lock size={13} />
					编辑模式
				{/if}
			</button>
			<button
				type="button"
				onclick={() => (isUndoOpen = true)}
				disabled={logs.length === 0}
				class="flex h-8 items-center gap-1.5 rounded-console border border-console-line bg-console-surface px-2.5 text-xs font-medium text-console-muted transition-colors hover:bg-console-raise hover:text-console-ink disabled:opacity-40 disabled:hover:bg-console-surface"
				title="撤销最近一次操作"
			>
				<Undo2 size={13} />
				撤销
			</button>
			{#if editMode}
				<span class="hidden text-[10px] leading-none text-console-faint lg:inline"
					>可删除候选人 · 显示减票</span
				>
			{/if}
		</div>

		<div class="hidden flex-1 md:block"></div>

		<!-- 运行状态 -->
		<div
			role="group"
			aria-label="运行状态"
			class="flex items-center gap-2 rounded-console border border-console-line bg-console-surface px-2.5 py-1.5"
		>
			<span class="text-[10px] leading-none font-medium tracking-[0.08em] text-console-faint"
				>运行状态</span
			>
			<button
				type="button"
				onclick={() => (isPaused = !isPaused)}
				class="flex h-8 items-center gap-1.5 rounded-console border px-2.5 text-xs font-medium transition-colors {isPaused
					? 'border-danger bg-danger text-white hover:bg-danger/90'
					: 'border-console-line bg-console-surface text-console-muted hover:bg-console-raise hover:text-console-ink'}"
				aria-label={isPaused ? '投票已暂停，点击继续' : '投票进行中，点击暂停'}
				title={isPaused ? '继续投票' : '暂停投票并锁定状态'}
			>
				{#if isPaused}
					<Play size={13} />
					继续
				{:else}
					<Pause size={13} />
					暂停
				{/if}
			</button>
		</div>
	</section>

	<!-- 主区域 -->
	<main class="mx-auto max-w-7xl px-2">
		<!-- 人员网格 - 紧凑模式 -->
		<div
			class="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12"
		>
			{#each displayCandidates as c (c.id)}
				<div
					class="group relative flex flex-col rounded-console border bg-console-surface p-2.5 transition-shadow hover:border-console-line-strong {isTopHalf(
						c.votes
					)
						? 'border-console-line-strong'
						: 'border-console-line'} {rankings.get(c.id) === 1
						? 'ring-2 ring-accent'
						: ''} {animatingIds.has(c.id) ? 'animate-flash' : ''}"
					style="background-color: {getHeatmapColor(c.votes)}"
				>
					<!-- 排名角标 -->
					<span
						class="absolute -top-1.5 -left-1.5 grid h-5 min-w-5 place-items-center rounded-console border px-1 font-mono text-[11px] leading-none tabular-nums {rankings.get(
							c.id
						) === 1
							? 'border-accent bg-accent text-white'
							: 'border-console-line bg-console-surface text-console-muted'}"
					>
						{rankings.get(c.id)}
					</span>

					<!-- 名字 -->
					{#if editingId === c.id}
						<input
							type="text"
							bind:value={editingName}
							onblur={commitEdit}
							onkeydown={(e) => e.key === 'Enter' && commitEdit()}
							class="mt-2 w-full rounded-console border border-accent bg-console-surface px-2 py-1 text-center text-base font-semibold text-console-ink focus:outline-none"
							use:focusOnMount
						/>
					{:else}
						<button
							type="button"
							onclick={() => startEdit(c)}
							class="mt-2 truncate text-center text-base font-semibold tracking-tight text-console-ink transition-colors hover:text-accent"
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
								onclick={() => addVote(c.id, -clampStep(step))}
								class="rounded-console border border-danger/40 bg-danger-soft px-2.5 py-1.5 text-danger transition-colors hover:bg-danger/10 disabled:opacity-40"
								title="减票"
								aria-label="为 {c.name} 减票"
								disabled={isPaused}
							>
								<Minus size={14} />
							</button>
						{/if}
						<button
							type="button"
							onclick={() => addVote(c.id, clampStep(step))}
							oncontextmenu={(e) => {
								e.preventDefault();
								if (!editMode) addVote(c.id, -clampStep(step));
							}}
							class="rounded-console bg-console-ink py-1.5 font-mono text-lg leading-none font-semibold text-white tabular-nums transition-all hover:bg-black active:scale-95 disabled:opacity-40 {editMode
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
							class="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-console border border-danger/40 bg-console-surface text-danger transition-colors hover:bg-danger-soft"
							aria-label="删除 {c.name}"
							title="删除"
						>
							<X size={12} />
						</button>
					{/if}
				</div>
			{/each}

			<!-- 添加按钮 - 仅编辑模式 -->
			{#if editMode}
				<button
					type="button"
					onclick={addCandidate}
					class="flex flex-col items-center justify-center gap-1 rounded-console border border-dashed border-console-line-strong p-2.5 text-console-faint transition-colors hover:border-accent hover:text-accent"
					title="新增候选人"
				>
					<Plus size={18} />
					<span class="text-[10px] leading-none tracking-[0.08em]">新增</span>
				</button>
			{/if}
		</div>

		<!-- 底部日志区 (可折叠) -->
		<details class="mx-auto mt-3 max-w-7xl">
			<summary
				class="flex cursor-pointer items-center gap-2 rounded-console border border-console-line bg-console-surface px-3 py-2 text-xs font-medium text-console-muted transition-colors hover:text-console-ink"
			>
				<History size={14} />
				操作记录
				<span class="font-mono text-[11px] text-console-faint tabular-nums">{logs.length}</span>
			</summary>
			<div
				class="mt-2 grid max-h-40 grid-cols-1 gap-x-8 overflow-y-auto rounded-console border border-console-line bg-console-surface p-1 lg:grid-cols-3"
			>
				{#each logs as log (log)}
					<div
						class="flex items-baseline justify-between gap-3 border-b border-console-line px-2 py-1 text-xs last:border-0"
					>
						<span class="truncate text-console-ink">{log.msg}</span>
						<span class="shrink-0 font-mono text-[11px] text-console-faint tabular-nums"
							>{log.time}</span
						>
					</div>
				{:else}
					<p class="px-2 py-3 text-xs text-console-faint">暂无记录</p>
				{/each}
			</div>
		</details>
	</main>

	<!-- Footer 区域 -->
	<footer class="mx-auto mt-5 max-w-7xl border-t border-console-line px-2 py-4">
		<div class="flex flex-col items-center justify-between gap-2 sm:flex-row">
			<div class="flex items-center gap-3 text-[11px] text-console-faint">
				<span>© 2021-2026 Jason Li</span>
				<span class="hidden sm:inline">·</span>
				<a
					href="https://github.com/cup113/Vote-Counter"
					target="_blank"
					rel="noreferrer"
					class="flex items-center gap-1.5 font-mono transition-colors hover:text-accent"
				>
					<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>v3.1.0</span>
				</a>
			</div>
			<div class="flex items-center gap-3 text-[11px] text-console-faint">
				<a
					href="https://mit-license.org/"
					target="_blank"
					rel="noreferrer"
					class="transition-colors hover:text-accent">MIT License</a
				>
				<span class="hidden sm:inline">·</span>
				<a
					href="https://github.com/cup113/Vote-Counter/issues"
					target="_blank"
					rel="noreferrer"
					class="transition-colors hover:text-accent">Report Issue</a
				>
			</div>
		</div>
	</footer>
</div>

<!-- 暂停遮罩 -->
{#if isPaused}
	<div
		class="fixed inset-0 z-40 flex items-center justify-center bg-console-ink/40 p-4 backdrop-blur-[2px]"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="w-full max-w-sm rounded-console border border-console-line bg-console-surface p-6 text-center shadow-lg"
		>
			<div
				class="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-console border border-console-line bg-console-raise text-console-ink"
			>
				<Pause size={24} />
			</div>
			<div class="text-lg font-semibold text-console-ink">投票已暂停</div>
			<div class="mt-1 flex items-center justify-center gap-1.5 text-xs text-console-faint">
				<Lock size={12} />
				状态已锁定
			</div>
			<div class="mt-4 rounded-console border border-console-line bg-console-raise px-4 py-3">
				<div class="text-[10px] tracking-[0.08em] text-console-faint">状态校验码</div>
				<div class="mt-1 font-mono text-2xl font-semibold tracking-[0.15em] text-accent">
					{stateHash}
				</div>
			</div>
			<button
				type="button"
				class="mt-4 flex h-9 w-full items-center justify-center gap-1.5 rounded-console bg-console-ink text-sm font-medium text-white transition-colors hover:bg-black"
				onclick={() => (isPaused = false)}
			>
				<Play size={15} />
				继续
			</button>
		</div>
	</div>
{/if}

<!-- 快捷撤销弹窗 -->
{#if isUndoOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-console-ink/50 p-4 backdrop-blur-[2px]"
		onclick={closeModal}
		role="presentation"
	>
		<div
			transition:fade={{ duration: 150 }}
			class="w-full max-w-md overflow-hidden rounded-console border border-console-line bg-console-surface shadow-lg"
			role="dialog"
			aria-modal="true"
			aria-label="快捷撤销"
			tabindex="-1"
		>
			<div class="flex items-center justify-between border-b border-console-line px-4 py-3">
				<h2 class="flex items-center gap-2 text-sm font-semibold text-console-ink">
					<Undo2 size={15} />
					快捷撤销
				</h2>
				<button
					type="button"
					onclick={() => (isUndoOpen = false)}
					class="grid h-8 w-8 place-items-center rounded-console text-console-muted transition-colors hover:bg-console-raise hover:text-console-ink"
					aria-label="关闭"
					title="关闭"
				>
					<X size={15} />
				</button>
			</div>

			<div class="p-4">
				{#if recentVotes.length > 0}
					<div
						class="divide-y divide-console-line overflow-hidden rounded-console border border-console-line"
					>
						{#each recentVotes as log (log)}
							<div class="flex items-center justify-between gap-3 px-3 py-2 hover:bg-console-raise">
								<div class="min-w-0 flex-1">
									<div class="truncate text-sm text-console-ink">{log.msg}</div>
									<div class="font-mono text-[11px] text-console-faint tabular-nums">
										{log.time}
									</div>
								</div>
								<button
									type="button"
									onclick={() => undoVote(log)}
									class="shrink-0 rounded-console border border-danger/40 bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
									aria-label="撤销 {log.msg}"
								>
									撤销
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="py-8 text-center text-sm text-console-faint">暂无可撤销的操作</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- 设置弹窗 -->
{#if isSettingsOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-console-ink/50 p-4 backdrop-blur-[2px]"
		onclick={closeModal}
		role="presentation"
	>
		<div
			transition:fade={{ duration: 150 }}
			class="w-full max-w-lg overflow-hidden rounded-console border border-console-line bg-console-surface shadow-lg"
			role="dialog"
			aria-modal="true"
			aria-label="系统设置"
			tabindex="-1"
		>
			<div class="flex items-center justify-between border-b border-console-line px-4 py-3">
				<h2 class="flex items-center gap-2 text-sm font-semibold text-console-ink">
					<Settings size={15} />
					系统设置
				</h2>
				<button
					type="button"
					onclick={() => (isSettingsOpen = false)}
					class="grid h-8 w-8 place-items-center rounded-console text-console-muted transition-colors hover:bg-console-raise hover:text-console-ink"
					aria-label="关闭"
					title="关闭"
				>
					<X size={15} />
				</button>
			</div>

			<div class="space-y-4 p-4">
				<div>
					<label
						for="settings-title"
						class="mb-1.5 block text-[10px] font-medium tracking-[0.08em] text-console-faint"
						>投票标题</label
					>
					<input
						id="settings-title"
						type="text"
						bind:value={title}
						class="w-full rounded-console border border-console-line bg-console-surface px-3 py-2 text-sm text-console-ink focus:border-accent focus:outline-none"
					/>
				</div>

				<div>
					<label
						for="settings-candidates"
						class="mb-1.5 block text-[10px] font-medium tracking-[0.08em] text-console-faint"
					>
						批量导入 (逗号或换行分隔)
					</label>
					<textarea
						id="settings-candidates"
						bind:value={settingsInput}
						rows={6}
						class="w-full rounded-console border border-console-line bg-console-surface px-3 py-2 text-sm text-console-ink focus:border-accent focus:outline-none"
						placeholder="张三&#10;李四&#10;王五&#10;或: 张三, 李四, 王五"
					></textarea>
					<p class="mt-1.5 flex items-center gap-1.5 text-[11px] text-console-faint">
						<Lightbulb size={12} />
						支持逗号分隔或每行一个名字
					</p>
				</div>

				<!-- 当前人员列表 -->
				<div>
					<span class="mb-1.5 block text-[10px] font-medium tracking-[0.08em] text-console-faint">
						当前人员 ({candidates.length})
					</span>
					<div
						class="max-h-40 overflow-y-auto rounded-console border border-console-line bg-console-raise p-2"
					>
						<div class="flex flex-wrap gap-1.5">
							{#each candidates as c (c.id)}
								<span
									class="rounded-console border border-console-line bg-console-surface px-2 py-1 text-xs text-console-ink"
								>
									{c.name}
								</span>
							{/each}
						</div>
					</div>
				</div>

				<div class="flex gap-2 pt-1">
					<button
						type="button"
						onclick={updateCandidates}
						class="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-console bg-console-ink text-sm font-medium text-white transition-colors hover:bg-black"
					>
						<Check size={15} />
						应用名单
					</button>
					<button
						type="button"
						onclick={resetAll}
						class="flex h-10 items-center gap-1.5 rounded-console border border-danger/40 bg-danger-soft px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
					>
						<RotateCcw size={15} />
						重置票数
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
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

	@media (prefers-reduced-motion: reduce) {
		.animate-flash,
		.animate-bounce-vote {
			animation: none;
		}
	}
</style>
