/**
 * @file 定义Version类
 */
var Ver;
(function (Ver) {
    var Version = /** @class */ (function () {
        function Version(_first, _second, _third, _fourth, _stage) {
            this.first = 0;
            this.second = 0;
            this.third = 0;
            this.fourth = -1;
            this.first = _first;
            this.second = _second;
            this.third = _third;
            this.fourth = _fourth;
            this.stage = _stage;
        }
        Version.prototype.to_string = function () {
            return "".concat(this.first, ".").concat(this.second, ".").concat(this.third).concat((this.fourth == -1) ? ("") : ("." + this.fourth.toString())).concat((this.stage.length > 0) ? "(" + this.stage + ")" : "", ")");
        };
        return Version;
    }());
    Ver.Version = Version;
    ;
    function version_later(ver1, ver2, includeEqual) {
        if (includeEqual === void 0) { includeEqual = true; }
        if (ver1.first > ver2.first)
            return true;
        else if (ver1.first < ver2.first)
            return false;
        if (ver1.second > ver2.second)
            return true;
        else if (ver1.second < ver2.second)
            return false;
        if (ver1.third > ver2.third)
            return true;
        else if (ver1.third < ver2.third)
            return false;
        if (ver1.fourth > ver2.fourth)
            return true;
        else if (ver1.fourth < ver2.fourth)
            return false;
        return includeEqual;
    }
    Ver.version_later = version_later;
    function version_earlier(ver1, ver2, includeEqual) {
        if (includeEqual === void 0) { includeEqual = true; }
        if (ver1.first > ver2.first)
            return false;
        else if (ver1.first < ver2.first)
            return true;
        if (ver1.second > ver2.second)
            return false;
        else if (ver1.second < ver2.second)
            return true;
        if (ver1.third > ver2.third)
            return false;
        else if (ver1.third < ver2.third)
            return true;
        if (ver1.fourth > ver2.fourth)
            return false;
        else if (ver1.fourth < ver2.fourth)
            return true;
        return includeEqual;
    }
    Ver.version_earlier = version_earlier;
    function to_version(verString) {
        var strlist = verString.split(" "), version_number = strlist[0], version_stage = (strlist.length >= 1) ? strlist[1].slice(1, strlist[1].length - 1) : "", vnlist = version_number.split("."), vn_first = parseInt(vnlist[0]), vn_second = (vnlist.length >= 2) ? parseInt(vnlist[1]) : 0, vn_third = (vnlist.length >= 3) ? parseInt(vnlist[2]) : 0, vn_fourth = (vnlist.length >= 4) ? parseInt(vnlist[3]) : (-1), ver = new Version(vn_first, vn_second, vn_third, vn_fourth, version_stage);
        return ver;
    }
    Ver.to_version = to_version;
})(Ver || (Ver = {}));
