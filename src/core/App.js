import { Config } from "./Config.js";
import { TaskService } from "./TaskService.js";
import { AreaService } from "./AreaService.js";
import { ContextService } from "./ContextService.js";
import { TagService } from "./TagService.js";
import { CustomFilterService } from "./CustomFilterService.js";
import { GoalService } from "./GoalService.js";
import { BackupService } from "./BackupService.js";
import { SyncEngine } from "./SyncEngine.js";
import { createSyncFingerprint } from "./SyncFingerprint.js";
import { SyncFocusWatcher } from "./SyncFocusWatcher.js";
import {
    AutomaticSyncAction,
    getAutomaticSyncAction
} from "./AutomaticSyncPolicy.js";
import { SyncConfig } from "../infrastructure/SyncConfig.js";
import { CloudGateway } from "../infrastructure/CloudGateway.js";
import { TaskDisplayPreferences } from "../infrastructure/TaskDisplayPreferences.js";
import { MainView } from "../ui/MainView.js";
import { Priority } from "../domain/Priority.js";
import { View } from "./View.js";
import {
    filterTaskTreeByCriteria,
    hasActiveTaskFilters
} from "./TaskFilters.js";
import {
    compileAdvancedSearch,
    filterTaskTreeByAdvancedSearch
} from "./AdvancedSearch.js";
import {
    TaskSort,
    sortTaskTree
} from "./TaskSorting.js";
import {
    getPostCreationView,
    getTaskCreationDefaults,
    getTaskCreationView
} from "./TaskCreationDefaults.js";

export class App {

