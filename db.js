import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "data.json");

const defaultData = {
  profile: {
    name: "",
    grade: "",
    region: "",
    goal: "Победа в олимпиаде",
    university: "",
    direction: "",
    subjects: [],
  },
  tasks: [],
  reminders: [],
  achievements: [],
  universities: [],
  favorites: [],
};

function read() {
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    return { ...defaultData, ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultData);
  }
}

function write(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export const db = {
  get: () => read(),
  set: (data) => write(data),
  update: (mutator) => {
    const data = read();
    mutator(data);
    write(data);
    return data;
  },
};