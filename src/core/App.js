import { Config } from "./Config.js";
import { MainView } from "../ui/MainView.js";

export class App {

    constructor() {
        this.mainView = new MainView();
    }

    start() {

        console.log(`${Config.APP_NAME} v${Config.VERSION}`);

        this.mainView.render();

    }

}
