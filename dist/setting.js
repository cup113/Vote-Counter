/// <reference path="./localstorage.ts"/>
/// <reference path="./elector.ts"/>
function click_setting_icon() {
    var $settingsDiv = $("#settings-div");
    if ($settingsDiv.hasClass("none-display")) {
        $settingsDiv.toggleClass("none-display");
    }
    else {
        $settingsDiv.addClass("none-display");
    }
}
function start_change_electors() {
    var $electorsChanging = $("#electors-change");
    if ($electorsChanging.hasClass("none-display")) {
        $electorsChanging.toggleClass("none-display");
    }
    else {
        $electorsChanging.addClass("none-display");
    }
}
function show_storage() {
    if ($("#storage-showing-temp").length !== 0)
        return;
    var storage = JSON.stringify({
        "version": LC.config.version,
        "title": LC.config.title,
        "mainSepLine": LC.config.mainSepLine,
        "secSepLine": LC.config.secSepLine,
        "votes": LC.config.votes,
        "electorNames": LC.config.electorNames,
        "voteSingle": LC.config.voteSingle
    }), $showingDiv = $("<div></div>")
        .css({ "position": "fixed", "box-sizing": "border-box", "width": "70vw", "height": "70vh", "top": "15vh", "left": "15vw", "background-color": "#eeeeee", "padding": "5rem 1rem 1rem 1rem", "overflow-y": "auto" })
        .attr({ "id": "storage-showing-temp" })
        .append($("<div><img src=\"../img/close.svg\"></div>").attr({ "class": "button-d close-icon-fullscreen" }).on('click', function () { $("#storage-showing-temp").remove(); }))
        .append($("<p>这是你的投票唯一记录摘要(32bit)。对比它可以了解投票是否被修改过。</p>"))
        .append($("<textarea></textarea>").val(LC.config.unique_code()).css({ "resize": "none", "height": "2rem", "width": "100%" }).attr({ "disabled": "disabled" }))
        .append($("<p>这是你的详细存档配置。请把它复制下来并保存到一个安全的地方。</p>"))
        .append($("<textarea></textarea>").val(storage).css({ "resize": "vertical", "min-height": "40vh", "width": "100%" }))
        .appendTo($("body"));
}
function import_storage() {
    if ($("#storage-import-temp").length !== 0)
        return;
    var $importDiv = $("<div></div>")
        .css({ "position": "fixed", "box-sizing": "border-box", "width": "70vw", "height": "70vh", "top": "15vh", "left": "15vw", "background-color": "#eeeeee", "padding": "5rem 1rem 1rem 1rem", "overflow-y": "auto" })
        .attr({ "id": "storage-import-temp" })
        .append($("<div><img src=\"../img/close.svg\"></div>").attr({ "class": "button-d close-icon-fullscreen" }).on('click', function () { $("#storage-import-temp").remove(); }))
        .append($("<p>请输入你的存档:</p>"))
        .append($("<textarea></textarea>").css({ "resize": "vertical", "min-height": "40vh", "display": "block", "width": "100%" }))
        .append($("<button class='button-d'>确定导入</button>").on('click', function () { LC.config = LC.to_config(JSON.parse($("#storage-import-temp>textarea").val())); LC.set_init(); $("#storage-import-temp").remove(); LC.config.update(); }))
        .appendTo($("body"));
}
function is_same(a1, a2) {
    var a1len = a1.length, a2len = a2.length;
    if (a1len !== a2len)
        return false;
    for (var i in a1)
        if (a1[i] !== a2[i])
            return false;
    return true;
}
function submit_setting(save) {
    if (save === void 0) { save = false; }
    var config_new = LC.to_config({
        version: LC.config.version,
        title: $("#titleSet").val(),
        mainSepLine: $("#mainSepLineSet").val(),
        secSepLine: $("#secSepLineSet").val(),
        votes: LC.config.votes,
        electorNames: $("#electors-list").val().split(","),
        voteSingle: LC.config.voteSingle
    });
    if (config_new.title !== LC.config.title) {
        LC.config.set_title(config_new.title);
        if (save)
            LC.config.update_title();
    }
    if (config_new.mainSepLine !== LC.config.mainSepLine) {
        LC.config.set_mainSepLine(config_new.mainSepLine);
        if (save)
            LC.config.update_basic();
    }
    if (config_new.secSepLine !== LC.config.secSepLine) {
        LC.config.set_secSepLine(config_new.secSepLine);
        if (save)
            LC.config.update_basic();
    }
    if (!is_same(config_new.electorNames, LC.config.electorNames)) {
        LC.config.set_electorNames(config_new.electorNames);
        if (save)
            LC.config.update_basic();
        Ele.electors = [];
        LC.config.votes = [];
        $("#vote-buttons").empty(),
            $("#rank-chart").empty();
        var $voteButtons_temp = $("#vote-buttons"), $rankChart_temp = $("#rank-chart");
        for (var i in config_new.electorNames) {
            var electorName = config_new.electorNames[i], new_elector = new Ele.Elector(parseInt(i) + 1, electorName, 0);
            new_elector.voteButton.appendTo($voteButtons_temp);
            new_elector.voteButton.on("click", { id: new_elector.get_id() }, function (event) {
                Ele.electors[event.data.id - 1].add_vote();
            });
            new_elector.rankSpan.appendTo($rankChart_temp);
            Ele.electors.push(new_elector);
            LC.config.votes.push(0);
            if (parseInt(i) === config_new.electorNames.length - 1) {
                new_elector.set_vote(new_elector.get_vote());
            }
        }
    }
    $("#settings-div").addClass("none-display");
}
function reset_setting() {
    $("#titleSet").val("计票器");
    $("#mainSepLineSet").val(6);
    $("#secSepLineSet").val(3);
    $("#electors-list").val("张三,李四,王五");
}
