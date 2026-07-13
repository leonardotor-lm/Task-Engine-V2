import { App } from "./core/App.js";
import { runTaskTests } from "./tests/TaskTest.js";

const app = new App();

app.start();

runTaskTests();
