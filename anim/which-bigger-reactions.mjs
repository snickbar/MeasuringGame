const poses = {
  pick: { elephant: ["breath", "proud", "focused"], mouse: ["waiting", "breath", "focused"] },
  danger: { elephant: ["nervous", "breath", "focused"], mouse: ["nervous", "waiting", "focused"] },
  idle: { elephant: ["waiting", "relaxed", "proud"], mouse: ["waiting", "relaxed", "focused"] },
  tight: { elephant: ["focused", "waiting", "breath"], mouse: ["focused", "nervous", "waiting"] },
  streak: { elephant: ["proud", "relaxed", "focused"], mouse: ["proud", "relaxed", "waiting"] },
  easy: { elephant: ["relaxed", "", "waiting"], mouse: ["relaxed", "", "proud"] },
  neutral: { elephant: ["", "relaxed", "focused"], mouse: ["", "relaxed", "waiting"] },
};

export const wbPoseArt = [...new Set(Object.values(poses).flatMap(pair => Object.values(pair).flat()))];

export function createWbReactionPicker(random = Math.random) {
  const last = new Map();
  return (key, choices) => {
    const options = choices.filter(choice => choice !== last.get(key));
    const pool = options.length ? options : choices;
    const choice = pool[Math.floor(random() * pool.length)];
    last.set(key, choice);
    return choice;
  };
}

export function wbReactionPose(pick, animal, state) {
  return pick(animal, poses[state][animal]);
}

export function wbInBetween(animal, from, to) {
  return (animal === "elephant" ? ["focused", "waiting", "relaxed"] : ["waiting", "focused", "relaxed"])
    .find(pose => pose !== from && pose !== to);
}
