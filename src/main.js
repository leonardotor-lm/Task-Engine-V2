import { App } from "./core/App.js";
import {
    AttachmentController
} from "./ui/AttachmentController.js";

const app = new App();
const attachmentController =
    new AttachmentController(app);

attachmentController.start();
app.start();
