import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const outfits = [
    {
        url: 'https://fiestahouseattire.com/new/wp-content/uploads/2026/02/IMGL4367-scaled.jpg',
        title: 'Maternity Gown 1',
        description: 'Elegant maternity gown for photoshoots',
        category: 'outfit',
        subcategory: 'maternity',
    },
    {
        url: 'https://fiestahouseattire.com/new/wp-content/uploads/2026/02/IMGL6281-scaled.jpg',
        title: 'Maternity Gown 2',
        description: 'Beautiful flowing maternity dress',
        category: 'outfit',
        subcategory: 'maternity',
    },
    {
        url: 'https://fiestahouseattire.com/new/wp-content/uploads/2026/02/IMGL3602-scaled.jpg',
        title: 'Maternity Gown 3',
        description: 'Stunning studio maternity attire',
        category: 'outfit',
        subcategory: 'maternity',
    },
    {
        url: 'https://fiestahouseattire.com/new/wp-content/uploads/2026/02/HI7A5986-scaled.jpg',
        title: 'Maternity Gown 4',
        description: 'Designer maternity gown for professional photography',
        category: 'outfit',
        subcategory: 'maternity',
    },
    {
        url: 'https://fiestahouseattire.com/new/wp-content/uploads/2026/02/IMGL4348-scaled.jpg',
        title: 'Maternity Gown 5',
        description: 'Premium maternity outfit for Fiesta House sessions',
        category: 'outfit',
        subcategory: 'maternity',
    },
];

async function main() {
    console.log('🌱 Seeding outfit images...');

    for (const outfit of outfits) {
        await prisma.mediaAsset.upsert({
            where: { id: `outfit-${outfit.url.split('/').pop()}` },
            update: outfit,
            create: {
                id: `outfit-${outfit.url.split('/').pop()}`,
                ...outfit,
                source: 'manual',
            },
        });
    }

    console.log('✅ Successfully seeded outfits!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