    constructor() {

        this.taskService = new TaskService();
        this.areaService = new AreaService();
        this.contextService = new ContextService();
        this.tagService = new TagService();
        this.customFilterService =
            new CustomFilterService();
        this.goalService = new GoalService();

        this.backupService = new BackupService({
            taskRepository: this.taskService.repository,
            areaRepository: this.areaService.repository,
            contextRepository: this.contextService.repository,
            tagRepository: this.tagService.repository,
            customFilterRepository:
                this.customFilterService.repository,
            goalRepository:
                this.goalService.repository
        });

        this.syncConfig = new SyncConfig();
        this.taskDisplayPreferences =
            new TaskDisplayPreferences();

        this.syncEngine = new SyncEngine({
            backupService: this.backupService,
            config: this.syncConfig,
            gateway: new CloudGateway()
        });

        this.selectedTask = null;
        this.selectedGoal = null;
        this.currentGoalStatus = "ACTIVE";
        this.currentView = View.TODAY;
        this.currentAreaId = null;
        this.projectTaskId = null;
        this.previousProjectView = View.TODAY;
        this.projectHistory = [];
        this.projectTaskCreationOpen = false;
        this.inlineSubtaskParentId = null;
        this.taskCreationOpen = false;
        this.searchQuery = "";
        this.advancedSearchMode = false;
        this.advancedSearchExpression = null;
        this.advancedSearchError = "";
        this.currentCustomFilterId = null;
        this.taskFilters = {
            areaId: "",
            contextId: "",
            tagId: "",
            priority: "",
            due: ""
        };
        this.taskSort = TaskSort.MANUAL;
        this.expandedTaskIds = new Set();
        this.selectedTaskIds = new Set();
        this.bulkSelectionMode = false;
        this.syncRemoteRevision = null;
        this.syncRemoteUpdateAvailable = false;
        this.syncCheckInProgress = false;
        this.autoSyncInProgress = false;
        this.autoSyncTimer = null;
        this.autoSyncScheduledFingerprint = null;
        this.autoSyncBlockedFingerprint = null;
        this.syncLastError = null;

        this.syncFocusWatcher =
            new SyncFocusWatcher({
                onFocus: () => {

                    if (
                        this.mainView
                            ?.hasActiveEntityEdit() ||
                        this.mainView
                            ?.hasActiveEntityCreation() ||
                        this.mainView
                            ?.hasUnsavedTaskEdit(
                                this.selectedTask
                            )
                    ) {
                        return;
                    }

                    this.checkRemoteStatus();

                }
            });

        this.mainView = new MainView({

            onOpenTaskCreation: () => {

                this.currentView =
                    getTaskCreationView(
                        this.currentView
                    );

                this.taskCreationOpen = true;
                this.selectedTask = null;
                this.render();

            },

            onCancelTaskCreation: () => {

                this.taskCreationOpen = false;
                this.projectTaskCreationOpen = false;
                this.render();

            },

            onCreateTask: (title) => {

                const task = this.taskService
                    .createTask({
                        title,
                        ...getTaskCreationDefaults(
                            this.currentView,
                            this.getTodayString(),
                            {
                                areaId:
                                    this.currentAreaId
                            }
                        )
                    });

                this.currentView =
                    getPostCreationView(
                        this.currentView,
                        task
                    );

                this.taskCreationOpen = false;
                this.selectedTask = task;
                this.render();

            },

            onCreateSubtask: (parentId, title) => {

                this.taskService.createSubtask(parentId, title);

                this.expandedTaskIds.add(parentId);

                this.selectedTask =
                    this.taskService.getTaskById(parentId);

                this.render();

            },

            onUpdateTask: (id, data) => {

                this.taskService.updateTask(id, data);

                this.selectedTask = null;

                this.render();

            },

            onToggleTask: (id) => {

                this.taskService.toggleTask(id);

                this.selectedTask = null;

                this.render();

            },

            onQuickPostponeTask: (id, newDate) => {

                this.taskService.postponeTask(
                    id,
                    newDate
                );

                this.selectedTask = null;
                this.render();

            },

            onPostponeTask: (id, newDate) => {

                this.taskService.postponeTask(id, newDate);

                this.selectedTask =
                    this.taskService.getTaskById(id);

                this.render();

            },

            onQuickSkipRecurringTask: (id) => {

                this.taskService.skipRecurringTask(id);

                this.selectedTask = null;
                this.render();

            },

            onDuplicateTask: (id) => {

                const duplicated =
                    this.taskService
                        .duplicateTaskTree(id);

                if (!duplicated) {
                    return null;
                }

                this.expandedTaskIds.add(
                    duplicated.root.id
                );

                this.selectedTask = null;
                this.render();

                return duplicated.root.id;

            },

            onRevealTask: (id) => {

                this.currentView = View.ALL;
                this.projectTaskId = null;
                this.projectHistory = [];
                this.searchQuery = "";
                this.advancedSearchExpression = null;
                this.advancedSearchError = "";
                this.taskFilters = {
                    areaId: "",
                    contextId: "",
                    tagId: "",
                    priority: "",
                    due: ""
                };
                this.selectedTask = null;
                this.render();

                return id;

            },

            onMoveTaskToProject: (
                id,
                parentId
            ) => {

                this.taskService
                    .moveTaskToProject(
                        id,
                        parentId
                    );

                this.expandedTaskIds.add(
                    parentId
                );

                this.selectedTask = null;
                this.render();

            },

            onDetachSubtask: (id) => {

                this.taskService.detachSubtask(id);

                this.selectedTask = null;
                this.render();

            },

            onQuickClearDueDate: (id) => {

                this.taskService.updateTask(
                    id,
                    {
                        dueDate: null
                    }
                );

                this.selectedTask = null;
                this.render();

            },

            onQuickEndRecurrence: (id) => {

                this.taskService.endRecurrence(id);

                this.selectedTask = null;
                this.render();

            },

            onSkipRecurringTask: (id) => {

                this.taskService.skipRecurringTask(id);

                this.selectedTask =
                    this.taskService.getTaskById(id);

                this.render();

            },

            onArchiveTask: (id) => {

                this.taskService.archiveTask(id);

                this.selectedTask = null;

                this.render();

            },

            onDeleteTask: (id) => {

                this.taskService.deleteTask(id);

                this.selectedTask = null;

                this.render();

            },

            onRestoreArchivedTask: (id) => {

                this.taskService.restoreArchivedTask(id);

                this.selectedTask = null;

                this.render();

            },

            onRestoreDeletedTask: (id) => {

                this.taskService.restoreDeletedTask(id);

                this.selectedTask = null;

                this.render();

            },

            onPermanentlyDeleteTask: (id) => {

                this.taskService.permanentlyDeleteTask(id);

                this.selectedTask = null;

                this.render();

            },

            onSearchTasks: (query) => {

                this.searchQuery = query;
                this.advancedSearchError = "";
                this.currentCustomFilterId = null;

                if (this.advancedSearchMode) {

                    try {

                        this.advancedSearchExpression =
                            compileAdvancedSearch(query);

                    } catch (error) {

                        this.advancedSearchExpression = null;
                        this.advancedSearchError =
                            error.message;

                    }

                }

                this.selectedTask = null;
                this.render();

            },

            onClearSearch: () => {

                this.searchQuery = "";
                this.advancedSearchExpression = null;
                this.advancedSearchError = "";
                this.currentCustomFilterId = null;

                this.selectedTask = null;

                this.render();

            },

            onToggleAdvancedSearch: () => {

                this.advancedSearchMode =
                    !this.advancedSearchMode;

                this.searchQuery = "";
                this.advancedSearchExpression = null;
                this.advancedSearchError = "";
                this.currentCustomFilterId = null;
                this.selectedTask = null;

                this.render();

            },

            onSaveCustomFilter: (name) => {

                if (
                    !this.advancedSearchMode ||
                    !this.advancedSearchExpression ||
                    this.advancedSearchError
                ) {
                    throw new Error(
                        "La búsqueda avanzada debe ser válida antes de guardarla."
                    );
                }

                const filter =
                    this.customFilterService
                        .createFilter({
                            name,
                            query: this.searchQuery
                        });

                this.currentCustomFilterId =
                    filter.id;

                this.render();

                return filter;

            },

            onApplyCustomFilter: (id) => {

                const filter =
                    this.customFilterService
                        .getFilterById(id);

                if (!filter) return;

                this.currentView = View.ALL;
                this.currentAreaId = null;
                this.projectTaskId = null;
                this.projectHistory = [];
                this.advancedSearchMode = true;
                this.searchQuery = filter.query;
                this.advancedSearchExpression =
                    compileAdvancedSearch(
                        filter.query
                    );
                this.advancedSearchError = "";
                this.currentCustomFilterId = id;
                this.bulkSelectionMode = false;
                this.selectedTaskIds.clear();
                this.selectedTask = null;

                this.render();

            },

            onRenameCustomFilter: (
                id,
                name
            ) => {

                this.customFilterService
                    .updateFilter(id, { name });

                this.render();

            },

            onDeleteCustomFilter: (id) => {

                this.customFilterService
                    .deleteFilter(id);

                if (
                    this.currentCustomFilterId === id
                ) {
                    this.currentCustomFilterId = null;
                }

                this.render();

            },

            onApplyTaskFilters: (filters) => {

                this.taskFilters = { ...filters };

                this.selectedTask = null;

                this.render();

            },

            onClearTaskFilters: () => {

                this.taskFilters = {
                    areaId: "",
                    contextId: "",
                    tagId: "",
                    priority: "",
                    due: ""
                };

                this.selectedTask = null;

                this.render();

            },

            onChangeTaskSort: (sort) => {

                this.taskSort = sort;

                this.selectedTask = null;

                this.render();

            },

            onToggleTaskExpansion: (id) => {

                if (this.expandedTaskIds.has(id)) {
                    this.expandedTaskIds.delete(id);
                } else {
                    this.expandedTaskIds.add(id);
                }

                this.render();

            },

            onSelectTask: (id) => {

                this.inlineSubtaskParentId = null;
                this.selectedTask = this.taskService.getTaskById(id);

                this.render();

            },

            onOpenInlineSubtask: (parentId) => {

                this.inlineSubtaskParentId =
                    parentId;

                this.selectedTask = null;
                this.render();

            },

            onCancelInlineSubtask: () => {

                this.inlineSubtaskParentId = null;
                this.render();

            },

            onCreateInlineSubtask: (
                parentId,
                title
            ) => {

                this.taskService.createSubtask(
                    parentId,
                    title
                );

                this.expandedTaskIds.add(
                    parentId
                );

                this.inlineSubtaskParentId = null;
                this.render();

            },

            onOpenProjectTaskCreation: () => {

                if (!this.projectTaskId) return;

                this.projectTaskCreationOpen = true;
                this.selectedTask = null;
                this.render();

            },

            onCreateProjectSubtask: (title) => {

                if (!this.projectTaskId) return;

                const subtask =
                    this.taskService.createSubtask(
                        this.projectTaskId,
                        title
                    );

                this.expandedTaskIds.add(
                    this.projectTaskId
                );

                this.projectTaskCreationOpen = false;
                this.selectedTask = subtask;
                this.render();

            },

            onOpenProject: (id) => {

                const project =
                    this.taskService.getTaskById(id);

                if (!project) return;

                if (this.currentView !== View.PROJECT) {

                    this.previousProjectView =
                        this.currentView;

                    this.projectHistory = [];

                } else if (
                    this.projectTaskId &&
                    this.projectTaskId !== id
                ) {

                    this.projectHistory.push(
                        this.projectTaskId
                    );

                }

                this.projectTaskId = id;
                this.projectTaskCreationOpen = false;
                this.inlineSubtaskParentId = null;
                this.selectedTask = null;

                this.expandedTaskIds.add(id);

                for (
                    const task of
                    this.taskService.getDescendants(id)
                ) {
                    this.expandedTaskIds.add(task.id);
                }

                this.currentView = View.PROJECT;
                this.render();

            },

            onCloseProject: () => {

                const previousProjectId =
                    this.projectHistory.pop();

                if (previousProjectId) {

                    this.projectTaskId =
                        previousProjectId;

                    this.projectTaskCreationOpen =
                        false;

                    this.selectedTask = null;
                    this.render();

                    return;

                }

                this.currentView =
                    this.previousProjectView ??
                    View.TODAY;

                this.projectTaskId = null;
                this.projectHistory = [];
                this.projectTaskCreationOpen = false;
                this.selectedTask = null;
                this.render();

            },

            onEditProjectTask: (id) => {

                this.selectedTask =
                    this.taskService.getTaskById(id);

                this.render();

            },

            onCloseTaskEditor: () => {

                this.selectedTask = null;

                this.render();

            },

            onToggleTaskMetadata: () => {

                this.taskDisplayPreferences
                    .toggleMetadata();

                this.render();

            },

            onToggleCompletedTasks: () => {

                this.taskDisplayPreferences
                    .toggleCompletedTasks();

                this.selectedTask = null;
                this.render();

            },

            onToggleBulkMode: () => {

                this.bulkSelectionMode =
                    !this.bulkSelectionMode;

                this.selectedTaskIds.clear();
                this.selectedTask = null;

                this.render();

            },

            onToggleBulkSelection: (
                id,
                selected
            ) => {

                if (selected) {
                    this.selectedTaskIds.add(id);
                } else {
                    this.selectedTaskIds.delete(id);
                }

                this.render();

            },

            onClearBulkSelection: () => {

                this.selectedTaskIds.clear();

                this.render();

            },

            onBulkUpdateTasks: (data) => {

                const {
                    addTagIds = [],
                    ...taskData
                } = data;

                const updated =
                    this.taskService.updateTasks(
                        [...this.selectedTaskIds],
                        taskData,
                        {
                            addTagIds
                        }
                    );

                this.selectedTaskIds.clear();
                this.selectedTask = null;

                this.render();

                return updated.length;

            },

            onBulkCompleteTasks: () => {

                const updated =
                    this.taskService
                        .completeTasks(
                            [...this.selectedTaskIds]
                        );

                this.selectedTaskIds.clear();
                this.selectedTask = null;
                this.render();

                return updated.length;

            },

            onBulkArchiveTasks: () => {

                const updated =
                    this.taskService
                        .archiveTasks(
                            [...this.selectedTaskIds]
                        );

                this.selectedTaskIds.clear();
                this.selectedTask = null;
                this.render();

                return updated.length;

            },

            onBulkDeleteTasks: () => {

                const updated =
                    this.taskService
                        .deleteTasks(
                            [...this.selectedTaskIds]
                        );

                this.selectedTaskIds.clear();
                this.selectedTask = null;
                this.render();

                return updated.length;

            },

            onBulkPermanentlyDeleteTasks: () => {

                const deleted =
                    this.taskService
                        .permanentlyDeleteTasks(
                            [...this.selectedTaskIds]
                        );

                this.selectedTaskIds.clear();
                this.selectedTask = null;
                this.render();

                return deleted.length;

            },

            onEmptyTrash: () => {

                const deleted =
                    this.taskService.emptyTrash();

                this.selectedTaskIds.clear();
                this.selectedTask = null;
                this.render();

                return deleted.length;

            },

            onBulkRestoreTasks: () => {

                let restored;

                switch (this.currentView) {

                    case View.COMPLETED:
                        restored =
                            this.taskService
                                .reopenCompletedTrees(
                                    [...this.selectedTaskIds]
                                );
                        break;

                    case View.ARCHIVED:
                        restored =
                            this.taskService
                                .restoreArchivedTrees(
                                    [...this.selectedTaskIds]
                                );
                        break;

                    case View.TRASH:
                        restored =
                            this.taskService
                                .restoreDeletedTrees(
                                    [...this.selectedTaskIds]
                                );
                        break;

                    default:
                        throw new Error(
                            "Esta vista no admite restauración masiva."
                        );

                }

                this.selectedTaskIds.clear();
                this.selectedTask = null;
                this.render();

                return restored.length;

            },

            onCreateArea: (name, color) => {

                this.areaService.createArea({ name, color });

                this.render();

            },

            onUpdateArea: (
                id,
                name,
                color
            ) => {

                this.areaService.updateArea(
                    id,
                    { name, color }
                );

                this.render();

            },

            onDeleteArea: (id) => {

                if (this.taskService.hasTasksInArea(id)) {

                    throw new Error(
                        "No se puede eliminar el área porque está asignada a una o más tareas."
                    );

                }

                this.areaService.deleteArea(id);

                this.render();

            },

            onCreateContext: (name, color) => {

                this.contextService.createContext({ name, color });

                this.render();

            },

            onUpdateContext: (
                id,
                name,
                color
            ) => {

                this.contextService.updateContext(
                    id,
                    { name, color }
                );

                this.render();

            },

            onDeleteContext: (id) => {

                if (this.taskService.hasTasksInContext(id)) {

                    throw new Error(
                        "No se puede eliminar el contexto porque está asignado a una o más tareas."
                    );

                }

                this.contextService.deleteContext(id);

                this.render();

            },

            onCreateTag: (name, color) => {

                this.tagService.createTag({ name, color });
                this.render();

            },

            onUpdateTag: (
                id,
                name,
                color
            ) => {

                this.tagService.updateTag(
                    id,
                    { name, color }
                );
                this.render();

            },

            onDeleteTag: (id) => {

                if (this.taskService.hasTasksWithTag(id)) {
                    throw new Error(
                        "No se puede eliminar la etiqueta porque está asignada a una o más tareas."
                    );
                }

                this.tagService.deleteTag(id);
                this.render();

            },

            onSaveSyncConfig: ({
                url,
                token
            }) => {

                const current =
                    this.syncConfig.get();

                const nextUrl =
                    this.syncConfig.validateUrl(url);

                const savedToken =
                    nextUrl === current.url
                        ? current.token
                        : "";

                this.cancelAutomaticSync();

                this.syncConfig.save({
                    url: nextUrl,
                    token: token || savedToken
                });

                this.syncRemoteRevision = null;
                this.syncRemoteUpdateAvailable =
                    false;
                this.syncLastError = null;

                this.render();
                this.checkRemoteStatus();

            },

            onClearSyncConfig: () => {

                this.cancelAutomaticSync();

                this.syncConfig.clear();
                this.syncRemoteRevision = null;
                this.syncRemoteUpdateAvailable = false;
                this.syncLastError = null;

                this.render();

            },

            onPushToCloud: () => {

                return this.runManualSync(
                    () => this.syncEngine.push()
                );

            },

            onPullFromCloud: () => {

                return this.runManualSync(
                    () => this.syncEngine.pull(),
                    {
                        resetTransientState: true
                    }
                );

            },

            onOverwriteCloud: () => {

                return this.runManualSync(
                    () =>
                        this.syncEngine
                            .overwriteRemote()
                );

            },

            onExportBackup: () => {

                return this.backupService.exportBackup();

            },

            onImportBackup: (json) => {

                const data =
                    this.backupService.importBackup(json);

                this.resetTransientState();
                this.render();

                return {
                    tasks: data.tasks.length,
                    areas: data.areas.length,
                    contexts: data.contexts.length,
                    tags: data.tags.length
                };

            },

            onRestoreLastImportBackup: () => {

                const data =
                    this.backupService
                        .restoreLastImportBackup();

                this.resetTransientState();
                this.render();

                return {
                    tasks: data.tasks.length,
                    areas: data.areas.length,
                    contexts: data.contexts.length,
                    tags: data.tags.length
                };

            },

            onShowInbox: () => {

                this.navigateTo(View.INBOX);

            },

            onShowToday: () => {

                this.navigateTo(View.TODAY);

            },

            onShowUpcoming: () => {

                this.navigateTo(View.UPCOMING);

            },

            onShowAll: () => {

                this.navigateTo(View.ALL);

            },

            onShowArea: id => {

                if (
                    !this.areaService
                        .getAreaById(id)
                ) {
                    return;
                }

                this.currentAreaId = id;
                this.navigateTo(View.AREA);

            },

            onShowCompleted: () => {

                this.navigateTo(View.COMPLETED);

            },

            onShowArchived: () => {

                this.navigateTo(View.ARCHIVED);

            },

            onShowTrash: () => {

                this.navigateTo(View.TRASH);

            },

            onShowGoals: () => {

                this.selectedGoal = null;
                this.currentGoalStatus = "ACTIVE";
                this.navigateTo(View.GOALS);

            },

            onCreateGoal: (data) => {

                this.goalService.createGoal(data);

                this.render();

            },

            onCreateSubgoal: (
                parentGoalId,
                title
            ) => {

                this.goalService.createGoal({
                    title,
                    parentGoalId
                });

                this.selectedGoal =
                    this.goalService.getGoalById(
                        parentGoalId
                    );

                this.render();

            },

            onMoveGoal: (
                id,
                parentGoalId
            ) => {

                this.goalService.moveGoal(
                    id,
                    parentGoalId
                );

                this.selectedGoal =
                    this.goalService.getGoalById(id);

                this.render();

            },

            onDetachGoal: (id) => {

                this.goalService.detachGoal(id);

                this.selectedGoal =
                    this.goalService.getGoalById(id);

                this.render();

            },

            onShowGoalStatus: (status) => {

                this.currentGoalStatus = status;
                this.selectedGoal = null;

                this.render();

            },

            onSelectGoal: (id) => {

                this.selectedGoal =
                    this.goalService
                        .getGoalById(id);

                this.render();

            },

            onCloseGoal: () => {

                this.selectedGoal = null;

                this.render();

            },

            onUpdateGoal: (id, data) => {

                this.goalService.updateGoal(
                    id,
                    data
                );

                this.selectedGoal = null;

                this.render();

            },

            onCompleteGoal: (id) => {

                this.goalService.completeGoal(id);
                this.selectedGoal = null;

                this.render();

            },

            onArchiveGoal: (id) => {

                this.goalService.archiveGoal(id);
                this.selectedGoal = null;

                this.render();

            },

            onReopenGoal: (id) => {

                this.goalService.reopenGoal(id);
                this.render();

            },

            onRestoreArchivedGoal: (id) => {

                this.goalService.restoreGoal(id);
                this.render();

            },

            onDeleteGoal: (id) => {

                this.goalService.deleteGoal(id);
                this.selectedGoal = null;
                this.render();

            },

            onRestoreDeletedGoal: (id) => {

                this.goalService.restoreDeletedGoal(id);
                this.render();

            },

            onPermanentlyDeleteGoal: (id) => {

                this.goalService
                    .permanentlyDeleteGoal(id);

                this.render();

            },

            onShowAreas: () => {

                this.navigateTo(View.AREAS);

            },

            onShowContexts: () => {

                this.navigateTo(View.CONTEXTS);

            },

            onShowTags: () => {

                this.navigateTo(View.TAGS);

            },

        });

    }

