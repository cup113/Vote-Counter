/**
 * @file 生成footer
 * * 配合footer.css使用，引入后再自己写一行代码
 */

/**
 * @param VERSION 版本号
 * @param github_url 在github上项目的URL @example https://github.com/cup113/Vote-Counter/
 * @param info_detail 是否加入"cup11"/"传送门"栏
 */

function generate_footer(VERSION: string, github_url: string, info_detail: boolean = true): void {
	var $footer = $("footer");
	$footer.append($(info_detail? `<div><p>cup11</p><a href="https://github.com/cup113" target="_blank">关于开发者</a> <a href="${github_url+"issues/"}" target="_blank">反馈/问题报告</a> <a href="${github_url}" target="_blank">开源</a></div><div><hr><div><span>Version: ${VERSION}</span> <a href="readme.html" target="_blank">使用说明</a> <a href="LICENSE.txt" target="_blank">版权声明</a></div>`: `<div></div><div></div><div><span>Version: ${VERSION}</span> <a href="readme.html" target="_blank">使用说明</a> <a href="LICENSE.txt" target="_blank">版权声明</a></div>`));
}