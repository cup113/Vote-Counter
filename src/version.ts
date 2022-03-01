/**
 * @file 定义Version类
 */

module Ver {

export class Version {
	public first: number = 0;
	public second: number = 0;
	public third: number = 0;
	public fourth: number = -1;
	public stage: string; // 开发阶段
	constructor (_first: number, _second: number, _third: number, _fourth: number, _stage: string) {
		this.first = _first;
		this.second = _second;
		this.third = _third;
		this.fourth = _fourth;
		this.stage = _stage;
	}
	public to_string(): string {
		return `${this.first}.${this.second}.${this.third}${(this.fourth == -1)? (""): ("." + this.fourth.toString())} (${this.stage})`;
	}
};

export function version_later(ver1: Version, ver2: Version, includeEqual: boolean = true): boolean {
	if (ver1.first > ver2.first) return true;
	else if (ver1.first < ver2.first) return false;
	if (ver1.second > ver2.second) return true;
	else if (ver1.second < ver2.second) return false;
	if (ver1.third > ver2.third) return true;
	else if (ver1.third < ver2.third) return false;
	if (ver1.fourth > ver2.fourth) return true;
	else if (ver1.fourth < ver2.fourth) return false;
	return includeEqual;
}

export function version_earlier(ver1: Version, ver2: Version, includeEqual: boolean = true): boolean {
	if (ver1.first > ver2.first) return false;
	else if (ver1.first < ver2.first) return true;
	if (ver1.second > ver2.second) return false;
	else if (ver1.second < ver2.second) return true;
	if (ver1.third > ver2.third) return false;
	else if (ver1.third < ver2.third) return true;
	if (ver1.fourth > ver2.fourth) return false;
	else if (ver1.fourth < ver2.fourth) return true;
	return includeEqual;
}

export function to_version(verString: string): Version {
	var strlist = verString.split(" "),
	version_number = strlist[0],
	version_stage = strlist[1].slice(1, strlist[1].length - 1),
	vnlist = version_number.split("."),
	vn_first = parseInt(vnlist[0]),
	vn_second = parseInt(vnlist[1]),
	vn_third = parseInt(vnlist[2]),
	vn_fourth = (vnlist.length == 4)? parseInt(vnlist[3]): (-1),
	ver = new Version(vn_first, vn_second, vn_third, vn_fourth, version_stage);
	return ver;
}

}