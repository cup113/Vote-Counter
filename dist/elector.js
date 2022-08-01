"use strict";
/**
 * @file 创建选举人类及方法
 */
/// <reference path = "../src/localstorage.ts" />
/**
 * @brief 使用归并排序法排序列表（倒序，大的在前）
 * @param arr 数组
 * @param func_greater	用于比较arg1是否大于（或等于）arg2的函数
 */
function sort(arr, func_greater = (a, b) => (a >= b)) {
    let len = arr.length;
    if (len < 2)
        return arr;
    let mid = Math.floor(len / 2), left = arr.slice(0, mid), right = arr.slice(mid);
    return merge(sort(left, func_greater), sort(right, func_greater), func_greater);
}
function merge(left, right, func_greater) {
    let result = [];
    while (left.length > 0 && right.length > 0) {
        if (func_greater(left[0], right[0])) {
            result.push(left.shift());
        }
        else {
            result.push(right.shift());
        }
    }
    while (left.length)
        result.push(left.shift());
    while (right.length)
        result.push(right.shift());
    return result;
}
function map(func, list) {
    let listNew = [];
    for (let i of list)
        listNew.push(func(i));
    return listNew;
}
;
function greater(e1, e2) {
    if (e1.get_vote() < e2.get_vote())
        return false;
    else if (e1.get_vote() > e2.get_vote())
        return true;
    if (e1.get_id() > e2.get_id())
        return false;
    return true;
}
class Vector2d {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    mod() {
        return (Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
}
var Ele;
(function (Ele) {
    function ordinal_suffix(cardinal) {
        var suffix = "", judgeKey = cardinal % 100;
        if ((judgeKey >= 11 && judgeKey <= 20) || judgeKey % 10 >= 4 || judgeKey % 10 == 0)
            suffix = "th";
        else if (judgeKey % 10 === 1)
            suffix = "st";
        else if (judgeKey % 10 === 2)
            suffix = "nd";
        else if (judgeKey % 10 === 3)
            suffix = "rd";
        return suffix;
    }
    Ele.ordinal_suffix = ordinal_suffix;
    Ele.electors = [];
    Ele.rankAnimationPlaying = true; // 是否正在处理动画
    Ele.totalVotes = 0;
    class Elector {
        constructor(id, name, vote = 0) {
            this.id = id;
            this.name = name;
            this.vote = vote;
            this.rank = 1;
            this.location = id;
            this.progress = 0.5;
            this.voteButton = $(`<button><span>${this.id}</span><span>${this.name}</span><span><span>${this.vote}</span> | <span>${this.rank}</span><span>${ordinal_suffix(this.rank)}</span></span></button>`).attr({ "class": "button-d vote-button" });
            this.rankSpan = $(`<span style="--progress: ${this.progress}; --pro-color: khaki;"><span><span>${this.rank}</span><span>${ordinal_suffix(this.rank)}</span></span><span>${this.name}</span><span>${this.vote}</span></span>`).attr({ "class": "rank-span" }).css({ "--progress": this.progress.toString(), "--pro-color": "khaki", "display": "relative" });
            Ele.totalVotes += vote;
            this.speed = new Vector2d(0, 0);
            this.left = 0;
            this.top = 0;
        }
        get_id() { return this.id; }
        set_id(id) {
            this.id = id;
            this.voteButton[0].children[0].textContent = id.toString();
        }
        get_name() { return this.name; }
        set_name(name) {
            this.name = name;
            LC.config.electorNames[this.get_id() - 1] = name;
            LC.config.update_basic();
            this.voteButton[0].children[1].textContent = name;
            this.rankSpan[0].children[1].textContent = name;
        }
        get_vote() { return this.vote; }
        /**
         * @param update_at_once	是否立即刷新排名
         */
        set_vote(vote = this.vote, update_at_once = true) {
            Ele.totalVotes += (vote - this.vote);
            this.vote = vote;
            LC.config.votes[this.get_id() - 1] = vote;
            this.voteButton[0].children[2].children[0].textContent = vote.toString();
            this.rankSpan[0].children[2].textContent = vote.toString();
            $("#valid-vote").text((Ele.totalVotes - LC.config.invalidVote).toString());
            $("#total-vote").text(Ele.totalVotes.toString());
            if (update_at_once) {
                let electors_temp = sort(Ele.electors, greater), votes = map(((a) => a.get_vote()), electors_temp), elector_now;
                for (let i in electors_temp) {
                    let ei = parseInt(i);
                    elector_now = electors_temp[i];
                    elector_now.set_rank(votes.indexOf(elector_now.get_vote()) + 1, (ei + 1 === Ele.electors.length));
                    elector_now.set_location(ei);
                    LC.config.update_votes();
                }
            }
        }
        get_rank() { return this.rank; }
        /**
         * @param update_at_once	是否立即刷新进度条
         */
        set_rank(rank, update_at_once = true) {
            this.rank = rank;
            this.voteButton[0].children[2].children[1].textContent = this.rank.toString();
            this.voteButton[0].children[2].children[2].textContent = ordinal_suffix(this.rank);
            this.rankSpan[0].children[0].children[0].textContent = this.rank.toString();
            this.rankSpan[0].children[0].children[1].textContent = ordinal_suffix(this.rank);
            if (update_at_once) {
                var votesMax = Math.max(Math.max.apply(undefined, LC.config.votes), 0), votesMin = Math.min(Math.min.apply(undefined, LC.config.votes), 0), diff = votesMax - votesMin + 1;
                for (let e of Ele.electors) {
                    e.set_progress((e.get_vote() - votesMin + 1) / diff);
                    let pro_color;
                    if (e.get_rank() <= LC.config.secSepLine)
                        pro_color = "gold";
                    else if (e.get_rank() <= LC.config.mainSepLine)
                        pro_color = "greenyellow";
                    else
                        pro_color = "khaki";
                    e.rankSpan.css("--pro-color", pro_color);
                }
            }
        }
        get_progress() { return this.progress; }
        set_progress(progress) {
            this.progress = progress;
            this.rankSpan.css("--progress", progress.toString());
        }
        get_location() { return this.location; }
        set_location(location) {
            if (this.location !== location)
                Ele.rankAnimationPlaying = true;
            this.location = location;
        }
        add_vote() {
            var voteSingle = LC.config.voteSingle, symbol = (voteSingle >= 0) ? "+" : "", // 额外的符号
            color = (voteSingle > 0) ? "darkgreen" : ((voteSingle === 0) ? "black" : "purple");
            this.set_vote(this.vote + voteSingle);
            $("#vote-tips").append($(`<span style="color: ${color}; opacity: 1;">${this.get_id()}号 ${this.get_name()} 票数${symbol}${voteSingle}</span>`));
        }
        move() {
            this.left += this.speed.x;
            this.top += this.speed.y;
            this.rankSpan.css({ "left": `${this.left.toString()}px`, "top": `${this.top.toString()}px` });
        }
    }
    Ele.Elector = Elector;
    ;
})(Ele || (Ele = {}));
