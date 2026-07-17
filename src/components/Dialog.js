export class Dialog {

    static prompt(title, defaultValue = "") {

        const value = prompt(title, defaultValue);

        if (value === null) {
            return null;
        }

        return value.trim();

    }

    static confirm(message) {

        return confirm(message);

    }

    static alert(message) {

        alert(message);

    }

}