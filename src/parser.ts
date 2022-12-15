interface Tooltip {
  // tooltip header not sure if header can be different than target word(s)
  heading: string;
  // tooltip text
  definition: string;
  // regexp of the word(s) that the tooltip is on
  words: RegExp;
}

// line is html that will be combined into an entire page
interface Line {
  speaker?: string;
  text: string;
  // true if line is stage directions (e.g. a messenger enters)
  directions: boolean;
  tooltips?: Tooltip[];
}

interface Parsed {
  name: string;
  author: string;
}

export interface Book extends Parsed {
  chapters: [Line, Line][];
  acts: never;
}

export interface Play extends Parsed {
  // act numbers are determined by index in array plus one
  acts: Act[];
  chapters: never;
}

interface Act {
  // scene numbers are determined by index in array plus one
  // first line in array is original text, second line is modern
  scenes: [Line, Line][];
}

type Media = Book | Play;

function parseRows(table: HTMLTableRowElement[]): [Line, Line][] {
  const lines = [];

  for (const rows of table) {
    // check if current row is the title row
    if (rows.querySelector(".noFear__title")) {
      console.log("Title row found, skipping...");
      continue;
    }

    //@ts-ignore data will be added later
    const row: [Line, Line] = [];

    rows.querySelectorAll<HTMLTableCellElement>("td").forEach((c) => {
      const line: Line = {
        // must make sure that speaker is <p> element because there can be speaker in <span> element in stage directions
        speaker: c.querySelector<HTMLTextAreaElement>(
          `p[class="noFear__speaker"]`
        )?.innerText,
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

  return lines;
}

export default parseRows;

// export const parseTable = () => {
//   const { document } = parseHTML(fs.readFileSync("./scene.html").toString());

//   let textRows = document
//     .querySelector<HTMLTableElement>(`table[class*="noFear"]`)
//     ?.querySelectorAll("tr");

//   if (!textRows) throw new Error("Failed to find table.");
//   const lines = [];

//   for (const r of textRows) {
//     // check if current row is the title row
//     if (r.querySelector(".noFear__title")) {
//       console.log("Title row found, skipping...");
//       continue;
//     }

//     // first in node list is the original and second is modern translation
//     const cells = r.querySelectorAll<HTMLTableCellElement>("td");

//     const row: [Line, Line] = [];
//     cells.forEach((c) => {
//       const line: Line = {
//         // must make sure that speaker is <p> element because there can be speaker in <span> element in stage directions
//         speaker: c.querySelector<HTMLTextAreaElement>(
//           `p[class="noFear__speaker"]`
//         )?.innerText,
//         text: c.innerText,
//         directions: !!c.querySelector(".noFear__stage"),
//         tooltips: [],
//       };

//       const tooltip = c.querySelector(".noFear__tooltip");
//       if (tooltip) {
//         console.log("Tooltip found.");

//         line.tooltips?.push({
//           heading: tooltip.querySelector(".noFear__tooltip__popup__heading")
//             ?.textContent!,
//           definition: tooltip.querySelector(".noFear__tooltip__popup__copy")
//             ?.textContent!,
//           words: new RegExp(
//             tooltip.querySelector(".noFear__tooltip__trigger")?.textContent!
//           ),
//         });
//       }

//       row.push(line);
//     });

//     if (row.length !== 2) throw new Error("Invalid row count.");
//     lines.push(row);
//   }

//   console.log(lines);
// };