    navigateTo(view) {

        this.currentView = view;

        if (view !== View.AREA) {
            this.currentAreaId = null;
        }

        this.bulkSelectionMode = false;
        this.currentCustomFilterId = null;
        this.selectedTaskIds.clear();
        this.selectedTask = null;

        this.render();

    }

    async runManualSync(
        operation,
        {
            resetTransientState = false
        } = {}
    ) {

        this.cancelAutomaticSync();
        this.autoSyncInProgress = true;
        this.syncLastError = null;
        this.render();

        try {

            const result = await operation();

            this.syncRemoteRevision =
                result.revision;
            this.syncRemoteUpdateAvailable =
                false;
            this.autoSyncBlockedFingerprint =
                null;
            this.syncLastError = null;

            if (resetTransientState) {
                this.resetTransientState();
            }

            return result;

        } catch (error) {

            this.syncLastError =
                error?.message ||
                "No se pudo completar la sincronización.";

            if (
                this.syncEngine.isConflict(
                    error
                )
            ) {
                this.syncRemoteRevision =
                    error.remoteRevision;
                this.syncRemoteUpdateAvailable =
                    true;
            }

            throw error;

        } finally {

            this.autoSyncInProgress = false;
            this.render();

        }

    }

    getCurrentSyncFingerprint() {

        return createSyncFingerprint(
            this.backupService.createBackup()
        );

    }

