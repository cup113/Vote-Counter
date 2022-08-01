"use strict";
/**
 * @file 载入、初始化或修改localStorage
 */
/// <reference path="../src/version.d.ts"/>
/// <reference path="../src/md5.d.ts"/>
/// <reference path="../src/about.d.ts"/>
function lgi(key) { return localStorage.getItem(key); }
var LC;
(function (LC) {
    class Config {
        constructor(version, title, mainSepLine, secSepLine, votes, electorNames, voteSingle, invalidVote) {
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
        to_object() {
            return {
                version: this.version,
                mainSepLine: this.mainSepLine,
                secSepLine: this.secSepLine,
                electorNames: this.electorNames
            };
        }
        set_title(title = this.title, isHTMLQuickSet = false) {
            this.title = title;
            $("#title")[0].textContent = this.title;
            if (!isHTMLQuickSet)
                $("#titleSet").val(this.title);
            if (isHTMLQuickSet)
                this.update_title();
            document.title = "计票器 - " + title;
        }
        set_voteSingle(voteSingle = this.voteSingle, isHTMLQuickSet = false) {
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
        }
        set_mainSepLine(mainSepLine = this.mainSepLine) {
            this.mainSepLine = mainSepLine;
            $("#mainSepLineSet").val(this.mainSepLine.toString());
        }
        set_secSepLine(secSepLine = this.secSepLine) {
            this.secSepLine = secSepLine;
            $("#secSepLineSet").val(this.secSepLine.toString());
        }
        set_electorNames(electorNames = this.electorNames) {
            this.electorNames = electorNames;
            $("#electors-list").val(this.electorNames.join(","));
        }
        update() {
            localStorage.setItem("VC_about", "Voting Count\nCopyright (c) Jason M. Li 2021-2022");
            localStorage.setItem("VC_version", this.version);
            localStorage.setItem("VC_title", this.title);
            localStorage.setItem("VC_votes", this.votes.join(","));
            localStorage.setItem("VC_inVote", this.invalidVote.toString());
            localStorage.setItem("VC_voteSingle", this.voteSingle.toString());
            localStorage.setItem("VC_basic", JSON.stringify(this.to_object()));
        }
        update_title() { localStorage.setItem("VC_title", this.title); }
        update_votes() { localStorage.setItem("VC_votes", this.votes.join(",")); }
        update_inVote() { localStorage.setItem("VC_inVote", this.invalidVote.toString()); }
        update_voteSingle() { localStorage.setItem("VC_voteSingle", this.voteSingle.toString()); }
        update_basic() { localStorage.setItem("VC_basic", JSON.stringify(this.to_object())); }
        /**
         * @brief 获取一个代表当前投票结果的简略字符串(只考虑敏感信息: votes/electorNames)
         * @return 128bit字符串
         */
        unique_code() {
            var enstring = "$salt$" + this.votes.join("|") + this.electorNames.join("|") + "$salt$", md5_gen = new MD5.MD5();
            return md5_gen.hex_md5(enstring);
        }
    }
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
        for (let i in VC_votes_temp)
            VC_votes.push(parseInt(VC_votes_temp[i]));
        LC.config = new Config(lgi("VC_version"), lgi("VC_title"), tbasic.mainSepLine, tbasic.secSepLine, VC_votes, tbasic.electorNames, parseInt(lgi("VC_voteSingle")), parseInt(lgi("VC_inVote")));
    }
})(LC || (LC = {}));
;
LC.set_init();
console.log(localStorage.getItem("VC_about") + "\nVersion: " + localStorage.getItem("VC_version"));
