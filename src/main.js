import { App } from "./core/App.js";
import {
    AttachmentController
} from "./ui/AttachmentController.js";
import {
    bindAttachmentSearchReference
} from "./ui/AttachmentSearchReference.js";
import {
    WaitingController
} from "./ui/WaitingController.js";
import {
    TaskToolbarController
} from "./ui/TaskToolbarController.js";

const app = new App();
const attachmentController =
    new AttachmentController(app);
const waitingController =
    new WaitingController(app);
const taskToolbarController =
    new TaskToolbarController(app);

attachmentController.start();
bindAttachmentSearchReference(app);
waitingController.start();
taskToolbarController.start();
app.start();
