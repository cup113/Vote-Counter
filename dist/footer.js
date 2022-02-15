/**
 * @file 生成footer
 * * 配合footer.css使用，引入后再自己写一行代码
 */
/**
 * @param VERSION 版本号
 * @param levels 与外部Lib相差的等级
 * @param info_detail 是否加入"cup11"/"传送门"栏
 */
function generate_footer(VERSION, levels, info_detail) {
    if (info_detail === void 0) { info_detail = true; }
    var $footer = $("footer"), lasts = "../";
    lasts = lasts.repeat(levels);
    $footer.append($(info_detail ? "<div><p>cup11</p><a href=\"".concat(lasts, "homepage/declaration/index.html\" target=\"_blank\">\u5173\u4E8E\u5F00\u53D1\u8005</a> <a href=\"").concat(lasts, "feedback/index.html\" target=\"_blank\">\u8054\u7CFB\u5F00\u53D1\u8005</a> <a href=\"").concat(lasts, "homepage/index.html\" target=\"_blank\">\u5F00\u53D1\u8005\u9996\u9875</a></div><div><p>\u4F20\u9001\u95E8</p><a href=\"").concat(lasts, "\u5E72\u77AA\u773C\u8BA1\u5206\u5668/index.html\" target=\"_blank\">\u5E72\u77AA\u773C\u8BA1\u5206\u5668</a></div><hr>") : "<div></div><div></div><div><hr><span>Version: ".concat(VERSION, "</span> <a href=\"readme.html\" target=\"_blank\">\u4F7F\u7528\u8BF4\u660E</a></div>")));
}