    resolveAutomaticSyncAction(
        fingerprint =
            this.getCurrentSyncFingerprint()
    ) {

        return getAutomaticSyncAction({
            configured:
                this.syncConfig.isConfigured(),
            remoteChecked:
                this.syncRemoteRevision !== null,
            localPending:
                this.syncConfig.hasPendingChanges(
                    fingerprint
                ),
            remoteUpdateAvailable:
                this.syncRemoteUpdateAvailable,
            inProgress:
                this.autoSyncInProgress ||
                this.syncCheckInProgress
        });

    }

    cancelAutomaticSync() {

        if (this.autoSyncTimer !== null) {
            clearTimeout(this.autoSyncTimer);
        }

        this.autoSyncTimer = null;
        this.autoSyncScheduledFingerprint =
            null;

    }

    scheduleAutomaticSync(fingerprint) {

        const action =
            this.resolveAutomaticSyncAction(
                fingerprint
            );

        if (
            action !==
                AutomaticSyncAction.PUSH ||
            fingerprint ===
                this.autoSyncBlockedFingerprint
        ) {
            if (
                action !==
                AutomaticSyncAction.PUSH
            ) {
                this.cancelAutomaticSync();
            }

            return;
        }

        if (
            this.autoSyncTimer !== null &&
            this.autoSyncScheduledFingerprint ===
                fingerprint
        ) {
            return;
        }

        this.cancelAutomaticSync();

        this.autoSyncScheduledFingerprint =
            fingerprint;

        this.autoSyncTimer = setTimeout(
            () =>
                this.runAutomaticPush(
                    fingerprint
                ),
            1500
        );

    }

