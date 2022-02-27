/**
 * @file 生成footer
 * * 配合footer.css使用，引入后再自己写一行代码
 */

/**
 * @param VERSION 版本号
 * @param levels 与外部Lib相差的等级
 * @param info_detail 是否加入"cup11"/"传送门"栏
 */

function generate_footer(VERSION: string, levels: number, info_detail: boolean = true): void {
	var $footer = $("footer"),
	lasts: string = "../";
	lasts = (lasts as any).repeat(levels);
	$footer.append($(info_detail? `<div><p>cup11</p><a href="${lasts}homepage/declaration/index.html" target="_blank">关于开发者</a> <a href="${lasts}feedback/index.html" target="_blank">联系开发者</a> <a href="${lasts}homepage/index.html" target="_blank">开发者首页</a></div><div><p>传送门</p><a href="${lasts}干瞪眼计分器/index.html" target="_blank">干瞪眼计分器</a></div><hr>`: `<div></div><div></div><div><span>Version: ${VERSION}</span> <a href="readme.html" target="_blank">使用说明</a></div>`));
}