/**
 * @file 生成footer
 * * 配合footer.css使用，引入后再自己写一行代码
 */
/**
 * @param VERSION 版本号
 * @param github_url 在github上项目的URL @example https://github.com/cup113/Vote-Counter/
 * @param info_detail 是否加入"cup11"/"传送门"栏
 */
function generate_footer(VERSION, github_url, info_detail) {
    if (info_detail === void 0) { info_detail = true; }
    var $footer = $("footer");
    $footer.append($(info_detail ? "<div><p>cup11</p><a href=\"https://github.com/cup113\" target=\"_blank\">\u5173\u4E8E\u5F00\u53D1\u8005</a> <a href=\"".concat(github_url + "issues/", "\" target=\"_blank\">\u53CD\u9988/\u95EE\u9898\u62A5\u544A</a> <a href=\"").concat(github_url, "\" target=\"_blank\">\u5F00\u6E90</a></div><div><hr><div><span>Version: ").concat(VERSION, "</span> <a href=\"readme.html\" target=\"_blank\">\u4F7F\u7528\u8BF4\u660E</a> <a href=\"LICENSE.txt\" target=\"_blank\">\u7248\u6743\u58F0\u660E</a></div>") : "<div></div><div></div><div><span>Version: ".concat(VERSION, "</span> <a href=\"readme.html\" target=\"_blank\">\u4F7F\u7528\u8BF4\u660E</a> <a href=\"LICENSE.txt\" target=\"_blank\">\u7248\u6743\u58F0\u660E</a></div>")));
}