    async runAutomaticPush(fingerprint) {

        this.autoSyncTimer = null;
        this.autoSyncScheduledFingerprint =
            null;

        if (
            this.resolveAutomaticSyncAction(
                this.getCurrentSyncFingerprint()
            ) !== AutomaticSyncAction.PUSH
        ) {
            return;
        }

        this.autoSyncInProgress = true;
        this.syncLastError = null;
        this.render();

        try {

            const result =
                await this.syncEngine.push();

            this.syncRemoteRevision =
                result.revision;
            this.syncRemoteUpdateAvailable =
                false;
            this.autoSyncBlockedFingerprint =
                null;
            this.syncLastError = null;

        } catch (error) {

            this.autoSyncBlockedFingerprint =
                fingerprint;
            this.syncLastError =
                error?.message ||
                "No se pudo sincronizar automáticamente.";

            if (
                this.syncEngine.isConflict(
                    error
                )
            ) {
                this.syncRemoteRevision =
                    error.remoteRevision;
                this.syncRemoteUpdateAvailable =
                    true;
            } else {
                console.warn(
                    "No se pudo sincronizar automáticamente.",
                    error
                );
            }

        } finally {

            this.autoSyncInProgress = false;
            this.render();

        }

    }

    start() {

        console.log(`${Config.APP_NAME} v${Config.VERSION}`);

        if (this.taskService.getAllTasks().length === 0) {

            this.taskService.createTask({
                title: "Preparar clase de Literatura",
                priority: Priority.HIGH
            });

            this.taskService.createTask({
                title: "Corregir evaluaciones"
            });

        }

        this.render();
        this.checkRemoteStatus();
        this.syncFocusWatcher.start();

    }

