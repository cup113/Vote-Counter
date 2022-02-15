/**
 * @file 初始化选举人
 */
/// <reference path = "./localstorage.ts" />
/// <reference path = "./elector.ts" />
var $voteButtons = $("#vote-buttons"),
$rankChart = $("#rank-chart");
for (let i in LC.config.electorNames) {
	let electorName = LC.config.electorNames[i],
	new_elector = new Ele.Elector(parseInt(i) + 1, electorName, LC.config.votes[i]);
	new_elector.voteButton.appendTo($voteButtons);
	new_elector.voteButton.on("click", {id: new_elector.get_id()}, function (event) {
		Ele.electors[event.data.id - 1].add_vote();
	});
	new_elector.rankSpan.appendTo($rankChart);
	Ele.electors.push(new_elector);
	if (parseInt(i) === LC.config.electorNames.length - 1) {
		new_elector.set_vote(new_elector.get_vote());
	}
}