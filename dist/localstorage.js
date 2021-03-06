/**
 * @file 载入、初始化或修改localStorage
 */
/// <reference path="../src/version.d.ts"/>
/// <reference path="../src/md5.d.ts"/>
/// <reference path="../src/about.d.ts"/>
function lgi(key) { return localStorage.getItem(key); }
var LC;
(function (LC) {
    var Config = /** @class */ (function () {
        function Config(version, title, mainSepLine, secSepLine, votes, electorNames, voteSingle, invalidVote) {
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
        Config.prototype.to_object = function () {
            return {
                version: this.version,
                mainSepLine: this.mainSepLine,
                secSepLine: this.secSepLine,
                electorNames: this.electorNames
            };
        };
        Config.prototype.set_title = function (title, isHTMLQuickSet) {
            if (title === void 0) { title = this.title; }
            if (isHTMLQuickSet === void 0) { isHTMLQuickSet = false; }
            this.title = title;
            $("#title")[0].textContent = this.title;
            if (!isHTMLQuickSet)
                $("#titleSet").val(this.title);
            if (isHTMLQuickSet)
                this.update_title();
            document.title = "计票器 - " + title;
        };
        Config.prototype.set_voteSingle = function (voteSingle, isHTMLQuickSet) {
            if (voteSingle === void 0) { voteSingle = this.voteSingle; }
            if (isHTMLQuickSet === void 0) { isHTMLQuickSet = false; }
            if (isNaN(voteSingle)) {
                $("#voteNum").css({ "background-color": "pink" });
            }
            else {
                this.voteSingle = voteSingle;
                if (!isHTMLQuickSet)
                    $("#voteNum")[0].textContent = this.voteSingle.toString();
                $("#voteNum").css({ "background-color": "" });
                if (isHTMLQuickSet)
                    this.update_voteSingle();
            }
        };
        Config.prototype.set_mainSepLine = function (mainSepLine) {
            if (mainSepLine === void 0) { mainSepLine = this.mainSepLine; }
            this.mainSepLine = mainSepLine;
            $("#mainSepLineSet").val(this.mainSepLine.toString());
        };
        Config.prototype.set_secSepLine = function (secSepLine) {
            if (secSepLine === void 0) { secSepLine = this.secSepLine; }
            this.secSepLine = secSepLine;
            $("#secSepLineSet").val(this.secSepLine.toString());
        };
        Config.prototype.set_electorNames = function (electorNames) {
            if (electorNames === void 0) { electorNames = this.electorNames; }
            this.electorNames = electorNames;
            $("#electors-list").val(this.electorNames.join(","));
        };
        Config.prototype.update = function () {
            localStorage.setItem("VC_about", "Voting Count\nCopyright (c) Jason M. Li 2021-2022");
            localStorage.setItem("VC_version", this.version);
            localStorage.setItem("VC_title", this.title);
            localStorage.setItem("VC_votes", this.votes.join(","));
            localStorage.setItem("VC_inVote", this.invalidVote.toString());
            localStorage.setItem("VC_voteSingle", this.voteSingle.toString());
            localStorage.setItem("VC_basic", JSON.stringify(this.to_object()));
        };
        Config.prototype.update_title = function () { localStorage.setItem("VC_title", this.title); };
        Config.prototype.update_votes = function () { localStorage.setItem("VC_votes", this.votes.join(",")); };
        Config.prototype.update_inVote = function () { localStorage.setItem("VC_inVote", this.invalidVote.toString()); };
        Config.prototype.update_voteSingle = function () { localStorage.setItem("VC_voteSingle", this.voteSingle.toString()); };
        Config.prototype.update_basic = function () { localStorage.setItem("VC_basic", JSON.stringify(this.to_object())); };
        /**
         * @brief 获取一个代表当前投票结果的简略字符串(只考虑敏感信息: votes/electorNames)
         * @return 128bit字符串
         */
        Config.prototype.unique_code = function () {
            var enstring = "$salt$" + this.votes.join("|") + this.electorNames.join("|") + "$salt$", md5_gen = new MD5.MD5();
            return md5_gen.hex_md5(enstring);
        };
        return Config;
    }());
    function set_init() {
        LC.config.set_title();
        LC.config.set_voteSingle();
        LC.config.set_electorNames();
        LC.config.set_mainSepLine();
        LC.config.set_secSepLine();
    }
    LC.set_init = set_init;
    function to_config(obj) {
        return new Config(obj.version, obj.title, obj.mainSepLine, obj.secSepLine, obj.votes, obj.electorNames, obj.voteSingle, obj.invalidVote);
    }
    LC.to_config = to_config;
    var version_temp = Ver.to_version(version);
    if (lgi("VC_version") === null) {
        LC.config = new Config(version, "计票器", 10, 3, [0, 0, 0], ["张三", "李四", "王五"], 1, 0);
        LC.config.update();
    }
    else {
        if (lgi("VC_inVote") === null) {
            localStorage.setItem("VC_inVote", "0");
        }
        var tbasic = JSON.parse(lgi("VC_basic")), // 临时 | Config属误导性
        VC_votes_temp = lgi("VC_votes").split(","), VC_votes = [];
        for (var i in VC_votes_temp)
            VC_votes.push(parseInt(VC_votes_temp[i]));
        LC.config = new Config(lgi("VC_version"), lgi("VC_title"), tbasic.mainSepLine, tbasic.secSepLine, VC_votes, tbasic.electorNames, parseInt(lgi("VC_voteSingle")), parseInt(lgi("VC_inVote")));
    }
})(LC || (LC = {}));
;
LC.set_init();
console.log(localStorage.getItem("VC_about") + "\nVersion: " + localStorage.getItem("VC_version"));
