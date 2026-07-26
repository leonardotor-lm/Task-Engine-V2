export const AutomaticSyncAction =
    Object.freeze({
        NONE: "NONE",
        PUSH: "PUSH",
        PULL: "PULL",
        CONFLICT: "CONFLICT"
    });

export function getAutomaticSyncAction({
    configured,
    remoteChecked,
    localPending,
    remoteUpdateAvailable,
    inProgress
}) {

    if (
        !configured ||
        !remoteChecked ||
        inProgress
    ) {
        return AutomaticSyncAction.NONE;
    }

    if (
        localPending &&
        remoteUpdateAvailable
    ) {
        return AutomaticSyncAction.CONFLICT;
    }

    if (remoteUpdateAvailable) {
        return AutomaticSyncAction.PULL;
    }

    if (localPending) {
        return AutomaticSyncAction.PUSH;
    }

    return AutomaticSyncAction.NONE;

}
