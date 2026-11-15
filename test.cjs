const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const mock = {
  document: {
    addEventListener() {},
    getElementById() { return { value: "down,right,up,left" }; }
  },
  console
};
vm.createContext(mock);
vm.runInContext(fs.readFileSync("app.js", "utf8") +
  "\nglobalThis.labTest = {state, PRESETS, parseMap, createTrace, shortestPath, countComponents};", mock);
const { state, PRESETS, parseMap, createTrace, countComponents } = mock.labTest;

function runMap(name) {
  state.grid = parseMap(PRESETS[name]);
  state.rows = state.grid.length;
  state.cols = state.grid[0].length;
  state.start = {r: 0, c: 0};
  state.goal = {r: state.rows - 1, c: state.cols - 1};
  state.grid[0][0] = ".";
  state.grid[state.goal.r][state.goal.c] = ".";
  const result = createTrace();
  assert.equal(result.steps[0].type, "ready");
  for (let i = 1; i < result.steps.length; i++) {
    assert.ok(result.steps[i].counter >= result.steps[i - 1].counter);
  }
  if (result.found) {
    assert.equal(result.route[0], 0);
    assert.equal(result.route[result.route.length - 1], state.rows * state.cols - 1);
    assert.equal(result.steps.at(-1).type, "found");
    assert.ok(result.route.length >= result.shortest.length);
    for (let i = 1; i < result.route.length; i++) {
      const a = result.route[i - 1], b = result.route[i];
      const dr = Math.abs(Math.floor(a / state.cols) - Math.floor(b / state.cols));
      const dc = Math.abs(a % state.cols - b % state.cols);
      assert.equal(dr + dc, 1, "Steps in route must be neighbors");
    }
  } else {
    assert.equal(result.steps.at(-1).type, "failed");
    assert.equal(result.shortest.length, 0);
  }
  return result;
}

const classic = runMap("classic");
assert.equal(classic.found, true);
const maze = runMap("maze");
assert.equal(maze.found, true);
const islands = runMap("islands");
assert.equal(islands.found, false);
const componentCount = countComponents();
assert.ok(componentCount.count > 1);
const blank = runMap("blank");
assert.equal(blank.found, true);
state.grid = [["."]];
state.rows = 1;
state.cols = 1;
state.start = {r:0,c:0};
state.goal = {r:0,c:0};
const same = createTrace();
assert.equal(same.found,true);
assert.equal(same.route.length,1);
console.log("PASS: 5 logic cases; classic", classic.steps.length, "frames; maze", maze.steps.length,
  "frames; disconnected islands", componentCount.count, "components.");