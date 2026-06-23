import { prisma } from "../lib/prisma";
import { calculateScore } from "../lib/ranking";

/**
 * Seed script for development
 * Run with: npm run db:seed
 */
async function main() {
  console.log("Seeding database...");

  const demoUsers = [
    { username: "alice_wonder", totalAmount: 12500, totalTransactions: 45 },
    { username: "bob_builder", totalAmount: 8300, totalTransactions: 32 },
    { username: "charlie_dev", totalAmount: 45200, totalTransactions: 12 },
    { username: "diana_design", totalAmount: 6700, totalTransactions: 28 },
    { username: "eve_security", totalAmount: 22100, totalTransactions: 8 },
    { username: "frank_sys", totalAmount: 3400, totalTransactions: 67 },
    { username: "grace_hopper", totalAmount: 18900, totalTransactions: 19 },
    { username: "hank_ops", totalAmount: 5600, totalTransactions: 41 },
  ];

  for (let i = 0; i < demoUsers.length; i++) {
    const user = demoUsers[i];
    const score = calculateScore(user.totalAmount, user.totalTransactions);

    const created = await prisma.user.upsert({
      where: { username: user.username },
      create: {
        username: user.username,
        totalAmount: user.totalAmount,
        totalTransactions: user.totalTransactions,
        score,
      },
      update: {
        totalAmount: user.totalAmount,
        totalTransactions: user.totalTransactions,
        score,
      },
    });

    // Create some sample transactions
    const transactionCount = Math.min(user.totalTransactions, 5);
    for (let j = 0; j < transactionCount; j++) {
      await prisma.transaction.upsert({
        where: { transactionId: `seed_${user.username}_${j}` },
        create: {
          transactionId: `seed_${user.username}_${j}`,
          amount: user.totalAmount / user.totalTransactions,
          type: "purchase",
          userId: created.id,
        },
        update: {},
      });
    }

    console.log(`Created/updated user: ${user.username} (score: ${score.toFixed(2)})`);
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
