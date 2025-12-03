import { config } from 'dotenv';
import axios from 'axios';
import * as path from 'path';

// Load .env from project root
config({ path: path.resolve(__dirname, '../.env') });

async function debugInstagram() {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const currentBusinessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    console.log('🔍 Debugging Instagram Configuration...');
    console.log('----------------------------------------');
    console.log(`Current Configured ID: ${currentBusinessId}`);

    if (!accessToken) {
        console.error('❌ Missing INSTAGRAM_ACCESS_TOKEN in .env');
        return;
    }

    try {
        // 1. Try treating token as User Token (get Pages)
        console.log('\n1️⃣  Checking if token is a User Token (fetching Pages)...');
        const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`;

        try {
            const pagesRes = await axios.get(pagesUrl);

            if (pagesRes.data.data.length === 0) {
                console.log('⚠️  No Facebook Pages found for this user.');
                return;
            }

            for (const page of pagesRes.data.data) {
                console.log(`\n📄 Page: ${page.name} (ID: ${page.id})`);
                await checkPageForInstagram(page.id, accessToken, currentBusinessId);
            }
        } catch (userError) {
            // If that fails, try treating it as a Page Token
            console.log('⚠️  Not a User Token or error fetching pages:', userError.response?.data?.error?.message || userError.message);
            console.log('\n2️⃣  Checking if token is a Page Token...');

            const meUrl = `https://graph.facebook.com/v21.0/me?fields=id,name,instagram_business_account&access_token=${accessToken}`;
            try {
                const meRes = await axios.get(meUrl);
                console.log(`\n📄 Page: ${meRes.data.name} (ID: ${meRes.data.id})`);

                if (meRes.data.instagram_business_account) {
                    const igAccount = meRes.data.instagram_business_account;
                    console.log(`   ✅ FOUND Instagram Business Account!`);
                    console.log(`   👉 ID: ${igAccount.id}`);

                    if (igAccount.id === currentBusinessId) {
                        console.log('   MATCHES current configuration! ✅');
                    } else {
                        console.log('   ❌ DOES NOT MATCH current configuration.');
                        console.log(`   💡 ACTION: Update INSTAGRAM_BUSINESS_ACCOUNT_IDin .env to ${igAccount.id}`);
                    }
                } else {
                    console.log('   ⚠️  No Instagram Business Account connected to this page.');
                }

            } catch (pageError) {
                console.error('\n❌ Failed to query Graph API as User or Page:', pageError.response?.data?.error?.message || pageError.message);
            }
        }

    } catch (error) {
        console.error('\n❌ Unexpected Error:', error.message);
    }
}

async function checkPageForInstagram(pageId: string, accessToken: string, currentBusinessId: string) {
    // 2. Get Connected Instagram Account for this Page
    console.log('   Checking for connected Instagram account...');
    const igUrl = `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`;

    try {
        const igRes = await axios.get(igUrl);
        const igAccount = igRes.data.instagram_business_account;

        if (igAccount) {
            console.log(`   ✅ FOUND Instagram Business Account!`);
            console.log(`   👉 ID: ${igAccount.id}`);

            if (igAccount.id === currentBusinessId) {
                console.log('   MATCHES current configuration! ✅');
            } else {
                console.log('   ❌ DOES NOT MATCH current configuration.');
                console.log(`   💡 ACTION: Update INSTAGRAM_BUSINESS_ACCOUNT_IDin .env to ${igAccount.id}`);
            }
        } else {
            console.log('   ⚠️  No Instagram Business Account connected to this page.');
        }
    } catch (err) {
        console.error(`   ❌ Error checking page ${pageId}:`, err.response?.data?.error?.message || err.message);
    }
}

debugInstagram();
