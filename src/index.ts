import "dotenv/config";
import yargs from "yargs/yargs";
import { default as axios } from "axios";
import qs from "qs";
import fs from "fs";
import { parseHTML } from "linkedom";

import parseRows, { Parsed } from "./parser";

const args = yargs(process.argv.slice(1))
  .scriptName("SparkNotes Scraper")
  .options({ audio: { type: "boolean", default: false } });

console.log(args);

(async () => {
  if (!process.env.EMAIL || !process.env.PASSWORD)
    throw new Error(
      "EMAIL or PASSWORD not found in environment. Did you rename the .env.example to .env and specify your email and password?"
    );

  console.log("Logging into SparkNotes account.");
  const auth = await axios.post<{ success: boolean }>(
    "https://www.sparknotes.com/login/",
    qs.stringify({ email: process.env.EMAIL, password: process.env.PASSWORD }),
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:107.0) Gecko/20100101 Firefox/107.0",
        Host: "www.sparknotes.com",
        "X-Requested-With": "XMLHttpRequest",
      },
    }
  );

  // response should be a json object with a success boolean
  if (!auth.data.success) throw new Error("Login failed");

  const client = axios.create({
    // withCredentials isn't working, probably some cors issue or whatever
    // withCredentials: true,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:107.0) Gecko/20100101 Firefox/107.0",
      Host: "www.sparknotes.com",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  console.log("Fetching No Fear translations.");
  // Get the HTML for the list of shakespeare no fear translations
  const dashboard = await client.get<string>(
    "https://www.sparknotes.com/plus/dashboard/no-fear/",
    { headers: { Cookie: auth.headers["set-cookie"]?.join("; ") } }
  );

  const urls: string[] = [];
  // convert the string to a DOM and find the anchor elements and add the urls to the array
  parseHTML(dashboard.data)
    .document.querySelectorAll<HTMLAnchorElement>(`a[href^="/nofear/"]`)
    .forEach((el) => urls.push(el.href));
  fs.writeFileSync("./dash.html", dashboard.data);
  // TODO create prompt for users to choose specific texts to scrape

  console.log(`${urls.length} No Fear translations found.`);

  // iterate over the url array
  for (const url of urls) {
    console.log(`Fetching ${url}.`);
    // fetch the list of scenes/chapters
    const translations = await client.get<string>(
      `https://www.sparknotes.com${url}`
    );
    if (!translations.request)
      throw new Error(
        "Request data not found. Exiting because unable to determine correct path for future requests."
      );
    const part: string[] = [];

    // get the url path for the no fear translation texts and push to array
    parseHTML(translations.data)
      .document.querySelectorAll<HTMLAnchorElement>(
        `a[class="texts-landing-page__toc__section__link"]`
      )
      .forEach((el) => part.push(el.href));

    console.log(`${part.length} scenes/chapters found.`);

    const parsed: Parsed = {
      name: document
        .querySelector(`h1[class^="TitleHeader_title"]`)
        ?.textContent!.replace(/^\s+|\s+$|\s+(?=\s)/g, "")!,
      author: document.querySelector<HTMLTextAreaElement>(
        ".TitleHeader_authorLink__header"
      )!.innerHTML,
      chapters: [],
    };

    // iterate over scene urls
    for (const p of part) {
      console.log(`Fetching ${p}.`);

      // combine cookies from dashboard request and auth request and remove duplicates
      const texts = await client.get<string>(
        `https://www.sparknotes.com/plus${url}/${p}`,
        {
          headers: {
            Cookie: [
              ...new Set([
                ...auth.headers["set-cookie"]!,
                ...dashboard.headers["set-cookie"]!,
              ]),
            ],
          },
        }
      );

      fs.writeFileSync("./scene.html", texts.data);

      const { document } = parseHTML(texts.data);

      // get the table rows for the no fear translations, original text in first <td> and modern translation in second <td>
      let textRows = document
        .querySelector<HTMLTableElement>(`table[class*="noFear"]`)
        ?.querySelectorAll("tr");

      if (!textRows) throw new Error("Failed to parse HTML of text.");
      parsed.chapters.push({
        name: document.querySelector<HTMLTextAreaElement>(
          ".interior-header__title__text__pagetitle"
        )?.innerText!,
        lines: parseRows(Array.from(textRows)),
      });
    }

    console.log(
      `Parsed ${parsed.name} ${parsed.chapters.length} scenes/chapters.`
    );

    fs.writeFileSync("./book.json", JSON.stringify(parsed));

    break;
  }
})();
