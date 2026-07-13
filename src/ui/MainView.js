export class MainView {

    render() {

        console.log("Render principal");

        const app = document.getElementById("app");

        app.innerHTML = `
            <h2>La aplicación se inició correctamente.</h2>
            <p>Bienvenido a Task Engine V2.</p>
        `;

    }

}
