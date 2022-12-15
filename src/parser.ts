import fs from "fs";
import { parseHTML } from "linkedom";

interface Play {
  name: string;
  // act numbers are determined by index in array plus one
  acts: Act[];
}

interface Act {
  // scene numbers are determined by index in array plus one
  // first line in array is original text, second line is modern
  scenes: [Line, Line][];
}

// line is html that will be combined into an entire page
interface Line {
  speaker?: string;
  text: string;
  // true if line is stage directions (a messenger enters)
  directions: boolean;
  tooltips?: Tooltip[];
}

interface Tooltip {
  // tooltip header not sure if header can be different than target word(s)
  heading: string;
  // tooltip text
  definition: string;
  // regexp of the word(s) that the tooltip is on
  words: RegExp;
}

const parse = async (
  scene: NodeListOf<HTMLTableRowElement>[],
  name: string
) => {
  const play: Play = { name, acts: [] };

  for (const rows of scene) {
    rows.forEach((r) => {
      const originalText = r.querySelector(
        ".noFear__cell noFear__cell--original"
      )?.textContent;
      if (!originalText) throw new Error("Failed to parse table");
      // play.acts.push([])
    });
  }
};

export default parse;

export const parseTest = () => {
  const { document } = parseHTML(fs.readFileSync("./scene.html").toString());

  let textRows = document
    .querySelector<HTMLTableElement>(`table[class*="noFear"]`)
    ?.querySelectorAll("tr");

  if (!textRows) throw new Error("Failed to find table.");
  const lines = [];

  // TODO create separate function to go through rows so I don't have to repeat for original and modern column
  for (const r of textRows) {
    // check if current row is the title row
    if (r.querySelector(".noFear__title")) {
      console.log("Title row found, skipping...");
      continue;
    }

    // first in node list is the original and second is modern translation
    const cells = r.querySelectorAll<HTMLTableCellElement>("td");

    const row: [Line, Line] = [];
    cells.forEach((c) => {
      const line: Line = {
        speaker:
          c.querySelector<HTMLTextAreaElement>(".noFear__speaker")?.innerText,
        text: c.innerText,
        directions: !!c.querySelector(".noFear__stage"),
        tooltips: [],
      };

      const tooltip = c.querySelector(".noFear__tooltip");
      if (tooltip) {
        console.log("Tooltip found.");

        line.tooltips?.push({
          heading: tooltip.querySelector(".noFear__tooltip__popup__heading")
            ?.textContent!,
          definition: tooltip.querySelector(".noFear__tooltip__popup__copy")
            ?.textContent!,
          words: new RegExp(
            tooltip.querySelector(".noFear__tooltip__trigger")?.textContent!
          ),
        });
      }

      row.push(line);
    });

    if (row.length !== 2) throw new Error("Invalid row count.");
    lines.push(row);
  }

  console.log(lines);
};
