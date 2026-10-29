const S = (await import("./scenes.mjs")).default;
const ids = ["tyd","bogulma","kalpkrizi","inme","nobet","anafilaksi","kanama","yanik","zehirlenme","hipoglisemi","sicak","kirik","kafa","burun","yilan","bocek","isirik","kene"];
let js = "  const AID_ILL = {\n";
for (const k of ids) js += `    ${k}: ${JSON.stringify(S[k].replace(/\s+xmlns="[^"]+"/, ""))},\n`;
process.stdout.write(js + "  };\n");
