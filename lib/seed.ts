// Seed manual (opsional). Seed sebenarnya berjalan otomatis saat koneksi DB pertama.
// Jalankan: bun run seed
import { getDb } from "./db";
import { getBalance, getSettings, listCategories, listSemesters } from "./queries";

getDb();
const s = getSettings();
console.log("✓ Database siap.");
console.log(`  Dana        : ${s.fund_name}`);
console.log(`  Saldo awal  : Rp${s.initial_balance.toLocaleString("id-ID")}`);
console.log(`  Saldo kini  : Rp${getBalance().balance.toLocaleString("id-ID")}`);
console.log(`  Kategori    : ${listCategories().length}`);
console.log(`  Semester    : ${listSemesters().length}`);