    async checkRemoteStatus() {

        if (!this.syncConfig.isConfigured()) {

            this.cancelAutomaticSync();
            this.syncRemoteRevision = null;
            this.syncRemoteUpdateAvailable = false;

            return;

        }

        if (
            this.syncCheckInProgress ||
            this.autoSyncInProgress
        ) {
            return;
        }

        this.syncCheckInProgress = true;
        this.syncLastError = null;
        this.render();

        try {

            const status =
                await this.syncEngine
                    .checkRemoteRevision();

            this.syncRemoteRevision =
                status.remoteRevision;
            this.syncRemoteUpdateAvailable =
                status.updateAvailable;
            this.autoSyncBlockedFingerprint =
                null;
            this.syncLastError = null;
            this.syncCheckInProgress = false;

            const action =
                this.resolveAutomaticSyncAction();

            if (
                action ===
                AutomaticSyncAction.PULL
            ) {

                this.autoSyncInProgress = true;

                const result =
                    await this.syncEngine.pull();

                this.syncRemoteRevision =
                    result.revision;
                this.syncRemoteUpdateAvailable =
                    false;
                this.resetTransientState();

            }

        } catch (error) {

            this.syncLastError =
                error?.message ||
                "No se pudo comprobar la sincronización.";

            console.warn(
                "No se pudo comprobar o descargar la revisión remota.",
                error
            );

        } finally {

            this.autoSyncInProgress = false;
            this.syncCheckInProgress = false;
            this.render();

        }

    }

