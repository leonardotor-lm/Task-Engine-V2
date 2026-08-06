export const ATTACHMENT_SEARCH_REFERENCE_HTML = `
    <p data-attachment-search-reference="true">
        <strong>Adjuntos:</strong>
        tieneAdjuntos (sí/no), adjunto (nombre o tipo de archivo).
    </p>
`;

export function bindAttachmentSearchReference(app) {

    const view = app.mainView;
    const originalRender = view.render.bind(view);

    view.render = state => {

        originalRender(state);

        const reference = document.querySelector(
            ".advancedSearchReference"
        );

        if (
            !reference ||
            reference.querySelector(
                "[data-attachment-search-reference]"
            )
        ) {
            return;
        }

        reference.insertAdjacentHTML(
            "beforeend",
            ATTACHMENT_SEARCH_REFERENCE_HTML
        );

    };

}
