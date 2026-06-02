"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const faqs = [
        {
            question: 'When is the best time to schedule my session?',
            answer: 'The ideal time for a maternity shoot is between 28 and 34 weeks of pregnancy. At this stage, your baby bump is well-defined, and you’re likely to feel more comfortable during the session compared to the later weeks of pregnancy. However, we’re happy to accommodate your schedule if these weeks aren’t suitable.',
            category: 'General',
        },
        {
            question: 'Can my partner and other children join the shoot?',
            answer: 'Of course! Maternity sessions are a wonderful way to celebrate this special time with your entire family. We encourage involving your partner and children to add warmth and meaning to your photos, and we’ll guide you through poses that include everyone beautifully.',
            category: 'General',
        },
        {
            question: 'Do you provide outfits and props?',
            answer: 'Our packages include everything you need for a seamless experience—professional makeup, styling, and a wide variety of luxury gowns, props, and accessories. You are also more than welcome to bring any sentimental items or personal outfits you\'d like to feature.',
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
            answer: 'You certainly do. We offer over 15 exquisitely curated sets designed to celebrate pregnancy, including luxurious flower backdrops, glamorous chandeliers, boho themes, grand staircases, and a lush green garden setting. We even have a unique boat set for more artistic portraits. Each backdrop is crafted to make you feel radiant and create timeless images.',
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
            question: 'What are your opening days and hours? Are you open on Sunday? Which days are you closed? What time do you open and close?',
            answer: 'We are open from 9:00 AM to 7:00 PM every day except Monday. We are open on Sundays too! Our studio is closed only on Mondays. You can visit or book an appointment any other day, including weekends. If you have questions about our opening days, hours, or holiday schedule, just ask!',
            category: 'Contact',
        },
        {
            question: 'Can I book on a Monday? Are you open on Monday?',
            answer: 'Our studio is closed on Mondays, so we do not take any bookings for that day. We are open from Tuesday to Sunday, 9:00 AM to 7:00 PM, and you are welcome to book an appointment for any of those days! 💕',
            category: 'Contact',
        },
        {
            question: 'What are your contact details?',
            answer: 'Here are our complete contact details:\n\n📍 Location: 4th Avenue Parklands, Diamond Plaza Annex, 2nd Floor, Nairobi, Kenya\n📞 Phone: 0720 111928\n📧 Email: info@fiestahouseattire.com\n🌐 Website: https://fiestahouseattire.com/\n🕐 Hours: Tuesday-Sunday: 9:00 AM - 7:00 PM\n\nWe look forward to welcoming you! 💖',
            category: 'Contact',
        },
        {
            question: 'Will you post my photos on your social media?',
            answer: 'No.\nWe never post any photos without the client’s consent.\nYour privacy and comfort are very important to us. You decide if and what you would like us to share.',
            category: 'Policies',
        },
        {
            question: 'Do you provide makeup?',
            answer: 'Professional makeup is included in all our packages. Our talented makeup artists are specialized in maternity styling to ensure you look and feel your absolute best.',
            category: 'Services',
        },
        {
            question: 'Does makeup include lashes?',
            answer: 'No. Lashes are offered at KSH 500 extra, or you may bring your own.',
            category: 'Services',
        },
        {
            question: 'Do you provide hair styling?',
            answer: 'We provide basic hair styling with all sessions. Professional wig styling and installation are also available for KSH 3,000—please just let us know in advance so we can prepare accordingly.',
            category: 'Services',
        },
        {
            question: 'Do you provide accessories?',
            answer: 'We provide a curated selection of accessories for your shoot. You are only responsible for personal items such as earrings.',
            category: 'Services',
        },
        {
            question: 'Do you provide gowns and outfits?',
            answer: 'We take pride in our extensive collection of over 300 luxury gowns, exclusively designed to celebrate the beauty of maternity.',
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
            answer: 'You are welcome to choose your preferred outfits from our curated Instagram gallery. All our gowns are designed to be adjustable, ensuring a perfect and comfortable fit for any size.',
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
            answer: 'We’d love to have your family join the session! To ensure a cohesive look, we recommend selecting your outfits from our Instagram gallery in advance to help with color coordination.',
            category: 'Preparation',
        },
        {
            question: 'Do you help with poses?',
            answer: 'Our professional photographers will guide you through every pose, ensuring you feel comfortable, relaxed, and confident throughout your session.',
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
            answer: 'You are welcome to request a specific photographer, and we will do our best to accommodate you based on their availability.',
            category: 'Preparation',
        },
        {
            question: 'Can I do nude or semi-nude maternity?',
            answer: 'Of course. We handle these sessions with the utmost professionalism and privacy, ensuring you feel completely comfortable and respected throughout the process.',
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
            answer: 'We do offer weekend sessions. These slots are very popular and tend to fill up quickly, so we recommend booking as early as possible.',
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
        {
            question: 'What are your social media accounts?',
            answer: `You can follow us on our social media platforms for the latest updates, behind-the-scenes content, and stunning maternity photos:\n\n📸 Instagram: https://www.instagram.com/fiestahousematernity\n👍 Facebook: https://www.facebook.com/fiestahouseattire/\n\nWe'd love to have you as part of our community! Follow us to stay inspired and see our beautiful work. 💕`,
            category: 'Contact',
        },
        {
            question: 'Where can I find you on Instagram?',
            answer: `You can find us on Instagram at:\n\n @fiestahousematernity\nhttps://www.instagram.com/fiestahousematernity\n\nFollow us to see our latest maternity shoots, behind-the-scenes moments, and stunning photo gallery! 💕`,
            category: 'Contact',
        },
        {
            question: 'Where can I find you on Facebook?',
            answer: `You can find us on Facebook at:\n\n Fiesta House Attire\nhttps://www.facebook.com/fiestahouseattire/\n\nLike and follow our page to stay updated with our latest work, promotions, and announcements! 💕`,
            category: 'Contact',
        },
        {
            question: 'Do you have Instagram?',
            answer: `Yes! Follow us on Instagram for daily inspiration and stunning maternity photos:\n\n📸 @fiestahousematernity\nhttps://www.instagram.com/fiestahousematernity\n\nWe post regularly and would love to connect with you! 💕`,
            category: 'Contact',
        },
        {
            question: 'Do you have a Facebook page?',
            answer: `Yes! Like our Facebook page to stay connected:\n\n Fiesta House Attire\nhttps://www.facebook.com/fiestahouseattire/\n\nWe share updates, promotions, and our latest beautiful maternity sessions there! 💕`,
            category: 'Contact',
        },
    ];
    faqs.push(...newFaqs);
    for (const faq of faqs) {
        await prisma.knowledgeBase.upsert({
            where: { question: faq.question },
            update: {
                answer: faq.answer,
                category: faq.category,
            },
            create: {
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                embedding: [],
            },
        });
        console.log(`Upserted FAQ: ${faq.question}`);
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