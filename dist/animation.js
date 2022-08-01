"use strict";
/**
 * @file 刷新投票提示、排名动画
 */
/// <reference path="../src/elector.ts"/>
function fresh() {
    var $votetips = $("#vote-tips");
    if ($votetips[0].children.length !== 0) {
        var $firstspan = $votetips[0].children.item(0), opacity = parseFloat($firstspan.style.opacity), opacity_reduce = $votetips[0].children.length * 0.01;
        if (opacity > opacity_reduce)
            $firstspan.style.opacity = (opacity - opacity_reduce).toString();
        else
            $votetips[0].removeChild($firstspan);
    }
    if (Ele.rankAnimationPlaying) {
        var $rankChart = $("#rank-chart"), roffset = $rankChart.offset(), rx = roffset.left, ry = roffset.top, cellsPerCol = Math.ceil(Ele.electors.length / 3), cellWidth = Math.ceil(Ele.electors[0].rankSpan.outerWidth(true)), cellHeight = Ele.electors[0].rankSpan.outerHeight(true);
        for (let e of Ele.electors) {
            let eoffset = e.rankSpan.offset(), ex = eoffset.left, ey = eoffset.top, el = e.get_location(), ty = el % cellsPerCol * cellHeight + ry, tx = Math.floor(el / cellsPerCol) * cellWidth + rx, espeed = e.speed;
            if (Math.abs(ex - tx) <= 0.5) {
                espeed.x = 0;
            }
            else {
                let diffx = tx - ex;
                espeed.x = (diffx > 0) ? Math.min(espeed.x + 4, Math.ceil(diffx / 5)) : Math.max(espeed.x - 4, Math.floor(diffx / 5));
            }
            if (Math.abs(ey - ty) <= 0.5) {
                espeed.y = 0;
            }
            else {
                let diffy = ty - ey;
                espeed.y = (diffy > 0) ? Math.min(espeed.y + 4, Math.ceil(diffy / 5)) : Math.max(espeed.y - 4, Math.floor(diffy / 5));
            }
            e.move();
        }
    }
    setTimeout(fresh, 50);
}
fresh();
