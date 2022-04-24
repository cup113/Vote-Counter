/**
 * @file 生成footer
 * * 配合footer.css使用，引入后再自己写一行代码
 */
/**
 * @param VERSION 版本号
 * @param github_url 在github上项目的URL | e.g. https://github.com/cup113/Vote-Counter/
 * @param info_detail 是否加入"cup11"栏
 * @param year_end 最后更新年份
 * @param year_start 开始年份
 */
function generate_footer(VERSION, github_url, info_detail, year_end, year_start) {
    if (info_detail === void 0) { info_detail = true; }
    if (year_end === void 0) { year_end = 0; }
    if (year_start === void 0) { year_start = 0; }
    var yearnow = new Date().getFullYear(), $footer = $("footer");
    $footer.append($("<div>&copy; ".concat((year_start === 0 || year_start === year_end) ? "" : (year_start.toString() + "-")).concat((year_end === 0) ? yearnow.toString() : year_end.toString(), " ").concat(info_detail ? ('<a href="https://github.com/cup113" target="_blank">cup11</a>') : "cup11", "</div>")).attr({ "child": "1" }));
    if (info_detail) {
        $footer.append($("<div></div>").attr({ "child": 2 }).html("<a href=\"https://github.com/cup113\" target=\"_blank\">\u5173\u4E8E\u5F00\u53D1\u8005</a> <a href=\"".concat(github_url + "issues/", "\" target=\"_blank\">\u53CD\u9988/\u95EE\u9898\u62A5\u544A</a> <a href=\"").concat(github_url, "\" target=\"_blank\">\u5F00\u6E90</a></div>")));
    }
    $footer.append($("<div><span>Version: ".concat(VERSION, "</span> <a href=\"readme.html\" target=\"_blank\">\u4F7F\u7528\u8BF4\u660E</a> <a href=\"LICENSE.txt\" target=\"_blank\">\u7248\u6743\u58F0\u660E</a></div>")).attr({ "child": "3" }));
}
