const AI_ENABLED_STORAGE_KEY = "task-engine-v2-ai-enabled";
const AI_MODEL_STORAGE_KEY = "task-engine-v2-ai-model";

export const AI_MODELS = Object.freeze([
    {
        id: "gemini-3.5-flash-lite",
        label: "Rápido",
        description: "Menor latencia y costo; recomendado para consultas cotidianas."
    },
    {
        id: "gemini-3.7-flash",
        label: "Potente",
        description: "Más capacidad para análisis complejos."
    }
]);

export const DEFAULT_AI_MODEL = "gemini-3.5-flash-lite";

export class AiPreferences {
    constructor(storage = localStorage) {
        this.storage = storage;
    }

    isEnabled() {
        return this.storage.getItem(AI_ENABLED_STORAGE_KEY) === "true";
    }

    setEnabled(enabled) {
        const normalized = enabled === true;
        this.storage.setItem(AI_ENABLED_STORAGE_KEY, String(normalized));
        return normalized;
    }

    getModel() {
        const stored = String(this.storage.getItem(AI_MODEL_STORAGE_KEY) || "").trim();
        return AI_MODELS.some(model => model.id === stored)
            ? stored
            : DEFAULT_AI_MODEL;
    }

    setModel(modelId) {
        const normalized = String(modelId || "").trim();
        if (!AI_MODELS.some(model => model.id === normalized)) {
            return this.getModel();
        }
        this.storage.setItem(AI_MODEL_STORAGE_KEY, normalized);
        return normalized;
    }
}
