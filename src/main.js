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
import {
    MobileMainLayoutController
} from "./ui/MobileMainLayoutController.js";
import {
    DirectTaskCreationController
} from "./ui/DirectTaskCreationController.js";
import {
    TaskSortPreferencesController
} from "./ui/TaskSortPreferencesController.js";
import {
    TaskFilterPreferencesController
} from "./ui/TaskFilterPreferencesController.js";
import {
    DesktopTaskEditorLayoutController
} from "./ui/DesktopTaskEditorLayoutController.js";
import {
    MobileTaskEditorLayoutController
} from "./ui/MobileTaskEditorLayoutController.js";
import {
    SyncOptionalDataBridge
} from "./core/SyncOptionalDataBridge.js";
import {
    TaskFilterSyncBridge
} from "./core/TaskFilterSyncBridge.js";
import {
    SyncNavigationPreservationController
} from "./ui/SyncNavigationPreservationController.js";
import {
    SmartSyncReconnectionController
} from "./ui/SmartSyncReconnectionController.js";
import {
    OngoingSyncReconciliationController
} from "./ui/OngoingSyncReconciliationController.js";

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
const mobileMainLayoutController =
    new MobileMainLayoutController(app);
const directTaskCreationController =
    new DirectTaskCreationController(app);
const taskSortPreferencesController =
    new TaskSortPreferencesController(app);
const taskFilterPreferencesController =
    new TaskFilterPreferencesController(app);
const desktopTaskEditorLayoutController =
    new DesktopTaskEditorLayoutController(app);
const mobileTaskEditorLayoutController =
    new MobileTaskEditorLayoutController(app);
const syncOptionalDataBridge =
    new SyncOptionalDataBridge(app);
const taskFilterSyncBridge =
    new TaskFilterSyncBridge(app);
const syncNavigationPreservationController =
    new SyncNavigationPreservationController(app);
const smartSyncReconnectionController =
    new SmartSyncReconnectionController(app);
const ongoingSyncReconciliationController =
    new OngoingSyncReconciliationController(app);

attachmentController.start();
bindAttachmentSearchReference(app);
waitingController.start();
taskToolbarController.start();
sidebarLayoutController.start();
taskFiltersDialogController.start();
mobileMainLayoutController.start();
directTaskCreationController.start();
taskSortPreferencesController.start();
taskFilterPreferencesController.start();
syncOptionalDataBridge.start();
taskFilterSyncBridge.start();
syncNavigationPreservationController.start();
smartSyncReconnectionController.start();
ongoingSyncReconciliationController
    .start();
desktopTaskEditorLayoutController.start();
mobileTaskEditorLayoutController.start();
app.start();
