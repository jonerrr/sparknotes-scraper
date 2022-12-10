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
  speaker: string;
  text: string;
  // true if line is stage directions (a messenger enters)
  directions: boolean;
  tooltips?: Tooltip[];
}

interface Tooltip {
  // tooltip text
  text: string;
  // regexp of the word(s) that the tooltip is on
  words: RegExp;
}

const parse = async (rows: NodeListOf<HTMLTableRowElement>) => {
  for (const row of rows) {
  }
};

export default parse;
