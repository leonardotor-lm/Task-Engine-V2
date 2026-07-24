import { Config } from "./Config.js";
import { TaskService } from "./TaskService.js";
import { AreaService } from "./AreaService.js";
import { ContextService } from "./ContextService.js";
import { TagService } from "./TagService.js";
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

export class App {

    constructor() {

        this.taskService = new TaskService();
        this.areaService = new AreaService();
        this.contextService = new ContextService();
        this.tagService = new TagService();

        this.selectedTask = null;
        this.currentView = View.INBOX;
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

        this.mainView = new MainView({

            onCreateTask: (title) => {

                this.taskService.createTask({ title });

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

                this.selectedTask = this.taskService.getTaskById(id);

                this.render();

            },

            onToggleTask: (id) => {

                this.taskService.toggleTask(id);

                this.selectedTask = null;

                this.render();

            },

            onPostponeTask: (id, newDate) => {

                this.taskService.postponeTask(id, newDate);

                this.selectedTask =
                    this.taskService.getTaskById(id);

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

                this.selectedTask = this.taskService.getTaskById(id);

                this.render();

            },

            onCreateArea: (name, color) => {

                this.areaService.createArea({ name, color });

                this.render();

            },

            onUpdateArea: (id, name) => {

                this.areaService.updateArea(id, { name });

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

            onUpdateContext: (id, name) => {

                this.contextService.updateContext(id, { name });

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

            onUpdateTag: (id, name) => {

                this.tagService.updateTag(id, { name });
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

        this.mainView.render({

            view: this.currentView,
            tasks: visibleTasks,
            allTasks: this.taskService.getAllTasks(),
            expandedTaskIds: this.expandedTaskIds,
            searchQuery: this.searchQuery,
            taskFilters: this.taskFilters,
            filtersActive: hasActiveTaskFilters(
                this.taskFilters
            ),
            taskSort: this.taskSort,
            selectedTask: this.selectedTask,
            areas: this.areaService.getAllAreas(),
            contexts: this.contextService.getAllContexts(),
            tags: this.tagService.getAllTags()

        });

    }

}