import { App } from "./core/App.js";
import {
    AiPreferences
} from "./infrastructure/AiPreferences.js";
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
    MobileTaskFilterSelectController
} from "./ui/MobileTaskFilterSelectController.js";
import {
    OverlayDismissalController
} from "./ui/OverlayDismissalController.js";
import {
    AccessibilityStateController
} from "./ui/AccessibilityStateController.js";
import {
    KeyboardNavigationController
} from "./ui/KeyboardNavigationController.js";
import {
    KeyboardActionShortcutsController
} from "./ui/KeyboardActionShortcutsController.js";
import {
    ManualTaskOrderController
} from "./ui/ManualTaskOrderController.js";
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
    GoalWorkspaceController
} from "./ui/GoalWorkspaceController.js";
import {
    ProjectWorkspaceController
} from "./ui/ProjectWorkspaceController.js";
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
import {
    PwaController
} from "./ui/PwaController.js";
import {
    AiSettingsController
} from "./ui/AiSettingsController.js";
import {
    AiAssistantController
} from "./ui/AiAssistantController.js";
import {
    AiPriorityProposalController
} from "./ui/AiPriorityProposalController.js";
import {
    AiPriorityApplyController
} from "./ui/AiPriorityApplyController.js";
import {
    AiDueDateProposalController
} from "./ui/AiDueDateProposalController.js";
import {
    NotionSettingsController
} from "./ui/NotionSettingsController.js";
import {
    NotionTaskNotesController
} from "./ui/NotionTaskNotesController.js";
import {
    NotionGoalNotesController
} from "./ui/NotionGoalNotesController.js";
import {
    NotionGoalNotesEventBridge
} from "./ui/NotionGoalNotesEventBridge.js";
import {
    NotionSyncRetryController
} from "./ui/NotionSyncRetryController.js";
import {
    BulkDueDateController
} from "./ui/BulkDueDateController.js";
import {
    RecurrenceLifecycleController
} from "./ui/RecurrenceLifecycleController.js";
import {
    BusinessDayRecurrenceController
} from "./ui/BusinessDayRecurrenceController.js";
import {
    ViewTaskSummaryController
} from "./ui/ViewTaskSummaryController.js";
import {
    StrictAdvancedSearchResultsController
} from "./ui/StrictAdvancedSearchResultsController.js";
import {
    ThemeController
} from "./ui/ThemeController.js";

const app = new App();
app.aiPreferences = new AiPreferences();
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
const mobileTaskFilterSelectController =
    new MobileTaskFilterSelectController(app);
const overlayDismissalController =
    new OverlayDismissalController(app);
const accessibilityStateController =
    new AccessibilityStateController(app);
const keyboardNavigationController =
    new KeyboardNavigationController(app);
const keyboardActionShortcutsController =
    new KeyboardActionShortcutsController(app);
const manualTaskOrderController =
    new ManualTaskOrderController(app);
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
const goalWorkspaceController =
    new GoalWorkspaceController(app);
const projectWorkspaceController =
    new ProjectWorkspaceController(app);
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
const pwaController =
    new PwaController(app);
const aiSettingsController =
    new AiSettingsController(app);
const aiAssistantController =
    new AiAssistantController(app);
const aiPriorityProposalController =
    new AiPriorityProposalController(app);
const aiPriorityApplyController =
    new AiPriorityApplyController(
        app,
        aiPriorityProposalController
    );
const aiDueDateProposalController =
    new AiDueDateProposalController(app);
const notionSettingsController =
    new NotionSettingsController(app);
const notionTaskNotesController =
    new NotionTaskNotesController(app);
const notionGoalNotesController =
    new NotionGoalNotesController(app);
const notionGoalNotesEventBridge =
    new NotionGoalNotesEventBridge(
        app,
        notionGoalNotesController
    );
const notionSyncRetryController =
    new NotionSyncRetryController(
        app,
        {
            taskNotesController:
                notionTaskNotesController,
            goalNotesController:
                notionGoalNotesController
        }
    );
const bulkDueDateController =
    new BulkDueDateController(app);
const recurrenceLifecycleController =
    new RecurrenceLifecycleController(app);
const businessDayRecurrenceController =
    new BusinessDayRecurrenceController(app);
const viewTaskSummaryController =
    new ViewTaskSummaryController(app);
const strictAdvancedSearchResultsController =
    new StrictAdvancedSearchResultsController(app);
const themeController =
    new ThemeController(app);

attachmentController.start();
bindAttachmentSearchReference(app);
waitingController.start();
taskToolbarController.start();
sidebarLayoutController.start();
taskFiltersDialogController.start();
mobileTaskFilterSelectController.start();
overlayDismissalController.start();
mobileMainLayoutController.start();
directTaskCreationController.start();
taskSortPreferencesController.start();
taskFilterPreferencesController.start();
goalWorkspaceController.start();
projectWorkspaceController.start();
syncOptionalDataBridge.start();
taskFilterSyncBridge.start();
syncNavigationPreservationController.start();
smartSyncReconnectionController.start();
ongoingSyncReconciliationController
    .start();
pwaController.start();
aiSettingsController.start();
aiAssistantController.start();
aiPriorityProposalController.start();
aiPriorityApplyController.start();
aiDueDateProposalController.start();
notionSettingsController.start();
notionSyncRetryController.start();
notionTaskNotesController.start();
notionGoalNotesController.start();
notionGoalNotesEventBridge.start();
desktopTaskEditorLayoutController.start();
mobileTaskEditorLayoutController.start();
accessibilityStateController.start();
keyboardNavigationController.start();
keyboardActionShortcutsController.start();
manualTaskOrderController.start();
bulkDueDateController.start();
recurrenceLifecycleController.start();
businessDayRecurrenceController.start();
viewTaskSummaryController.start();
strictAdvancedSearchResultsController.start();
app.start();
themeController.start();