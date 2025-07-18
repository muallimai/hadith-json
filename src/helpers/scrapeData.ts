import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeData(route: string, bookId: number) {
  //* Helper function to clean text from various whitespace characters
  const cleanText = (text: string): string => {
    return text
      .trim()
      .replace(/&nbsp;/g, "")  // HTML non-breaking space
      .replace(/\xa0/g, "")     // Unicode non-breaking space
      .replace(/\u00A0/g, "")   // Another Unicode non-breaking space
      .replace(/\s+/g, " ")     // Replace multiple whitespace with single space
      .trim();                  // Final trim
  };

  //* GET HTML content
  const data = await axios
    .get(`https://sunnah.com/${route}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      },
    })
    .then((res) => res.data);

  //* Load HTML content => $(selector) to select elements
  let $: cheerio.Root;
  try {
    $ = cheerio.load(data);
  } catch (err) {
    console.log("Error loading data", `${route}`);
    return;
  }

  //* Select all hadiths
  const allHadiths = $(".AllHadith").children(".actualHadithContainer");

  //* All returned information
  const output: {
    hadiths: Hadith[];
    introduction?: Introduction;
    chapter?: Chapter;
  } = {
    hadiths: [],
  };

  //* Scrap chapter info
  const pageInfo = $(".book_info");
  const chapterInfo = {
    id: pageInfo
      .find(".book_page_number")
      .text()
      .trim()
      .replace(/&nbsp;/g, ""),
    arabic: pageInfo.find(".book_page_arabic_name").text().trim(),
    english: pageInfo.find(".book_page_english_name").text().trim(),
  };

  //* Loop through all hadiths
  allHadiths.each((i, el) => {
    // Extract reference information
    const referenceTable = $(el).find(".hadith_reference");
    let referenceText: string | undefined = undefined;
    let referenceHref: string | undefined = undefined;

    // Helper function to extract reference from share link
    const extractShareLinkReference = () => {
      const shareLink = $(el).find(".sharelink");
      if (shareLink.length > 0) {
        const onclick = shareLink.attr("onclick");
        if (onclick) {
          const urlMatch = onclick.match(/share\(this,\s*'([^']+)'\)/);
          if (urlMatch && urlMatch[1]) {
            referenceHref = `https://sunnah.com${urlMatch[1]}`;
          }
        }
      }
    };

    if (referenceTable.length > 0) {
      // Find the row with "Reference" text
      const referenceRow = referenceTable
        .find("td")
        .filter(function (this: cheerio.Element) {
          return $(this).text().includes("Reference");
        });

      if (referenceRow.length > 0) {
        // Get the next td which should contain the reference
        const nextTd = referenceRow.next("td");

        if (nextTd.length > 0) {
          // First check if there's an anchor tag
          const anchor = nextTd.find("a");

          if (anchor.length > 0) {
            // If anchor exists, use it
            referenceText = anchor.text().trim();
            const href = anchor.attr("href") || "";
            referenceHref = `https://sunnah.com${href}`;
          } else {
            // If no anchor, check if we can find the URL in the share link
            extractShareLinkReference();

            referenceText = nextTd.text().trim();
            if (
              referenceText.startsWith(": ") ||
              referenceText.startsWith(":\u00A0")
            ) {
              referenceText = referenceText.substring(2);
            }
          }
        }
      } else {
        // No reference row found, try to get reference from share link
        extractShareLinkReference();
      }
    }

    // Extract grade information
    const gradeTable = $(el).find(".gradetable");
    let gradeText: string | null = null;

    if (gradeTable.length > 0) {
      // First try to get the second english_grade td
      const englishGradeTds = gradeTable.find("td.english_grade");
      if (englishGradeTds.length >= 2) {
        const secondEnglishGrade = cleanText(englishGradeTds.eq(1).text());
        if (secondEnglishGrade) {
          gradeText = secondEnglishGrade;
        }
      }

      // If no value in second english_grade, try first arabic_grade
      if (!gradeText) {
        const arabicGradeTds = gradeTable.find("td.arabic_grade");
        if (arabicGradeTds.length > 0) {
          const firstArabicGrade = cleanText(arabicGradeTds.eq(0).text());
          if (firstArabicGrade) {
            gradeText = firstArabicGrade;
          }
        }
      }
    }

    const text = {
      id: i + 1,
      chapterId: +chapterInfo.id,
      bookId,
      arabic: $(el)
        .find(".arabic_hadith_full")
        .text()
        .trim()
        .replace(/\[.*\]/g, ""),
      english: {
        narrator: $(el)
          .find(".englishcontainer .hadith_narrated")
          .text()
          .trim()
          .replace(/\[.*\]/g, ""),
        text: $(el)
          .find(".englishcontainer .text_details")
          .text()
          .trim()
          .replace(/\[.*\]/g, ""),
      },
      reference: {
        text: referenceText,
        url: referenceHref,
      },
      grade: gradeText,
    };

    output.hadiths.push(text);
  });

  //* Scrap Page title
  const introduction = $(".book_info");
  const englishTitle = introduction
    .find(".book_page_english_name")
    .text()
    .trim();
  output.introduction = {
    arabic: introduction
      .find(".book_page_arabic_name.arabic")
      .text()
      .trim()
      .replace(/\[.*\]/g, ""),
    english: englishTitle.replace(/\[.*\]/g, ""),
  };

  output.chapter = {
    id: +chapterInfo.id,
    bookId,
    arabic: chapterInfo.arabic,
    english: chapterInfo.english,
  };

  return output;
}
