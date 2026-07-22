import { Priority } from "../domain/Priority.js";

export const PriorityOptions = [

    {
        value: Priority.NONE,
        label: "Sin prioridad"
    },

    {
        value: Priority.LOW,
        label: "Baja"
    },

    {
        value: Priority.MEDIUM,
        label: "Media"
    },

    {
        value: Priority.HIGH,
        label: "Alta"
    },

    {
        value: Priority.CRITICAL,
        label: "Crítica"
    }

];
