declare module Ver {

export class Version {
	public first: number;
	public second: number;
	public third: number;
	public fourth: number;
	public stage: string;
	constructor (_first: number, _second: number, _third: number, _fourth: number, _stage: string);
	public to_string(): string;
}

export function version_later(ver1: Version, ver2: Version, includeEqual?: boolean): boolean;
export function version_earlier(ver1: Version, ver2: Version, includeEqual?: boolean): boolean;
export function to_version(verString: string): Version;

} 