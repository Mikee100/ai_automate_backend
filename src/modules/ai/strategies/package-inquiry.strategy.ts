import { ResponseStrategy } from './response-strategy.interface';

export class PackageInquiryStrategy implements ResponseStrategy {
    canHandle(intent: string, context: any): boolean {
        const { message, hasDraft } = context;
        // Exclude backdrop/image requests which should go to FAQ flow
        const isBackdropImageRequest = /(backdrop|background|studio set|flower wall|portfolio|show.*(image|photo|picture|portfolio)|see.*(image|photo|picture|example))/i.test(message);
        const isPackageQuery = !isBackdropImageRequest && /(package|price|pricing|cost|how much|offer|photoshoot|shoot|what do you have|what are|show me|tell me about)/i.test(message);

        return !hasDraft && isPackageQuery;
    }

    async generateResponse(message: string, context: any): Promise<any> {
        const { aiService, logger, history, historyLimit, customerId, prisma } = context;

        logger.log(`[STRATEGY] Executing PackageInquiryStrategy for: "${message}"`);

        try {
            // Use public method from AiService (need to ensure it's public)
            const allPackages = await aiService.getCachedPackages();
            logger.log(`[PACKAGE QUERY] Found ${allPackages?.length || 0} packages in DB`);

            // Helper function to match package names with variations
            const matchPackage = (msg: string, packageName: string): boolean => {
                const lowerMsg = msg.toLowerCase();
                const lowerPkg = packageName.toLowerCase();

                // Exact match or contains
                if (lowerMsg.includes(lowerPkg)) return true;

                // Handle common variations
                const variations: { [key: string]: string[] } = {
                    'standard package': ['standard one', 'standard', 'basic package', 'basic one'],
                    'executive package': ['executive one', 'executive'],
                    'gold package': ['gold one', 'gold'],
                    'platinum package': ['platinum one', 'platinum'],
                    'vip package': ['vip one', 'vip'],
                    'vvip package': ['vvip one', 'vvip', 'v vip', 'v-vip'],
                };

                // Check if any variation matches
                for (const [canonical, vars] of Object.entries(variations)) {
                    if (lowerPkg === canonical) {
                        if (vars.some(v => lowerMsg.includes(v))) return true;
                    }
                }

                // Check reverse: if message contains a variation, match to canonical
                for (const [canonical, vars] of Object.entries(variations)) {
                    if (vars.some(v => lowerMsg.includes(v))) {
                        if (lowerPkg === canonical) return true;
                    }
                }

                return false;
            };

            // Try to match a package selection in the message
            const matchedPackage = allPackages.find((p: any) => matchPackage(message, p.name));

            if (matchedPackage) {
                // Set the selected package in the booking draft and move to next step
                // We need to create a draft. Using aiService helper if available or prisma directly
                let draft = await prisma.bookingDraft.findUnique({ where: { customerId } });
                if (!draft) {
                    // Create draft logic (duplicated or exposed helper)
                    // Assuming aiService.getOrCreateDraft is public
                    draft = await aiService.getOrCreateDraft(customerId);
                }

                draft = await prisma.bookingDraft.update({
                    where: { customerId },
                    data: { service: matchedPackage.name },
                });

                const detailedInfo = aiService.formatPackageDetails(matchedPackage, true);
                const response = `${detailedInfo}\n\nI've noted you're interested in the ${matchedPackage.name}. When would you like to come in for the shoot? (e.g., "next Tuesday at 10am") 🗓️`;

                return {
                    response,
                    draft,
                    updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }]
                };
            }

            if (allPackages && allPackages.length > 0) {
                let packages = allPackages;
                let packageType = '';
                if (/(outdoor)/i.test(message)) {
                    packages = allPackages.filter((p: any) => p.type?.toLowerCase() === 'outdoor');
                    packageType = 'outdoor ';
                } else if (/(studio)/i.test(message)) {
                    packages = allPackages.filter((p: any) => p.type?.toLowerCase() === 'studio');
                    packageType = 'studio ';
                }

                if (packages.length > 0) {
                    // Check if asking about a specific package (detailed)
                    const specificPackage = packages.find((p: any) =>
                        matchPackage(message, p.name) &&
                        /(tell me about|what is|what's|details|include|come with|feature)/i.test(message)
                    );

                    if (specificPackage) {
                        const detailedInfo = aiService.formatPackageDetails(specificPackage, true);
                        const response = `${detailedInfo}\n\nThis package is perfect for capturing beautiful moments! Would you like to book this package? 💖`;
                        return { response, draft: null, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
                    }

                    // List all packages
                    const packagesList = packages.map((p: any) => aiService.formatPackageDetails(p, false)).join('\n\n');
                    const response = `Oh, my dear, I'm so delighted to share our ${packageType}packages with you! Each one is thoughtfully crafted to beautifully capture this precious time in your life. Here they are:\n\n${packagesList}\n\nIf you'd like to know more about any specific package, just ask! 💖`;

                    return { response, draft: null, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
                }
            }

            return null; // Should not happen if packages exist, but fallback to FAQ if null
        } catch (err) {
            logger.error('Error in PackageInquiryStrategy', err);
            throw err;
        }
    }
}
