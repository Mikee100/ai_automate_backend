import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const faqs = await prisma.knowledgeBase.findMany();
  if (!faqs.length) {
    console.log('No FAQ entries found.');
    return;
  }
  console.log('FAQ entries in the database:');
  faqs.forEach(faq => {
    console.log(`Q: ${faq.question}\nA: ${faq.answer}\n---`);
  });
}

main().finally(() => prisma.$disconnect());