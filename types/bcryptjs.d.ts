// Deklarasi tipe minimal untuk bcryptjs v2 (paket tidak menyertakan tipe sendiri).
declare module "bcryptjs" {
  export function hashSync(data: string, salt: number | string): string;
  export function compareSync(data: string, encrypted: string): boolean;
  export function genSaltSync(rounds?: number): string;
  export function hash(data: string, salt: number | string): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;

  const bcrypt: {
    hashSync: typeof hashSync;
    compareSync: typeof compareSync;
    genSaltSync: typeof genSaltSync;
    hash: typeof hash;
    compare: typeof compare;
  };
  export default bcrypt;
}
