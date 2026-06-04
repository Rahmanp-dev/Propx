const r = { month: 5, year: 2026 };

const monthStr = r.month.toString().padStart(2, '0')
const startDate = new Date(`${r.year}-${monthStr}-01T00:00:00.000Z`)
startDate.setHours(startDate.getHours() - 12)

const endDate = new Date(startDate)
endDate.setMonth(endDate.getMonth() + 1)

console.log("startDate:", startDate.toISOString());
console.log("endDate:", endDate.toISOString());

const serverLocalMay1 = new Date(2026, 4, 1);
console.log("serverLocalMay1:", serverLocalMay1.toISOString());

console.log("Matches?", serverLocalMay1 >= startDate && serverLocalMay1 < endDate);
