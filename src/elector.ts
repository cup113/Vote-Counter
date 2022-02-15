/**
 * @file 创建选举人类及方法
 */
/// <reference path = "./localstorage.ts" />
function ordinal_suffix(cardinal: number): string {
	var suffix: string = "",
	judgeKey = cardinal % 100;
	if ((judgeKey >= 11 && judgeKey <= 20) || judgeKey % 10 >= 4 || judgeKey % 10 == 0) suffix = "th";
	else if (judgeKey % 10 === 1) suffix = "st";
	else if (judgeKey % 10 === 2) suffix = "nd";
	else if (judgeKey % 10 === 3) suffix = "rd";
	return suffix;
}

/**
 * @brief 使用归并排序法排序列表（倒序，大的在前）
 * @param arr 数组
 * @param func_bigger	用于比较arg1是否大于（或等于）arg2的函数
 */
function sort(arr: any[], func_greater: Function = (a: number, b: number) => (a >= b)): any[] {
	let len = arr.length;
	if (len < 2) return arr;
	let mid = Math.floor(len / 2),
	left = arr.slice(0, mid),
	right = arr.slice(mid);
	return merge(sort(left, func_greater), sort(right, func_greater), func_greater);
}

function merge(left: any[], right: any[], func_greater: Function): any[] {
	let result: number[] = [];
	while (left.length > 0 && right.length > 0) {
		if (func_greater(left[0], right[0])) {
			result.push(left.shift());
		}
		else {
			result.push(right.shift());
		}
	}
	while (left.length) result.push(left.shift());
	while (right.length) result.push(right.shift());
	return result;
}

function map(func: Function, list: any[]): any[] {
	let listNew = [];
	for (let i of list) listNew.push(func(i));
	return listNew;
};

function greater(e1: Ele.Elector, e2: Ele.Elector): boolean {
	if (e1.get_vote() < e2.get_vote()) return false;
	else if (e1.get_vote() > e2.get_vote()) return true;
	if (e1.get_id() > e2.get_id()) return false;
	return true;
}

class Vector2d {
	public x: number;
	public y: number;
	constructor(x: number = 0, y: number = 0) {
		this.x = x;
		this.y = y;
	}
	public mod(): number {
		return (this.x ** 2 + this.y ** 2);
	}
}

module Ele {
export var electors: Elector[] = [];
export var rankAnimationPlaying: boolean = true; // 是否正在处理动画
export class Elector {
	private id: number; // 编号（从1开始）
	private name: string; // 名称
	private vote: number; // 票数
	private rank: number; // 排名
	private progress: number; // 进度条占比
	private location: number; // 排名行位置（第几个）
	public voteButton: JQuery<HTMLElement>; // 投票按钮(button标签)
	public rankSpan: JQuery<HTMLElement>; // 排名行(span标签)
	public speed: Vector2d; // 排名行移动速度[右加、下加]
	public left: number; // rankSpan relative 向右偏移量
	public top: number; // rankSpan relative 向下偏移量
	constructor(id: number, name: string, vote: number = 0) {
		this.id = id;
		this.name = name;
		this.vote = vote;
		this.rank = 1;
		this.location = id;
		this.progress = 0.5;
		this.voteButton = $(`<button><span>${this.id}</span><span>${this.name}</span><span><span>${this.vote}</span> | <span>${this.rank}</span><span>${ordinal_suffix(this.rank)}</span></span></button>`).attr({"class": "button-d vote-button"});
		this.rankSpan = $(`<span style="--progress: ${this.progress}; --pro-color: khaki;"><span><span>${this.rank}</span><span>${ordinal_suffix(this.rank)}</span></span><span>${this.name}</span><span>${this.vote}</span></span>`).attr({"class": "rank-span"}).css({"--progress": this.progress.toString(), "--pro-color": "khaki", "display": "relative"});
		this.speed = new Vector2d(0, 0);
		this.left = 0;
		this.top = 0;
	}
	public get_id(): number { return this.id; }
	public set_id(id: number): void {
		this.id = id;
		this.voteButton[0].children[0].textContent = id.toString();
	}
	public get_name(): string { return this.name; }
	public set_name(name: string): void {
		this.name = name;
		LC.config.electorNames[this.get_id() - 1] = name;
		LC.config.update_basic();
		this.voteButton[0].children[1].textContent = name;
		this.rankSpan[0].children[1].textContent = name;
	}
	public get_vote(): number { return this.vote; }
	/**
	 * @param update_at_once	是否立即刷新排名
	 */
	public set_vote(vote: number, update_at_once: boolean = true): void {
		this.vote = vote;
		LC.config.votes[this.get_id() - 1] = vote;
		this.voteButton[0].children[2].children[0].textContent = vote.toString();
		this.rankSpan[0].children[2].textContent = vote.toString();
		if (update_at_once) {
			let electors_temp: Elector[] = sort(electors, greater),
			votes: number[] = map(((a: Elector) => a.get_vote()), electors_temp),
			elector_now: Elector;
			for (let i in electors_temp) {
				let ei = parseInt(i);
				elector_now = electors_temp[i];
				elector_now.set_rank(votes.indexOf(elector_now.get_vote()) + 1, (ei + 1 === electors.length));
				elector_now.set_location(ei);
				LC.config.update_votes();
			}
		}
	}
	public get_rank(): number { return this.rank; }
	/**
	 * @param update_at_once	是否立即刷新进度条
	 */
	public set_rank(rank: number, update_at_once: boolean = true): void {
		this.rank = rank;
		this.voteButton[0].children[2].children[1].textContent = this.rank.toString();
		this.voteButton[0].children[2].children[2].textContent = ordinal_suffix(this.rank);
		this.rankSpan[0].children[0].children[0].textContent = this.rank.toString();
		this.rankSpan[0].children[0].children[1].textContent = ordinal_suffix(this.rank);
		if (update_at_once) {
			var votesMax: number = Math.max(Math.max.apply(undefined, LC.config.votes), 0),
			votesMin: number = Math.min(Math.min.apply(undefined, LC.config.votes), 0),
			diff = votesMax - votesMin + 1;
			for (let e of electors) {
				e.set_progress((e.get_vote() - votesMin + 1) / diff);
				let pro_color: string;
				if (e.get_rank() <= LC.config.secSepLine) pro_color = "gold";
				else if (e.get_rank() <= LC.config.mainSepLine) pro_color = "greenyellow";
				else pro_color = "khaki";
				e.rankSpan.css("--pro-color", pro_color);
			}
		}
	}
	public get_progress(): number { return this.progress; }
	private set_progress(progress: number): void {
		this.progress = progress;
		this.rankSpan.css("--progress", progress.toString());
	}
	public get_location(): number { return this.location; }
	public set_location(location: number): void {
		if (this.location !== location) rankAnimationPlaying = true;
		this.location = location;
	}

	public add_vote() {
		var voteSingle = LC.config.voteSingle,
		symbol = (voteSingle >= 0)? "+": "", // 额外的符号
		color = (voteSingle > 0)? "darkgreen": ((voteSingle === 0)? "black": "purple");
		this.set_vote(this.vote + voteSingle);
		$("#vote-tips").append($(`<span style="color: ${color}; opacity: 1;">${this.get_id()}号 ${this.get_name()} 票数${symbol}${voteSingle}</span>`))
	}
	public move() {
		this.left += this.speed.x;
		this.top += this.speed.y;
		this.rankSpan.css({"left": `${this.left.toString()}px`, "top": `${this.top.toString()}px`});
	}
};

}