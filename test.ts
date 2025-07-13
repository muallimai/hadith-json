import { scrapeData } from "./src/helpers/scrapeData";

async function testScrapeData() {
  console.log("🚀 Starting scrapeData test...\n");

  // Test with a simple route - using Bukhari chapter 1
  const testRoute = "bukhari/1";
  const testBookId = 1;

  console.log(`📖 Testing route: ${testRoute}`);
  console.log(`📚 Book ID: ${testBookId}\n`);

  try {
    const result = await scrapeData(testRoute, testBookId);

    if (!result) {
      console.log("❌ No data returned from scrapeData");
      return;
    }

    console.log("✅ Successfully scraped data!\n");

    // Display summary
    console.log("📊 SUMMARY:");
    console.log(`   Hadiths found: ${result.hadiths.length}`);
    console.log(`   Chapter ID: ${result.chapter?.id}`);
    console.log(`   Chapter Arabic: ${result.chapter?.arabic}`);
    console.log(`   Chapter English: ${result.chapter?.english}`);
    console.log(`   Introduction Arabic: ${result.introduction?.arabic}`);
    console.log(`   Introduction English: ${result.introduction?.english}\n`);

    // Display first hadith as example
    if (result.hadiths.length > 0) {
      console.log("📜 FIRST HADITH EXAMPLE:");
      const firstHadith = result.hadiths[0];
      console.log(`   ID: ${firstHadith.id}`);
      console.log(`   ID in Book: ${firstHadith.idInBook}`);
      console.log(`   Chapter ID: ${firstHadith.chapterId}`);
      console.log(`   Book ID: ${firstHadith.bookId}`);
      console.log(`   Arabic: ${firstHadith.arabic.substring(0, 100)}...`);
      console.log(`   English Narrator: ${firstHadith.english.narrator}`);
      console.log(
        `   English Text: ${firstHadith.english.text.substring(0, 100)}...`
      );
      console.log(`   Reference: ${firstHadith.reference.text}`);
      console.log(`   Reference Link: ${firstHadith.reference.href}\n`);
      console.log(`   Grade: ${firstHadith.grade || "N/A"}`);
    }

    // Display all hadiths count by ID
    console.log("📝 ALL HADITHS IDS:");
    result.hadiths.forEach((hadith, index) => {
      console.log(
        `   ${index + 1}. ID: ${hadith.id}, Book ID: ${hadith.idInBook}`
      );
    });

    console.log("\n🎉 Test completed successfully!");
  } catch (error) {
    console.error("❌ Error during scraping:", error);
  }
}

// Run the test
testScrapeData().catch(console.error);
