import { App } from "./core/App.js";
import {
    AttachmentController
} from "./ui/AttachmentController.js";
import {
    bindAttachmentSearchReference
} from "./ui/AttachmentSearchReference.js";

const app = new App();
const attachmentController =
    new AttachmentController(app);

attachmentController.start();
bindAttachmentSearchReference(app);
app.start();
