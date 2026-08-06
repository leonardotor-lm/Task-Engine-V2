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
    CompactTaskToolbarController
} from "./ui/CompactTaskToolbarController.js";
import {
    SidebarLayoutController
} from "./ui/SidebarLayoutController.js";
import {
    TaskFiltersDialogController
} from "./ui/TaskFiltersDialogController.js";

const app = new App();
const attachmentController =
    new AttachmentController(app);
const waitingController =
    new WaitingController(app);
const taskToolbarController =
    new CompactTaskToolbarController(app);
const sidebarLayoutController =
    new SidebarLayoutController(app);
const taskFiltersDialogController =
    new TaskFiltersDialogController(app);

attachmentController.start();
bindAttachmentSearchReference(app);
waitingController.start();
taskToolbarController.start();
sidebarLayoutController.start();
taskFiltersDialogController.start();
app.start();
