"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageInquiryStrategy = void 0;
class PackageInquiryStrategy {
    canHandle(intent, context) {
        const { message, hasDraft } = context;
        const isBackdropImageRequest = /(backdrop|background|studio set|flower wall|portfolio|show.*(image|photo|picture|portfolio)|see.*(image|photo|picture|example))/i.test(message);
        const isPackageQuery = !isBackdropImageRequest && /(package|price|pricing|cost|how much|offer|photoshoot|shoot|what do you have|what are|show me|tell me about)/i.test(message);
        return !hasDraft && isPackageQuery;
    }
    async generateResponse(message, context) {
        const { aiService, logger, history, historyLimit, customerId, prisma } = context;
        logger.log(`[STRATEGY] Executing PackageInquiryStrategy for: "${message}"`);
        try {
            const allPackages = await aiService.getCachedPackages();
            logger.log(`[PACKAGE QUERY] Found ${allPackages?.length || 0} packages in DB`);
            const lowerMsg = message.toLowerCase();
            const matchedPackage = allPackages.find((p) => lowerMsg.includes(p.name.toLowerCase()));
            if (matchedPackage) {
                let draft = await prisma.bookingDraft.findUnique({ where: { customerId } });
                if (!draft) {
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
                    packages = allPackages.filter((p) => p.type?.toLowerCase() === 'outdoor');
                    packageType = 'outdoor ';
                }
                else if (/(studio)/i.test(message)) {
                    packages = allPackages.filter((p) => p.type?.toLowerCase() === 'studio');
                    packageType = 'studio ';
                }
                if (packages.length > 0) {
                    const specificPackage = packages.find((p) => lowerMsg.includes(p.name.toLowerCase()) &&
                        /(tell me about|what is|what's|details|include|come with|feature)/i.test(message));
                    if (specificPackage) {
                        const detailedInfo = aiService.formatPackageDetails(specificPackage, true);
                        const response = `${detailedInfo}\n\nThis package is perfect for capturing beautiful moments! Would you like to book this package? 💖`;
                        return { response, draft: null, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
                    }
                    const packagesList = packages.map((p) => aiService.formatPackageDetails(p, false)).join('\n\n');
                    const response = `Oh, my dear, I'm so delighted to share our ${packageType}packages with you! Each one is thoughtfully crafted to beautifully capture this precious time in your life. Here they are:\n\n${packagesList}\n\nIf you'd like to know more about any specific package, just ask! 💖`;
                    return { response, draft: null, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
                }
            }
            return null;
        }
        catch (err) {
            logger.error('Error in PackageInquiryStrategy', err);
            throw err;
        }
    }
}
exports.PackageInquiryStrategy = PackageInquiryStrategy;
//# sourceMappingURL=package-inquiry.strategy.js.map