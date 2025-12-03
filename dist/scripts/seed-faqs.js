"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding FAQs...');
    const faqs = [
        {
            question: 'When is the best time to schedule my session?',
            answer: 'The ideal time for a maternity shoot is between 28 and 34 weeks of pregnancy. At this stage, your baby bump is well-defined, and you’re likely to feel more comfortable during the session compared to the later weeks of pregnancy. However, we’re happy to accommodate your schedule if these weeks aren’t suitable.',
            category: 'General',
        },
        {
            question: 'Can my partner and other children join the shoot?',
            answer: 'Absolutely! Maternity sessions are about celebrating this special time for the entire family. Including your partner and children adds warmth and meaning to the photos. We can plan poses and setups that involve everyone while keeping the focus on you and your pregnancy.',
            category: 'General',
        },
        {
            question: 'Do you provide outfits and props?',
            answer: 'Yes. Our packages include professional makeup and outfits. We provide a wide variety of unique outfits, props, and accessories to make your session seamless and stress-free. Whether you prefer glamorous gowns or casual looks, we’ve got you covered. You’re also welcome to bring any sentimental items or personal outfits you\'d like to include.',
            category: 'Services',
        },
    ];
    const newFaqs = [
        {
            question: 'What should I bring to the session?',
            answer: 'Just bring yourself and any personal items you’d like to include, such as baby ultrasound photos, baby shoes, and your personal accessories. We’ll handle the rest, including outfits, props, accessories, and styling.',
            category: 'Preparation',
        },
        {
            question: 'What if I’m camera shy or don’t know how to pose?',
            answer: 'No need to worry! Our experienced photographers will guide you through every step of the session, from poses to facial expressions, ensuring you look and feel confident in every shot.',
            category: 'General',
        },
        {
            question: 'What if I’m not satisfied with my photos?',
            answer: 'Customer satisfaction is our priority. If you’re not completely happy, we’ll work with you to make adjustments or even offer a reshoot in certain cases.',
            category: 'Policies',
        },
        {
            question: 'Can I bring my own videographer to capture behind-the-scenes moments?',
            answer: 'While we focus on creating a seamless experience, we are open to accommodating a personal videographer for behind-the-scenes content upon request. We ask that this be discussed during the consultation.',
            category: 'Policies',
        },
        {
            question: 'Do I get to choose the background of my choice?',
            answer: 'Yes. We offer over 15 exquisitely curated sets designed to celebrate pregnancy. Options include luxurious flower backdrops, glamorous chandeliers, boho themes, grand staircases, timeless plain backdrops, and a lush green garden-like setting. We also have a unique boat set for dreamy and artistic portraits. Each backdrop is crafted to make clients feel radiant and help create stunning, timeless images.',
            category: 'Services',
        },
        {
            question: 'What is your website?',
            answer: 'You can visit our website at https://fiestahouseattire.com/ to learn more about our services, view our portfolio, and explore our packages! 🌸✨',
            category: 'Contact',
        },
        {
            question: 'How can I contact customer care?',
            answer: 'You can reach our customer care team at 0720 111928. We\'re here to help! 💖 You can also email us at info@fiestahouseattire.com for any inquiries.',
            category: 'Contact',
        },
        {
            question: 'What are your business hours?',
            answer: 'We\'re open Monday-Saturday: 9:00 AM - 6:00 PM. Feel free to visit us or book an appointment during these times! 🕐✨',
            category: 'Contact',
        },
        {
            question: 'What are your contact details?',
            answer: 'Here are our complete contact details:\n\n📍 Location: 4th Avenue Parklands, Diamond Plaza Annex, 2nd Floor, Nairobi, Kenya\n📞 Phone: 0720 111928\n📧 Email: info@fiestahouseattire.com\n🌐 Website: https://fiestahouseattire.com/\n🕐 Hours: Monday-Saturday: 9:00 AM - 6:00 PM\n\nWe look forward to welcoming you! 💖',
            category: 'Contact',
        },
    ];
    faqs.push(...newFaqs);
    for (const faq of faqs) {
        const existing = await prisma.knowledgeBase.findFirst({
            where: { question: faq.question },
        });
        if (!existing) {
            await prisma.knowledgeBase.create({
                data: {
                    question: faq.question,
                    answer: faq.answer,
                    category: faq.category,
                    embedding: [],
                },
            });
            console.log(`Created FAQ: ${faq.question}`);
        }
        else {
            console.log(`Skipped existing FAQ: ${faq.question}`);
        }
    }
    console.log('FAQ seeding completed.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-faqs.js.map