/**
 * @file 创建选举人类及方法
 */
/// <reference path = "./localstorage.ts" />
/**
 * @brief 使用归并排序法排序列表（倒序，大的在前）
 * @param arr 数组
 * @param func_greater	用于比较arg1是否大于（或等于）arg2的函数
 */
function sort(arr, func_greater) {
    if (func_greater === void 0) { func_greater = function (a, b) { return (a >= b); }; }
    var len = arr.length;
    if (len < 2)
        return arr;
    var mid = Math.floor(len / 2), left = arr.slice(0, mid), right = arr.slice(mid);
    return merge(sort(left, func_greater), sort(right, func_greater), func_greater);
}
function merge(left, right, func_greater) {
    var result = [];
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
    var listNew = [];
    for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
        var i = list_1[_i];
        listNew.push(func(i));
    }
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
var Vector2d = /** @class */ (function () {
    function Vector2d(x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        this.x = x;
        this.y = y;
    }
    Vector2d.prototype.mod = function () {
        return (Math.pow(this.x, 2) + Math.pow(this.y, 2));
    };
    return Vector2d;
}());
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
    var Elector = /** @class */ (function () {
        function Elector(id, name, vote) {
            if (vote === void 0) { vote = 0; }
            this.id = id;
            this.name = name;
            this.vote = vote;
            this.rank = 1;
            this.location = id;
            this.progress = 0.5;
            this.voteButton = $("<button><span>".concat(this.id, "</span><span>").concat(this.name, "</span><span><span>").concat(this.vote, "</span> | <span>").concat(this.rank, "</span><span>").concat(ordinal_suffix(this.rank), "</span></span></button>")).attr({ "class": "button-d vote-button" });
            this.rankSpan = $("<span style=\"--progress: ".concat(this.progress, "; --pro-color: khaki;\"><span><span>").concat(this.rank, "</span><span>").concat(ordinal_suffix(this.rank), "</span></span><span>").concat(this.name, "</span><span>").concat(this.vote, "</span></span>")).attr({ "class": "rank-span" }).css({ "--progress": this.progress.toString(), "--pro-color": "khaki", "display": "relative" });
            Ele.totalVotes += vote;
            this.speed = new Vector2d(0, 0);
            this.left = 0;
            this.top = 0;
        }
        Elector.prototype.get_id = function () { return this.id; };
        Elector.prototype.set_id = function (id) {
            this.id = id;
            this.voteButton[0].children[0].textContent = id.toString();
        };
        Elector.prototype.get_name = function () { return this.name; };
        Elector.prototype.set_name = function (name) {
            this.name = name;
            LC.config.electorNames[this.get_id() - 1] = name;
            LC.config.update_basic();
            this.voteButton[0].children[1].textContent = name;
            this.rankSpan[0].children[1].textContent = name;
        };
        Elector.prototype.get_vote = function () { return this.vote; };
        /**
         * @param update_at_once	是否立即刷新排名
         */
        Elector.prototype.set_vote = function (vote, update_at_once) {
            if (vote === void 0) { vote = this.vote; }
            if (update_at_once === void 0) { update_at_once = true; }
            Ele.totalVotes += (vote - this.vote);
            this.vote = vote;
            LC.config.votes[this.get_id() - 1] = vote;
            this.voteButton[0].children[2].children[0].textContent = vote.toString();
            this.rankSpan[0].children[2].textContent = vote.toString();
            $("#valid-vote").text((Ele.totalVotes - LC.config.invalidVote).toString());
            $("#total-vote").text(Ele.totalVotes.toString());
            if (update_at_once) {
                var electors_temp = sort(Ele.electors, greater), votes = map((function (a) { return a.get_vote(); }), electors_temp), elector_now = void 0;
                for (var i in electors_temp) {
                    var ei = parseInt(i);
                    elector_now = electors_temp[i];
                    elector_now.set_rank(votes.indexOf(elector_now.get_vote()) + 1, (ei + 1 === Ele.electors.length));
                    elector_now.set_location(ei);
                    LC.config.update_votes();
                }
            }
        };
        Elector.prototype.get_rank = function () { return this.rank; };
        /**
         * @param update_at_once	是否立即刷新进度条
         */
        Elector.prototype.set_rank = function (rank, update_at_once) {
            if (update_at_once === void 0) { update_at_once = true; }
            this.rank = rank;
            this.voteButton[0].children[2].children[1].textContent = this.rank.toString();
            this.voteButton[0].children[2].children[2].textContent = ordinal_suffix(this.rank);
            this.rankSpan[0].children[0].children[0].textContent = this.rank.toString();
            this.rankSpan[0].children[0].children[1].textContent = ordinal_suffix(this.rank);
            if (update_at_once) {
                var votesMax = Math.max(Math.max.apply(undefined, LC.config.votes), 0), votesMin = Math.min(Math.min.apply(undefined, LC.config.votes), 0), diff = votesMax - votesMin + 1;
                for (var _i = 0, electors_1 = Ele.electors; _i < electors_1.length; _i++) {
                    var e = electors_1[_i];
                    e.set_progress((e.get_vote() - votesMin + 1) / diff);
                    var pro_color = void 0;
                    if (e.get_rank() <= LC.config.secSepLine)
                        pro_color = "gold";
                    else if (e.get_rank() <= LC.config.mainSepLine)
                        pro_color = "greenyellow";
                    else
                        pro_color = "khaki";
                    e.rankSpan.css("--pro-color", pro_color);
                }
            }
        };
        Elector.prototype.get_progress = function () { return this.progress; };
        Elector.prototype.set_progress = function (progress) {
            this.progress = progress;
            this.rankSpan.css("--progress", progress.toString());
        };
        Elector.prototype.get_location = function () { return this.location; };
        Elector.prototype.set_location = function (location) {
            if (this.location !== location)
                Ele.rankAnimationPlaying = true;
            this.location = location;
        };
        Elector.prototype.add_vote = function () {
            var voteSingle = LC.config.voteSingle, symbol = (voteSingle >= 0) ? "+" : "", // 额外的符号
            color = (voteSingle > 0) ? "darkgreen" : ((voteSingle === 0) ? "black" : "purple");
            this.set_vote(this.vote + voteSingle);
            $("#vote-tips").append($("<span style=\"color: ".concat(color, "; opacity: 1;\">").concat(this.get_id(), "\u53F7 ").concat(this.get_name(), " \u7968\u6570").concat(symbol).concat(voteSingle, "</span>")));
        };
        Elector.prototype.move = function () {
            this.left += this.speed.x;
            this.top += this.speed.y;
            this.rankSpan.css({ "left": "".concat(this.left.toString(), "px"), "top": "".concat(this.top.toString(), "px") });
        };
        return Elector;
    }());
    Ele.Elector = Elector;
    ;
})(Ele || (Ele = {}));
