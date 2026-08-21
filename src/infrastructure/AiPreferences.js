const AI_ENABLED_STORAGE_KEY = "task-engine-v2-ai-enabled";
const AI_PROVIDER_STORAGE_KEY = "task-engine-v2-ai-provider";
const AI_MODEL_STORAGE_KEY = "task-engine-v2-ai-model";

export const AI_PROVIDERS = Object.freeze([
    {
        id: "gemini",
        label: "Gemini",
        description: "Recomendado para análisis, priorización y asesoramiento sobre tus tareas.",
        defaultModel: "gemini-3.7-flash",
        models: [
            {
                id: "gemini-3.7-flash",
                label: "Recomendado",
                description: "Mayor capacidad para análisis semántico y decisiones complejas."
            },
            {
                id: "gemini-3.5-flash-lite",
                label: "Rápido",
                description: "Modelo ligero para consultas más simples."
            }
        ]
    },
    {
        id: "groq",
        label: "Groq",
        description: "Alternativa rápida con plan gratuito; útil para consultas simples.",
        defaultModel: "openai/gpt-oss-20b",
        models: [
            {
                id: "openai/gpt-oss-20b",
                label: "Rápido",
                description: "Menor latencia para consultas sencillas."
            },
            {
                id: "openai/gpt-oss-120b",
                label: "Potente",
                description: "Más capacidad que 20B para análisis complejos."
            }
        ]
    }
]);

export const DEFAULT_AI_PROVIDER = "gemini";
export const DEFAULT_AI_MODEL = "gemini-3.7-flash";

function getProviderDefinition(providerId) {
    return AI_PROVIDERS.find(provider => provider.id === providerId) ||
        AI_PROVIDERS.find(provider => provider.id === DEFAULT_AI_PROVIDER);
}

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

    getProvider() {
        const stored = String(
            this.storage.getItem(AI_PROVIDER_STORAGE_KEY) || ""
        ).trim();

        return AI_PROVIDERS.some(provider => provider.id === stored)
            ? stored
            : DEFAULT_AI_PROVIDER;
    }

    setProvider(providerId) {
        const normalized = String(providerId || "").trim();
        if (!AI_PROVIDERS.some(provider => provider.id === normalized)) {
            return this.getProvider();
        }

        this.storage.setItem(AI_PROVIDER_STORAGE_KEY, normalized);
        const provider = getProviderDefinition(normalized);
        const currentModel = String(
            this.storage.getItem(AI_MODEL_STORAGE_KEY) || ""
        ).trim();

        if (!provider.models.some(model => model.id === currentModel)) {
            this.storage.setItem(AI_MODEL_STORAGE_KEY, provider.defaultModel);
        }

        return normalized;
    }

    getModel() {
        const provider = getProviderDefinition(this.getProvider());
        const stored = String(
            this.storage.getItem(AI_MODEL_STORAGE_KEY) || ""
        ).trim();

        return provider.models.some(model => model.id === stored)
            ? stored
            : provider.defaultModel;
    }

    setModel(modelId) {
        const provider = getProviderDefinition(this.getProvider());
        const normalized = String(modelId || "").trim();
        if (!provider.models.some(model => model.id === normalized)) {
            return this.getModel();
        }
        this.storage.setItem(AI_MODEL_STORAGE_KEY, normalized);
        return normalized;
    }
}