    resetTransientState() {

        this.selectedTask = null;
        this.currentView = View.TODAY;
        this.currentAreaId = null;
        this.taskCreationOpen = false;
        this.searchQuery = "";
        this.advancedSearchExpression = null;
        this.advancedSearchError = "";
        this.currentCustomFilterId = null;
        this.taskFilters = {
            areaId: "",
            contextId: "",
            tagId: "",
            priority: "",
            due: ""
        };
        this.taskSort = TaskSort.MANUAL;
        this.expandedTaskIds.clear();
        this.selectedTaskIds.clear();
        this.bulkSelectionMode = false;

    }

    getTodayString() {

        const today = new Date();

        const year = today.getFullYear();

        const month = String(
            today.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            today.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;

    }

    getVisibleTasks() {

        const today = this.getTodayString();

        switch (this.currentView) {

            case View.PROJECT:

                if (!this.projectTaskId) {
                    return [];
                }

                return this.taskService
                    .getProjectDescendants(
                        this.projectTaskId
                    );

            case View.TODAY:

                return this.taskService.getTodayTasks(today);

            case View.UPCOMING:

                return this.taskService.getUpcomingTasks(today);

            case View.ALL:

                return this.taskService.getAllActiveTasks();

            case View.AREA:

                return this.currentAreaId
                    ? this.taskService
                        .getAllActiveTasks()
                    : [];

            case View.COMPLETED:

                return this.taskService.getCompletedTasks();

            case View.ARCHIVED:

                return this.taskService.getArchivedTasks();

            case View.TRASH:

                return this.taskService.getDeletedTasks();

            case View.INBOX:
            default:

                return this.taskService.getInboxTasks();

        }

    }

    getCompletedTasksForCurrentView() {

        const today = this.getTodayString();
        const completedTasks =
            this.taskService.getCompletedTasks();

        switch (this.currentView) {

            case View.TODAY:
                return completedTasks.filter(
                    task =>
                        task.dueDate !== null &&
                        task.dueDate <= today
                );

            case View.UPCOMING:
                return completedTasks.filter(
                    task =>
                        task.dueDate !== null &&
                        task.dueDate > today
                );

            case View.ALL:
                return completedTasks;

            case View.AREA:
                return completedTasks.filter(
                    task =>
                        task.areaId ===
                        this.currentAreaId
                );

            case View.INBOX:
                return completedTasks.filter(
                    task =>
                        task.areaId === null &&
                        task.dueDate === null
                );

            default:
                return [];

        }

    }

    render() {

        const activeViews = [
            View.INBOX,
            View.TODAY,
            View.UPCOMING,
            View.ALL,
            View.AREA
        ];

        let visibleTasks = this.getVisibleTasks();

        const showCompletedTasks =
            this.taskDisplayPreferences
                .areCompletedTasksVisible();

        if (
            activeViews.includes(this.currentView) &&
            showCompletedTasks
        ) {

            visibleTasks =
                this.taskService.includeCompletedDescendants([
                    ...visibleTasks,
                    ...this.getCompletedTasksForCurrentView()
                ]);

        }

        if (
            this.currentView === View.PROJECT &&
            !showCompletedTasks
        ) {

            visibleTasks = visibleTasks.filter(
                task => !task.isCompleted()
            );

        }

        if (this.currentView !== View.PROJECT) {

            visibleTasks = filterTaskTreeByCriteria(
                visibleTasks,
                {
                    query: this.advancedSearchMode
                        ? ""
                        : this.searchQuery,
                    filters: this.advancedSearchMode
                        ? (
                            this.currentView ===
                                View.AREA
                                ? {
                                    areaId:
                                        this.currentAreaId
                                }
                                : {}
                        )
                        : (
                            this.currentView ===
                                View.AREA
                                ? {
                                    ...this.taskFilters,
                                    areaId:
                                        this.currentAreaId
                                }
                                : this.taskFilters
                        ),
                    today: this.getTodayString()
                }
            );

            visibleTasks = sortTaskTree(
                visibleTasks,
                this.taskSort
            );

        }

        if (
            this.advancedSearchMode &&
            this.advancedSearchExpression
        ) {

            visibleTasks =
                filterTaskTreeByAdvancedSearch(
                    visibleTasks,
                    this.advancedSearchExpression,
                    {
                        areas:
                            this.areaService.getAllAreas(),
                        contexts:
                            this.contextService.getAllContexts(),
                        tags:
                            this.tagService.getAllTags(),
                        today: this.getTodayString()
                    }
                );

        }

        const bulkModes = {
            [View.INBOX]: "ACTIVE",
            [View.TODAY]: "ACTIVE",
            [View.UPCOMING]: "ACTIVE",
            [View.ALL]: "ACTIVE",
            [View.AREA]: "ACTIVE",
            [View.COMPLETED]: "COMPLETED",
            [View.ARCHIVED]: "ARCHIVED",
            [View.TRASH]: "TRASH"
        };

        const bulkActionMode =
            bulkModes[this.currentView] ??
            null;

        const bulkSelectionEnabled =
            this.bulkSelectionMode &&
            bulkActionMode !== null;

        if (bulkSelectionEnabled) {

            const visibleSelectableIds = new Set(
                visibleTasks
                    .filter(
                        task => {

                            switch (bulkActionMode) {

                                case "ACTIVE":
                                    return !task.isCompleted();

                                case "COMPLETED":
                                    return (
                                        task.isCompleted() &&
                                        !task.recurrence
                                    );

                                case "ARCHIVED":
                                    return task.isArchived();

                                case "TRASH":
                                    return task.isDeleted();

                                default:
                                    return false;

                            }

                        }
                    )
                    .map(task => task.id)
            );

            this.selectedTaskIds = new Set(
                [...this.selectedTaskIds]
                    .filter(
                        id =>
                            visibleSelectableIds.has(id)
                    )
            );

        } else {

            this.selectedTaskIds.clear();

        }

        const syncFingerprint =
            this.getCurrentSyncFingerprint();

        this.mainView.render({

            view: this.currentView,
            activeAreaId:
                this.currentAreaId,
            activeArea:
                this.currentAreaId
                    ? this.areaService
                        .getAreaById(
                            this.currentAreaId
                        )
                    : null,
            projectTask:
                this.projectTaskId
                    ? this.taskService.getTaskById(
                        this.projectTaskId
                    )
                    : null,
            projectTaskCreationOpen:
                this.projectTaskCreationOpen,
            projectNavigationDepth:
                this.projectHistory.length,
            inlineSubtaskParentId:
                this.inlineSubtaskParentId,
            taskCreationOpen:
                this.taskCreationOpen,
            tasks: visibleTasks,
            allTasks: this.taskService.getAllTasks(),
            expandedTaskIds: this.expandedTaskIds,
            searchQuery: this.searchQuery,
            advancedSearchMode:
                this.advancedSearchMode,
            advancedSearchError:
                this.advancedSearchError,
            customFilters:
                this.customFilterService
                    .getAllFilters(),
            currentCustomFilterId:
                this.currentCustomFilterId,
            taskFilters: this.taskFilters,
            filtersActive: hasActiveTaskFilters(
                this.taskFilters
            ),
            taskSort: this.taskSort,
            selectedTaskIds:
                this.selectedTaskIds,
            bulkSelectionMode:
                this.bulkSelectionMode,
            bulkSelectionEnabled,
            bulkActionMode,
            showTaskMetadata:
                this.taskDisplayPreferences
                    .isMetadataVisible(),
            showCompletedTasks,
            today: this.getTodayString(),
            canRestoreBackup:
                this.backupService.hasLastImportBackup(),
            syncConfigured:
                this.syncConfig.isConfigured(),
            syncUrl:
                this.syncConfig.get().url,
            syncRevision:
                this.syncConfig.getRevision(),
            syncPendingChanges:
                this.syncConfig.hasPendingChanges(
                    syncFingerprint
                ),
            syncLastSuccess:
                this.syncConfig.getLastSuccess(),
            syncRemoteRevision:
                this.syncRemoteRevision,
            syncRemoteUpdateAvailable:
                this.syncRemoteUpdateAvailable,
            syncInProgress:
                this.autoSyncInProgress ||
                this.syncCheckInProgress,
            syncLastError:
                this.syncLastError,
            selectedTask: this.selectedTask,
            selectedGoal: this.selectedGoal,
            currentGoalStatus:
                this.currentGoalStatus,
            goals: this.goalService.getAllGoals(),
            areas: this.areaService.getAllAreas(),
            contexts: this.contextService.getAllContexts(),
            tags: this.tagService.getAllTags()

        });

        this.scheduleAutomaticSync(
            syncFingerprint
        );

    }

}
