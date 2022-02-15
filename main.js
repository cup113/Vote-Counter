'use strict';

let votes = 1, //单次投票数（可为负数）
electors = [], //选举人
chartMin = 0,
chartMax = 1,
basicInf = {
    title = "计票器",
    people = ["张三", "李四", "王五"],
    mainSepLine = 2,
    secSepLine = 1,
    votestring = "0,0,0"
};

function map(func, list){
    newList = [];
    for (i in list){
        newList.push(func(list[i]));
    }
    return newList;
}
function storage_init(){
    //初始化localStorage
    if (localStorage.votingCount === undefined){
        localStorage.votingCount = JSON.stringify(basicInf);
     }
    basicInf = JSON.parse(localStorage);
    $("titleInput").val(basicInf.title);
    $("#titleSet").val(basicInf.title);
    $("#people").val(basicInf.people.toString());
    $("#mainSepLine").val(basicInf.mainSepLine);
    $("#secSepLine").val(basicInf.secSepLine);
}
storage_init();

function refresh_storage() {
    localStorage.votingCount = JSON.stringify(basicInf);
}

function set_title(newTitle, toStorage=true){
    if (newTitle === null) return;
    basicInf.title = newTitle;
    if (toStorage) refresh_storage();
    $("#titleInput").val(title);
    $("#titleSet").val(title);
}
function set_people(newPeople, toStorage=true, reset=true){
    if (newPeople === null) return;
    people = newPeople;
    people = people.split(",");
    newPeople = newPeople.split(",");
    people2 = map((a)=>a, people);
    if (toStorage){
        localStorage.people = people.join(",");
    }
    votestring = [];
    let electorNum = electors.length;
    for (let i=0; i<electorNum; i++){
        remove_elector(0);
    }
    people = people2;
    for (let i in newPeople){
        add_elector(parseInt(i));
        votestring.push(0);
    }
    di("people").value = people.join(",");
}
function set_mainSepLine(newMainSepLine, toStorage=true){
    if (newMainSepLine === null){
        return;
    }
    newMainSepLine = parseInt(newMainSepLine);
    if (isNaN(newMainSepLine)){
        return;
    }
    mainSepLine = newMainSepLine;
    if (toStorage){
        localStorage.mainSepLine = mainSepLine;
    }
    di("mainSepLine").value = mainSepLine;
    for (let i in electors){
        let elector = electors[i];
        elector.set_progress(elector.progress);
    }
}
function set_secSepLine(newSecSepLine, toStorage=true){
    if (newSecSepLine === null){
        return;
    }
    newSecSepLine = parseInt(newSecSepLine);
    if (isNaN(newSecSepLine)){
        return;
    }
    secSepLine = newSecSepLine;
    if (toStorage){
        localStorage.secSepLine = secSepLine;
    }
    di("secSepLine").value = secSepLine;
    for (let i in electors){
        let elector = electors[i];
        elector.set_progress(elector.progress);
    }
}
function set_votestring(newVotestring, toStorage=true){
    if (newVotestring === null){
        return;
    }
    voteList = newVotestring.split(",");
    if (voteList.length !== people.length){
        return;
    }
    for (let i in voteList){
        voteList[i] = parseInt(voteList[i]);
        if (isNaN(voteList[i])){
            return;
        }
    }
    if (toStorage){
        localStorage.votestring = votestring.join(",");
    }
    votestring = map(parseInt, votestring);
    for (let i in electors){
        let elector = electors[i];
        elector.set_vote(voteList[i]);
    }

}
function add_elector(electorNum){
    let elector = new Elector(electorNum+1, people[electorNum]);
    electors.push(elector);
    let voteButtons = di("voteButtons"),
    rankChart = di("rankChart"),
    votingDiv = di("votingDiv");
    voteButtons.appendChild(elector.voteButton);
    rankChart.appendChild(elector.rankLine);
    votingDiv.style.top = (votingDiv.offsetHeight - rankChart.offsetHeight) + "px";
    if (votestring.length < electorNum){
        votestring.push(0);
    }
    di("people").value = people.join(",");
}
function remove_elector(electorNum){
    let elector = electors[electorNum],
    voteButtons = di("voteButtons"),
    rankChart = di("rankChart"),
    votingDiv = di("votingDiv"),
    rankLine = elector.rankLine,
    voteButton = elector.voteButton;
    voteButtons.removeChild(voteButton);
    rankChart.removeChild(rankLine);
    electors.splice(electorNum, 1);
    votestring.splice(electorNum, 1);
    people.splice(electorNum, 1);
    for (let i in electors){
        i = parseInt(i)
        let elector = electors[i];
        elector.number = i+1;
        elector.voteButton.children[0].innerText = elector.number;
        elector.voteButton.children[1].innerText = (i+1) + "-" +
        elector.voteButton.children[1].innerText.split("-")[1];
        eval(`elector.voteButton.onclick = function(){add_elector_vote(${elector.number})}`);
    }
    if (electors.length > 0){
        electors[0].set_vote(electors[0].vote);
    }
    votingDiv.style.top = (votingDiv.offsetHeight - rankChart.offsetHeight) + "px";
    di("people").value = people.join(",");
}
function add_elector_vote(electorNum){
    let elector = electors[electorNum-1], //0开始
    voteTips = di("voteTips"),
    voteTip = document.createElement("span"),
    votesPos = (votes>=0)? 1: 0, //正1负0
    addVoteText = (votesPos===1)? "+"+votes: "-"+(-votes);
    voteTip.innerText = `${electorNum}号${elector.name}：票数${addVoteText}`;
    voteTip.style.color = `rgba(${200-votesPos*200}, ${votesPos*200}, ${200-votesPos*200}, 0.99)`;
    voteTips.appendChild(voteTip);
    elector.set_vote(votes + elector.vote);
}
class Elector{
    constructor(number, name){
        this.number = number; //1开始
        this.name = name;
        this.vote = votestring[number-1]; //票数
        this.vote = (this.vote === undefined)?0: this.vote;
        this.rank = 1; //排名
        this.rankLast = 1; //变更上次排名
        this.voteButton = document.createElement("p");
        eval(`this.voteButton.onclick = function(){add_elector_vote(${this.number})}`);
        let newSpan = document.createElement("span"), //编号
        newBr = document.createElement("br"), //换行
        newBr2 = document.createElement("br"),
        newSpan2 = document.createElement("span"), //人名
        newSpan3 = document.createElement("span"); //已有票数
        newSpan.innerText = this.number;
        newSpan.style.fontSize = "2em";
        this.voteButton.appendChild(newSpan);
        this.voteButton.appendChild(newBr);
        newSpan2.innerText = this.name;
        newSpan2.style.fontSize = "0.5em";
        this.voteButton.appendChild(newSpan2);
        this.voteButton.appendChild(newBr2);
        newSpan3.innerText = this.vote;
        this.voteButton.appendChild(newSpan3);
        this.rankLine = document.createElement("div");
        this.rankLine.style.top = "0px";
        this.rankLine.style.left = "0px";
        let newP1 = document.createElement("p"), //排名
        newP2 = document.createElement("p"), //学号+名字
        newP3 = document.createElement("p"), //排名
        newP4 = document.createElement("p"); //排名变化
        newP1.innerText = this.rank;
        newP2.innerText = this.number + "-" + this.name;
        newP3.innerText = this.vote;
        newP4.innerText = "--"
        this.rankLine.appendChild(newP1);
        this.rankLine.appendChild(newP2);
        this.rankLine.appendChild(newP3);
        this.rankLine.appendChild(newP4);
        this.moveySpeed = 0; //向下移动的速度（rankChart）
        this.movexSpeed = 0; //向右移动的速度
        this.absRank = number; //排在第几位
        this.progress = 0.5; //进度条，0.5额外加
        this.rankLine.style.backgroundImage = `linear-gradient(90deg, gold 0%, gold 19.9%,`+
        `khaki 20%, khaki 100%)`;
    }
    set_progress(progress){
        this.progress = progress;
        let color = (this.rank<=secSepLine)? "gold": (this.rank<=mainSepLine)? "greenyellow": "#0DD";
        this.rankLine.style.backgroundImage = `linear-gradient(90deg, ${color} 0%, ${color} ${progress*80+20-0.01}%,`+
        `khaki ${progress*80+20}%, khaki 100%)`;
    }
    set_vote(vote){
        vote = parseInt(vote);
        if (isNaN(vote)){
            return;
        }
        this.vote = vote;
        this.voteButton.children[4].innerText = vote;
        this.rankLine.children[2].innerText = vote;
        let tickets = [],
        absRanks = []
        for (let i in electors){
            let elector = electors[i];
            tickets.push(elector.vote);
        }
        tickets = sort(tickets);
        for (let i in electors){
            let elector = electors[i];
            elector.rankLast = elector.rank;
            elector.rank = tickets.indexOf(elector.vote) + 1;
            if (elector.rankLast == elector.rank){
                elector.rankLine.children[3].innerText = "--"
                elector.rankLine.children[3].style.color = "black";
            }
            else if (elector.rankLast < elector.rank){
                //名次下降
                elector.rankLine.children[3].innerText = "▼" + (elector.rank - elector.rankLast);
                elector.rankLine.children[3].style.color = "red";
            }
            else{
                elector.rankLine.children[3].innerText = "▲" + (elector.rankLast - elector.rank);
                elector.rankLine.children[3].style.color = "green";
            }
            elector.rankLine.children[0].innerText = elector.rank;
            let absRank = elector.rank;
            while (absRanks.indexOf(absRank) !== -1){
                absRank += 1;
            }
            absRanks.push(absRank);
            elector.absRank = absRank;
        }
        chartMin = tickets[tickets.length - 1];
        chartMax = tickets[0] + 1;
        for (let i in electors){
            electors[i].set_progress((electors[i].vote-chartMin)/(chartMax-chartMin));
        }
        votestring[this.number-1] = this.vote;
        localStorage.votestring = votestring.join(",");
    }
}
for (let i=0; i<people.length; i++){
    add_elector(i)
}
if (electors.length>0){
    electors[0].set_vote(electors[0].vote); //刷新进度条
    electors[0].set_vote(electors[0].vote); //去掉名次上下
}
function turn_name(){
    //改变标题
    let title = prompt("请输入标题：");
    set_title(title, false);
}
function start_settings(){
    //打开设置
    let settingsDiv = di("settingsDiv");
    settingsDiv.style.display = (settingsDiv.style.display === "none")?"block": "none";
}
function view_storage(){
    //查看localStorage
    let strReturn = ""
    strReturn += "title::" + localStorage.title;
    strReturn += ";,;people::" + localStorage.people;
    strReturn += ";,;mainSepLine::" + localStorage.mainSepLine;
    strReturn += ";,;secSepLine::" + localStorage.secSepLine;
    strReturn += ";,;votestring::" + localStorage.votestring;
    di("clipboard").style.display = "block";
    di("clipText").innerText = strReturn
}
function import_storage(){
    //导入到localStorage
    let strStorage = prompt("请输入要导入的字符串");
    if (strStorage === null){return;}
    let listStorage = strStorage.split(";,;"),
    listStorageNew = {};
    for (let i in listStorage){
        let storageSmall = listStorage[i].split("::");
        if (storageSmall.length !== 2){
            alert("非法格式："+listStorage[i]);
            return;
        }
        listStorageNew[storageSmall[0]] = storageSmall[1];
    }
    if (!("title" in listStorageNew && "people" in listStorageNew && "mainSepLine" in listStorageNew &&
    "secSepLine" in listStorageNew && "votestring" in listStorageNew)){
        alert("缺少属性");
    }
    set_title(listStorageNew["title"]);
    set_people(listStorageNew["people"]);
    set_mainSepLine(listStorageNew["mainSepLine"]);
    set_secSepLine(listStorageNew["secSepLine"]);
    set_votestring(listStorageNew["votestring"]);
}
function set_votes(newVotes){
    if (newVotes === null){
        return;
    }
    newVotes = parseInt(newVotes);
    if (isNaN(newVotes)){
        return;
    }
    votes = newVotes;
    di("voteNum").innerText = votes;
}
function add_vote_num(){
    set_votes(votes+1)
}
function reduce_vote_num(){
    set_votes(votes-1)
}
function set_vote_num(){
    let voteNum = prompt("请输入单次投票数：");
    set_votes(voteNum);
}
function reset_vote(){
    //重置投票
    for (let i in electors){
        elector = electors[i];
        elector.set_vote(0);
        set_votes(1)
    }
}
function append_people(){
    //增加人员
    let newPeople = prompt("请输入新增人员（多个请以英文逗号分隔）：");
    if (newPeople === null){
        return;
    }
    newPeople = newPeople.split(",");
    for (let i in newPeople){
        let person = newPeople[i];
        people.push(person);
        add_elector(people.length-1);
    }
}
function remove_people(){
    //删除人员
    let delPeople = prompt("请输入删除人员编号（多个以英文逗号分隔，以减号相连）："),
    delPeople2 = [];
    if (delPeople === null){
        return;
    }
    delPeople = delPeople.split(",");
    for (let i in delPeople){
        let delPerson = delPeople[i],
        delPerson2 = []; //一个一个
        delPerson = delPerson.split("-");
        if (delPerson.length === 1){
            delPerson.push(delPerson[0]);
        }
        delPerson = [parseInt(delPerson[0]), parseInt(delPerson[1])];
        if (isNaN(delPerson[0]) || isNaN(delPerson[1])){
            continue;
        }
        if (delPerson[0] > delPerson[1]){
            continue;
        }
        for (let j=delPerson[0]; j<=delPerson[1]; j++){
            delPerson2.push(j);
        }
        for (let j in delPerson2){
            let delPerson3 = delPerson2[j];
            if (delPeople2.indexOf(delPerson3) === -1){
                //不重复就加入
                delPeople2.push(delPerson3);
            }
        }
    }
    delPeople2 = sort(delPeople2);
    for (let i in delPeople2){
        let delPerson = delPeople2[i];
        remove_elector(delPerson-1)
    }
}
function ok_save(){
    //确定并保存
    set_title(di("titleSet").value);
    if (di("people").value !== people.join(",")){
        set_people(di("people").value);
    }
    localStorage.people = people.join(",");
    set_mainSepLine(dif("mainSepLine"));
    set_secSepLine(dif("secSepLine"));
    di("settingsDiv").style.display = "none";
}
function ok(){
    //确定
    set_title(di("titleSet").value, false);
    if (di("people").value !== people.join(",")){
        set_people(di("people").value, false);
    }
    set_mainSepLine(di("mainSepLine").value, false);
    set_secSepLine(di("secSepLine").value, false);
    di("settingsDiv").style.display = "none";
}
function close_clipboard(){
    di("clipboard").style.display = "none";
}
window.onload = mainLoop;
function mainLoop(){
    //主循环
    //voteTips降低透明度
    let voteTips = di("voteTips");
    if (voteTips.children.length > 0){
        let voteTip = voteTips.children[0],
        voteTipColor = voteTip.style.color,
        alpha;
        voteTipColor = voteTipColor.split(",");
        alpha = parseFloat(voteTipColor[3].split(")")[0]) - 0.005 * voteTips.children.length *
        (1 + voteTips.children.length ** 3 * 0.005);
        alpha = Math.round(100*alpha)/100;
        if (alpha < 0){
            voteTips.removeChild(voteTip);
        }
        else{
            voteTipColor[3] = `${alpha})`;
            voteTipColor = voteTipColor.join(",");
            voteTip.style.color = voteTipColor;
        }
    }
    for (let i=0; i<electors.length; i++){
        elector = electors[i],
        targetY = 36 * (Math.floor(i/2) - Math.floor((elector.absRank-1)/2)), //最终要向上偏移的px
        nowY = -parseFloat(elector.rankLine.style.top.split("px")[0]), //现在向上偏移的px
        diffY = targetY-nowY, //向上还差的px
        targetX = (di("rankChart").offsetWidth * 0.495 + 2) *
        (i%2 - (elector.absRank-1)%2), //最终要向左偏移的px
        nowX = -parseFloat(elector.rankLine.style.left.split("px")[0]), //现在向左偏移的px
        diffX = targetX-nowX; //向左还差的px
        if (Math.abs(diffY) > 0.5){
            // 如果绝对值大于0.5（超过半个像素）
            if (diffY>0){
                // 如果向左
                if (elector.moveySpeed>0){
                    // 不能向右
                    elector.moveySpeed = 0;
                    continue;
                }
                elector.moveySpeed = Math.max(elector.moveySpeed - 3, -diffY * 0.2);
            }
            else{
                // 否则向右
                if (elector.moveySpeed<0){
                    // 不能向左
                    elector.moveySpeed = 0;
                    continue;
                }
                elector.moveySpeed = Math.min(elector.moveySpeed + 3, -diffY * 0.2);
            }
            elector.rankLine.style.top = (elector.moveySpeed - nowY) + "px";
        }
        else{
            elector.moveySpeed = 0;
            elector.rankLine.style.top = -targetY + "px";
        }
        if (Math.abs(diffX) > 0.5){
            // 如果绝对值大于0.5（超过半个像素）
            if (diffX>0){
                // 如果向上
                if (elector.movexSpeed>0){
                    // 不能向下
                    elector.movexSpeed = 0;
                    continue;
                }
                elector.movexSpeed = Math.max(elector.movexSpeed - 4, -diffX * 0.3);
            }
            else{
                // 否则向下
                if (elector.movexSpeed<0){
                    // 不能向上
                    elector.movexSpeed = 0;
                    continue;
                }
                elector.movexSpeed = Math.min(elector.movexSpeed + 4, -diffX * 0.3);
            }
            elector.rankLine.style.left = (elector.movexSpeed - nowX) + "px";
        }
        else{
            elector.movexSpeed = 0;
            elector.rankLine.style.left = -targetX + "px";
        }
    }
    setTimeout(mainLoop, 50);
}