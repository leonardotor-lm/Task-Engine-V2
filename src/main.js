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

const app = new App();
const attachmentController =
    new AttachmentController(app);
const waitingController =
    new WaitingController(app);

attachmentController.start();
bindAttachmentSearchReference(app);
waitingController.start();
app.start();
