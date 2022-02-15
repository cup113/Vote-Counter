/**
 * @file 创建投票区或投票人的变更
 */
/// <reference path="./elector.ts" />
/// <reference path="./localstorage.ts"/>
function add_voteNum(diff: number) {
	LC.config.set_voteSingle(LC.config.voteSingle + diff);
	LC.config.update_voteSingle();
}

function reset_votes() {
	var i: string, e: Ele.Elector, pi: number;
	for (i in Ele.electors) {
		pi = parseInt(i);
		e = Ele.electors[i];
		e.set_vote(0, (pi === Ele.electors.length - 1))
	}
}