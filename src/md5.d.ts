declare module MD5 {

export class MD5 {
	public constructor ();
	private hexcase: number;
	private b64pad: string;
	public hex_md5(s: string): string;
	public b64_md5(s: string): string;
	public any_md5(s: string, e: string): string;
	public hex_hmac_md5(k: string, d: string): string;
	private b64_hmac_md5(k: string, d: string): string;
	private any_hmac_md5(k: string, d: string, e: string): string;
	public md5_vm_test(): boolean;
	public rstr_md5(s: string): string;
	public rstr_hmac_md5(key: string, data: string): string;
	public rstr2hex(input: string): string;
	public rstr2b64(input: string): string;
	public rstr2any(input: string): string;
	public str2rstr_utf8(input: string): string;
	public str2rstr_utf16le(input: string): string;
	public str2rstr_utf16be(input: string): string;
	public rstr2any(input: string): string;
	public rstr2binl(input: string): number[];
	public binl2rstr(input: number[]): string;
	public binl_md5(x: number[], len: number): number[]
	public safe_add(x: number, y: number): number;
	public bit_rol(num: number, cnt: number): number
}

}