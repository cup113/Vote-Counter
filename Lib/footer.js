"use strict";
/** 生成个性化footer
 * * 配合footer.css使用，引入后再自己写一行代码
 * @date 2022.8.1
 */
/**
 * @param VERSION 版本号
 * @param github_url 在github上项目的URL | e.g. https://github.com/cup113/Vote-Counter/
 * @param info_detail 是否加入"cup11"栏
 * @param year_end 最后更新年份
 * @param year_start 开始年份
 */
function generate_footer(VERSION, github_url, info_detail = true, show_version = true, year_end = 0, year_start = 0) {
    var yearnow = new Date().getFullYear(), $footer = $("footer");
    $footer.append($(`<div>&copy; ${(year_start === 0 || year_start === year_end) ? "" : (year_start.toString() + "-")}${(year_end === 0) ? yearnow.toString() : year_end.toString()} Jason M. Li</div>`));
    if (info_detail) {
        $footer.append($(`<div></div>`).html(`<a href="https://github.com/cup113" target="_blank">关于开发者</a> <a href="${github_url + "issues/"}" target="_blank">反馈/问题报告</a> <a href="${github_url}" target="_blank">开源</a></div>`));
    }
    $footer.append($(`<div><span>Version: ${VERSION}</span> <a href="readme.html" target="_blank">使用说明</a> <a href="LICENSE.txt" target="_blank">版权声明</a>${show_version ? ' <a href="version.html" target="blank">更新日志</a>' : ""}</div>`));
}
