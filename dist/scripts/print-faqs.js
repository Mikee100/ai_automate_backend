"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
//# sourceMappingURL=print-faqs.js.map