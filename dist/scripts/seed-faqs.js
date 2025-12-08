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
        {
            question: 'Will you post my photos on your social media?',
            answer: 'No.\nWe never post any photos without the client’s consent.\nYour privacy and comfort are very important to us. You decide if and what you would like us to share.',
            category: 'Policies',
        },
        {
            question: 'Do you provide makeup?',
            answer: 'Yes, professional makeup is included in all packages. Our makeup artists are experienced in working with pregnant women.',
            category: 'Services',
        },
        {
            question: 'Does makeup include lashes?',
            answer: 'No. Lashes are offered at KSH 500 extra, or you may bring your own.',
            category: 'Services',
        },
        {
            question: 'Do you provide hair styling?',
            answer: 'Basic hair styling is provided. Wig styling and installation is available at KSH 3,000. Please inform us in advance.',
            category: 'Services',
        },
        {
            question: 'Do you provide accessories?',
            answer: 'Yes, we provide accessories for the shoot. You only need to bring personal accessories such as earrings.',
            category: 'Services',
        },
        {
            question: 'Do you provide gowns and outfits?',
            answer: 'Yes. We have over 300 luxury gowns designed for maternity shoots.',
            category: 'Services',
        },
        {
            question: 'Do you provide gowns for sale or rental?',
            answer: 'No. Our gowns are exclusively for studio use during shoots. They are not available for sale or rental.',
            category: 'Services',
        },
        {
            question: 'Do the packages include video or reels?',
            answer: 'No, professional reels are offered at a fee. We can take behind-the-scenes for free using our studio phone.',
            category: 'Services',
        },
        {
            question: 'Do the packages include printing?',
            answer: 'Some packages include photobooks or A3 mounts. Additional prints can be ordered at a fee.',
            category: 'Services',
        },
        {
            question: 'Do you offer newborn shoots?',
            answer: 'Yes, newborn sessions are available on request, pricing depends on concept.',
            category: 'Services',
        },
        {
            question: 'Do I get to choose the outfits?',
            answer: 'Yes. You choose the outfits of your choice from our Instagram gallery. Everything is adjustable to any size.',
            category: 'Preparation',
        },
        {
            question: 'What if I’m not able to choose outfits prior?',
            answer: 'No worries. We have an in-house stylist who will help you select gowns and advise you during your session.',
            category: 'Preparation',
        },
        {
            question: 'Can I bring extra outfits of my own?',
            answer: 'Yes. We allow one extra outfit of your own, or you may substitute one of our outfits with yours.',
            category: 'Preparation',
        },
        {
            question: 'Do you provide props?',
            answer: 'Our studio is specifically designed for pregnant moms, so we have sets, props, and concepts created for maternity shoots.',
            category: 'Preparation',
        },
        {
            question: 'Can I include my partner and children?',
            answer: 'Yes, you can include your family in the shoot. We recommend choosing outfits from our Instagram gallery prior to color coordinate.',
            category: 'Preparation',
        },
        {
            question: 'Do you help with poses?',
            answer: 'Yes. Our photographer will guide you with all poses and help you feel comfortable and confident.',
            category: 'Preparation',
        },
        {
            question: 'What do I need to bring?',
            answer: 'Wear black bra and panties. Bring personal accessories like earrings and props such as baby sonograms, baby shoes, and outfits.',
            category: 'Preparation',
        },
        {
            question: 'How long is the shoot?',
            answer: 'Depending on your package, studio sessions run between 1.5 – 3.5 hours.',
            category: 'Preparation',
        },
        {
            question: 'How long do edits take?',
            answer: 'Edited photos will be ready within 10 working days after your shoot. Express delivery available at extra fee.',
            category: 'Preparation',
        },
        {
            question: 'Can I request a specific photographer?',
            answer: 'Yes, depending on availability.',
            category: 'Preparation',
        },
        {
            question: 'Can I do nude or semi-nude maternity?',
            answer: 'Yes, based on your comfort. This is handled professionally and privately',
            category: 'Preparation',
        },
        {
            question: 'What if I’m late for my session?',
            answer: 'Arrive 30 minutes earlier for makeup and 1 hour earlier for wig styling. If you are late, the session continues within booked time.',
            category: 'Policies',
        },
        {
            question: 'Do you offer outdoor shoots?',
            answer: 'We are currently only offering studio shoots.',
            category: 'Policies',
        },
        {
            question: 'Can I come without a booking?',
            answer: 'We work strictly by appointment. A deposit is required to secure your slot.',
            category: 'Policies',
        },
        {
            question: 'How do I book?',
            answer: 'Choose your package and date, then pay deposit to Till number 670241. Share Mpesa confirmation to confirm booking.',
            category: 'Booking',
        },
        {
            question: 'When is the balance paid?',
            answer: 'Remaining balance is paid after the shoot at the studio. We accept Mpesa or cash.',
            category: 'Booking',
        },
        {
            question: 'What is the rescheduling policy?',
            answer: 'Reschedules must be made at least 72 hours before your shoot. Changes within 72 hours forfeit the deposit.',
            category: 'Policies',
        },
        {
            question: 'What is the cancellation policy?',
            answer: 'Cancellations within 72 hours result in forfeiture of deposit. A new booking requires a new deposit.',
            category: 'Policies',
        },
        {
            question: 'Can I get raw files?',
            answer: 'Yes, raw files are available at an extra fee.',
            category: 'Policies',
        },
        {
            question: 'Do you offer weekend shoots?',
            answer: 'Yes, weekend slots are available. Book early as they fill fast.',
            category: 'Booking',
        },
        {
            question: 'Is parking available?',
            answer: 'Yes, secure parking is available at Diamond Plaza Annex.',
            category: 'Facility',
        },
        {
            question: 'Is the studio safe for pregnant moms?',
            answer: 'Yes, our space is designed for pregnant women, and we are an all-women team trained to handle maternity clients.',
            category: 'Facility',
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