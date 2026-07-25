import { Config } from "./Config.js";
import { TaskService } from "./TaskService.js";
import { AreaService } from "./AreaService.js";
import { ContextService } from "./ContextService.js";
import { TagService } from "./TagService.js";
import { BackupService } from "./BackupService.js";
import { SyncEngine } from "./SyncEngine.js";
import { createSyncFingerprint } from "./SyncFingerprint.js";
import { SyncFocusWatcher } from "./SyncFocusWatcher.js";
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

        this.backupService = new BackupService({
            taskRepository: this.taskService.repository,
            areaRepository: this.areaService.repository,
            contextRepository: this.contextService.repository,
            tagRepository: this.tagService.repository
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
        this.currentView = View.TODAY;
        this.projectTaskId = null;
        this.previousProjectView = View.TODAY;
        this.projectHistory = [];
        this.projectTaskCreationOpen = false;
        this.inlineSubtaskParentId = null;
        this.taskCreationOpen = false;
        this.searchQuery = "";
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

        this.syncFocusWatcher =
            new SyncFocusWatcher({
                onFocus: () =>
                    this.checkRemoteStatus()
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
                            this.getTodayString()
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

                this.selectedTask = null;

                this.render();

            },

            onClearSearch: () => {

                this.searchQuery = "";

                this.selectedTask = null;

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

                this.syncConfig.save({
                    url: nextUrl,
                    token: token || savedToken
                });

                this.render();
                this.checkRemoteStatus();

            },

            onClearSyncConfig: () => {

                this.syncConfig.clear();
                this.syncRemoteRevision = null;
                this.syncRemoteUpdateAvailable = false;

                this.render();

            },

            onPushToCloud: async () => {

                const result =
                    await this.syncEngine.push();

                this.syncRemoteRevision =
                    result.revision;
                this.syncRemoteUpdateAvailable =
                    false;
                this.render();

                return result;

            },

            onPullFromCloud: async () => {

                const result =
                    await this.syncEngine.pull();

                this.syncRemoteRevision =
                    result.revision;
                this.syncRemoteUpdateAvailable =
                    false;
                this.resetTransientState();
                this.render();

                return result;

            },

            onOverwriteCloud: async () => {

                const result =
                    await this.syncEngine
                        .overwriteRemote();

                this.syncRemoteRevision =
                    result.revision;
                this.syncRemoteUpdateAvailable =
                    false;
                this.render();

                return result;

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

                this.currentView = View.INBOX;

                this.render();

            },

            onShowToday: () => {

                this.currentView = View.TODAY;

                this.render();

            },

            onShowUpcoming: () => {

                this.currentView = View.UPCOMING;

                this.render();

            },

            onShowAll: () => {

                this.currentView = View.ALL;

                this.render();

            },

            onShowCompleted: () => {

                this.currentView = View.COMPLETED;

                this.render();

            },

            onShowArchived: () => {

                this.currentView = View.ARCHIVED;

                this.render();

            },

            onShowTrash: () => {

                this.currentView = View.TRASH;

                this.render();

            },

            onShowAreas: () => {

                this.currentView = View.AREAS;

                this.render();

            },

            onShowContexts: () => {

                this.currentView = View.CONTEXTS;
                this.render();

            },

            onShowTags: () => {

                this.currentView = View.TAGS;
                this.render();

            }

        });

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

            this.syncRemoteRevision = null;
            this.syncRemoteUpdateAvailable = false;

            return;

        }

        if (this.syncCheckInProgress) {
            return;
        }

        this.syncCheckInProgress = true;

        try {

            const status =
                await this.syncEngine
                    .checkRemoteRevision();

            this.syncRemoteRevision =
                status.remoteRevision;

            this.syncRemoteUpdateAvailable =
                status.updateAvailable;

            this.render();

        } catch (error) {

            console.warn(
                "No se pudo comprobar la revisión remota.",
                error
            );

        } finally {

            this.syncCheckInProgress = false;

        }

    }

    resetTransientState() {

        this.selectedTask = null;
        this.currentView = View.TODAY;
        this.taskCreationOpen = false;
        this.searchQuery = "";
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

    render() {

        const activeViews = [
            View.INBOX,
            View.TODAY,
            View.UPCOMING,
            View.ALL
        ];

        let visibleTasks = this.getVisibleTasks();

        if (activeViews.includes(this.currentView)) {

            visibleTasks =
                this.taskService.includeCompletedDescendants(
                    visibleTasks
                );

        }

        if (this.currentView !== View.PROJECT) {

            visibleTasks = filterTaskTreeByCriteria(
                visibleTasks,
                {
                    query: this.searchQuery,
                    filters: this.taskFilters,
                    today: this.getTodayString()
                }
            );

            visibleTasks = sortTaskTree(
                visibleTasks,
                this.taskSort
            );

        }

        const bulkModes = {
            [View.INBOX]: "ACTIVE",
            [View.TODAY]: "ACTIVE",
            [View.UPCOMING]: "ACTIVE",
            [View.ALL]: "ACTIVE",
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
            createSyncFingerprint(
                this.backupService.createBackup()
            );

        this.mainView.render({

            view: this.currentView,
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
            selectedTask: this.selectedTask,
            areas: this.areaService.getAllAreas(),
            contexts: this.contextService.getAllContexts(),
            tags: this.tagService.getAllTags()

        });

    }

}
