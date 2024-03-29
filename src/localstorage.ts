/**
 * @file 载入、初始化或修改localStorage
 */

/// <reference path="../src/version.d.ts"/>
/// <reference path="../src/md5.d.ts"/>
/// <reference path="../src/about.d.ts"/>

function lgi(key: string): string { return localStorage.getItem(key) as string; }

module LC {

export var config: Config

class Config {
	public readonly version: string;
	public title: string;
	public mainSepLine: number;
	public secSepLine: number;
	public votes: number[]; // 票数（与人名对应）
	public electorNames: string[]; // 选举人名
	public voteSingle: number; // 单次票数
	public invalidVote: number; // 废票
	constructor(version: string, title: string, mainSepLine: number, secSepLine: number, votes: number[], electorNames: string[], voteSingle: number, invalidVote: number) {
		this.version = version;
		this.title = title;
		this.mainSepLine = mainSepLine;
		this.secSepLine = secSepLine;
		this.votes = votes;
		this.electorNames = electorNames;
		this.voteSingle = voteSingle;
		this.invalidVote = invalidVote;
	}
	/** 
	 * @return 基础信息（基本不会动的信息）
	 */
	public to_object(): Object {
		return {
			version: this.version,
			mainSepLine: this.mainSepLine,
			secSepLine: this.secSepLine,
			electorNames: this.electorNames
		};
	}
	public set_title(title: string = this.title, isHTMLQuickSet: boolean = false): void {
		this.title = title;
		$("#title")[0].textContent = this.title;
		if (!isHTMLQuickSet) $("#titleSet").val(this.title);
		if (isHTMLQuickSet) this.update_title();
		document.title = "计票器 - " + title;
	}
	public set_voteSingle(voteSingle: number = this.voteSingle, isHTMLQuickSet: boolean = false): void {
		if (isNaN(voteSingle)) { $("#voteNum").css({"background-color": "pink"}); }
		else {
			this.voteSingle = voteSingle;
			if (!isHTMLQuickSet) $("#voteNum")[0].textContent = this.voteSingle.toString();
			$("#voteNum").css({"background-color": ""});
			if (isHTMLQuickSet) this.update_voteSingle();
		}
	}
	public set_mainSepLine(mainSepLine: number = this.mainSepLine) {
		this.mainSepLine = mainSepLine;
		$("#mainSepLineSet").val(this.mainSepLine.toString());
	}
	public set_secSepLine(secSepLine: number = this.secSepLine) {
		this.secSepLine = secSepLine;
		$("#secSepLineSet").val(this.secSepLine.toString());
	}
	public set_electorNames(electorNames: string[] = this.electorNames) {
		this.electorNames = electorNames;
		$("#electors-list").val(this.electorNames.join(","));
	}

	public update(): void {
		localStorage.setItem("VC_about", "Voting Count\nCopyright (c) Jason M. Li 2021-2022")
		localStorage.setItem("VC_version", this.version);
		localStorage.setItem("VC_title", this.title);
		localStorage.setItem("VC_votes", this.votes.join(","));
		localStorage.setItem("VC_inVote", this.invalidVote.toString());
		localStorage.setItem("VC_voteSingle", this.voteSingle.toString());
		localStorage.setItem("VC_basic", JSON.stringify(this.to_object()));
	}
	public update_title(): void { localStorage.setItem("VC_title", this.title); }
	public update_votes(): void { localStorage.setItem("VC_votes", this.votes.join(",")); }
	public update_inVote(): void { localStorage.setItem("VC_inVote", this.invalidVote.toString()) }
	public update_voteSingle(): void { localStorage.setItem("VC_voteSingle", this.voteSingle.toString()); }
	public update_basic(): void { localStorage.setItem("VC_basic", JSON.stringify(this.to_object())); }
	/**
	 * @brief 获取一个代表当前投票结果的简略字符串(只考虑敏感信息: votes/electorNames)
	 * @return 128bit字符串
	 */
	public unique_code(): string {
		var enstring: string = "$salt$" + this.votes.join("|") + this.electorNames.join("|") + "$salt$",
		md5_gen = new MD5.MD5();
		return md5_gen.hex_md5(enstring);
	}
}

export function set_init() {
	config.set_title();
	config.set_voteSingle();
	config.set_electorNames();
	config.set_mainSepLine();
	config.set_secSepLine();
}

export function to_config(obj: Object) {
	return new Config(
		(obj as Config).version,
		(obj as Config).title,
		(obj as Config).mainSepLine,
		(obj as Config).secSepLine,
		(obj as Config).votes,
		(obj as Config).electorNames,
		(obj as Config).voteSingle,
		(obj as Config).invalidVote
	)
}

var version_temp: Ver.Version = Ver.to_version(version);

if (lgi("VC_version") === null) {
	config = new Config(version, "计票器", 10, 3, [0, 0, 0], ["张三", "李四", "王五"], 1, 0);
	config.update();
}

else {
	if (lgi("VC_inVote") === null) {
		localStorage.setItem("VC_inVote", "0");
	}
	var tbasic: Config = JSON.parse(lgi("VC_basic")), // 临时 | Config属误导性
	VC_votes_temp = lgi("VC_votes").split(","),
	VC_votes: number[] = [];
	for (let i in VC_votes_temp) VC_votes.push(parseInt(VC_votes_temp[i]));
	config = new Config(lgi("VC_version"), lgi("VC_title"), tbasic.mainSepLine, tbasic.secSepLine, VC_votes, tbasic.electorNames, parseInt(lgi("VC_voteSingle")), parseInt(lgi("VC_inVote")));
}

};

LC.set_init();
console.log(localStorage.getItem("VC_about") + "\nVersion: " + localStorage.getItem("VC_version"));