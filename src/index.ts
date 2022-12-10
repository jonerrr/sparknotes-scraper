import "dotenv/config";
import { default as axios } from "axios";
import qs from "qs";
import { JSDOM } from "jsdom";

import parse from "./parser";

const client = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:107.0) Gecko/20100101 Firefox/107.0",
    Host: "www.sparknotes.com",
    "X-Requested-With": "XMLHttpRequest",
  },
});

(async () => {
  console.log("Logging into Sparknotes account.");

  // login to sparknotes account
  const auth = await client.post<{ success: boolean }>(
    "https://www.sparknotes.com/login/",
    qs.stringify({ email: process.env.EMAIL, password: process.env.PASSWORD })
  );

  // response should be a json object with a success boolean
  if (!auth.data.success) throw new Error("Login failed");

  console.log("Fetching No Fear Shakespeare translations.");

  // Get the HTML for the list of shakespeare no fear translations
  const shakespeare = await client.get<string>(
    "https://www.sparknotes.com/shakespeare/"
  );
  const urls: string[] = [];

  // convert the string to a DOM and find the anchor elements and add them to the array
  new JSDOM(shakespeare.data).window.document
    .querySelectorAll<HTMLAnchorElement>(".no-fear-thumbs__thumb__link")
    .forEach((el) => urls.push(el.href));

  console.log(`${urls.length} No Fear Shakespeare translations found.`);

  // iterate over the url array
  for (const url of urls) {
    console.log(`Fetching ${url}.`);
    // fetch the list of scenes
    const translations = await client.get<string>(
      `https://www.sparknotes.com${url}`
    );
    if (!translations.request)
      throw new Error(
        "Request data not found. Exiting because unable to determine correct path for future requests."
      );
    const scenes: string[] = [];

    // get the url path for the no fear translation texts and push to array
    new JSDOM(translations.data).window.document
      .querySelectorAll<HTMLAnchorElement>(
        ".texts-landing-page__toc__section__link"
      )
      .forEach((el) => scenes.push(el.href));

    console.log(`${scenes.length} scenes found.`);
    // iterate over scene urls
    for (const scene of scenes) {
      console.log(`Fetching ${scene}.`);
      // fetch scenes
      // must get the location of the url from the scene list because the original paths are forwarded (301) to the correct one (thanks sparknotes)
      const texts = await client.get<string>(
        `${translations.request.res.responseUrl}${scene}`
      );

      const { document } = new JSDOM(texts.data).window;

      // get the table rows for the no fear translations, original text in <td> and modern translation in second <td>
      let textRows = document
        .querySelector<HTMLTableElement>(".noFear--hasNumbers")
        ?.querySelectorAll("tr");

      if (!textRows) throw new Error("Failed to parse HTML of text.");
      parse(textRows);

      break;
    }

    break;
  }
})();
