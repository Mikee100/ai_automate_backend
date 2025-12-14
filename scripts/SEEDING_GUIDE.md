# Seeding Guide - Studio Packages Only

This guide explains what needs to be seeded and how to handle existing data when transitioning from outdoor + studio packages to studio-only packages.

## What Needs to be Seeded

### 1. **Packages** (Studio Only)
- **Service**: `SeedingService.seedPackages()`
- **Script**: `scripts/seed-studio-packages.ts`
- **What it does**: Creates/updates 7 studio packages in the database
- **Handles existing data**: ✅ Uses `upsert` - updates existing packages by name

**Packages:**
- Standard Package (KSH 10,000)
- Economy Package (KSH 15,000)
- Executive Package (KSH 20,000)
- Gold Package (KSH 30,000)
- Platinum Package (KSH 35,000)
- VIP Package (KSH 45,000)
- VVIP Package (KSH 50,000)

### 2. **Knowledge Base** (FAQ/Responses)
- **Service**: `SeedingService.seedKnowledgeBase()`
- **Script**: `scripts/seed-knowledge.ts`
- **What it does**: Adds Q&A pairs to the knowledge base for AI responses
- **Handles existing data**: ✅ Uses `upsert` - updates existing entries by question text
- **Important**: This will update old outdoor package knowledge with studio-only information

**Knowledge entries include:**
- Studio package details and descriptions
- "Tell me about the standard package" → Returns studio Standard Package info
- General package information (studio-only)
- Pricing information (studio-only)

### 3. **Domain Knowledge** (Optional)
- **Service**: `DomainExpertiseService.seedDomainKnowledge()`
- **What it does**: Seeds domain-specific knowledge entries
- **Note**: This is separate from the main knowledge base

## How to Handle Existing Data

Since you already have data in your database, here's the recommended approach:

### Option 1: Safe Update (Recommended) ✅
This approach updates existing data without deleting anything. Safe to run multiple times.

**From the `backend` directory, run:**

```bash
# All-in-one (easiest - recommended!)
npx ts-node -r tsconfig-paths/register scripts/seed-all.ts

# OR run individually:
# 1. Seed packages (updates existing, creates new studio packages)
npx ts-node -r tsconfig-paths/register scripts/seed-studio-packages.ts

# 2. Seed knowledge base (updates existing knowledge entries)
npx ts-node -r tsconfig-paths/register scripts/seed-knowledge.ts
```

**What happens:**
- Existing studio packages get updated with latest info
- Outdoor packages remain in DB but won't be shown (code filters them out)
- Knowledge base entries get updated/overwritten with new studio-only content
- Old outdoor package knowledge entries will be replaced by studio entries

### Option 2: Clean Slate (If you want to remove outdoor packages)
If you want to completely remove outdoor packages from the database:

```bash
# From backend directory:

# 1. Run cleanup script (removes outdoor packages)
npx ts-node -r tsconfig-paths/register scripts/cleanup-outdoor-packages.ts

# 2. Seed everything
npx ts-node -r tsconfig-paths/register scripts/seed-all.ts
```

## Important Notes

1. **Packages Table**: Uses `upsert` - safe to run multiple times. Updates existing packages by name.

2. **Knowledge Base**: Uses `findFirst` + `update` or `create` - safe to run multiple times. Updates entries that match the question text.

3. **Old Outdoor Package Entries**: 
   - Old outdoor package entries in knowledge base will be overwritten when you seed
   - Outdoor packages in packages table will remain but won't be shown (code filters them)
   - If you want them completely removed, use the cleanup script

4. **Pinecone Vector DB**: Knowledge seeding also updates Pinecone if configured. Old vectors may remain but new ones will take priority.

## Running the Seeding

### Option A: All-in-One Script (Easiest) ⭐ Recommended
```bash
# From backend directory
npx ts-node -r tsconfig-paths/register scripts/seed-all.ts
```

This script will:
- ✅ Seed all studio packages
- ✅ Seed knowledge base with studio-only information
- ✅ Handle existing data safely (uses upsert)

### Option B: Individual Scripts
```bash
# From backend directory

# 1. Seed packages only
npx ts-node -r tsconfig-paths/register scripts/seed-studio-packages.ts

# 2. Seed knowledge base only
npx ts-node -r tsconfig-paths/register scripts/seed-knowledge.ts
```

### Option C: Using npm scripts (Easy!) ⭐
```bash
# From backend directory:

# Seed everything (packages + knowledge base)
npm run seed:all

# Or individually:
npm run seed:packages    # Packages only
npm run seed:knowledge   # Knowledge base only
npm run seed:cleanup     # Remove outdoor packages first
```

### Option D: Clean First, Then Seed
If you want to remove outdoor packages first:
```bash
# 1. Clean outdoor packages
npx ts-node -r tsconfig-paths/register scripts/cleanup-outdoor-packages.ts

# 2. Seed everything
npx ts-node -r tsconfig-paths/register scripts/seed-all.ts
```

## Verification

After seeding, verify:
1. Check packages table - should have 7 studio packages only (if you cleaned outdoor)
2. Test: Ask "tell me about the standard package" - should return studio package info
3. Test: Ask "what packages do you offer" - should only show studio packages
4. Check knowledge base table - should have updated entries without outdoor references

## Troubleshooting

**Issue**: Still getting outdoor package responses
- **Solution**: Old knowledge base entries may be cached. Try re-seeding knowledge base or wait for cache to expire.

**Issue**: Outdoor packages still showing
- **Solution**: Make sure you've cleaned them from the database, or verify the code is filtering them correctly (it should be).

**Issue**: Seeding fails
- **Solution**: Check database connection and ensure all required tables exist. Check logs for specific errors.
