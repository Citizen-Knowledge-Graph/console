import { Node } from "../Node.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class ShaclWizardNode extends Node {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.TURTLE ], [ PORT.TURTLE ], TYPE.EDIT)
    }

    getMainHtml() {
        return `<div class="shacl-wizard-container">TODO</div>`
    }

    postConstructor() {
        super.postConstructor()
        this.assignTitlesToPorts("input", ["datafield definitions"])
        this.assignTitlesToPorts("output", ["SHACL shapes"])
        let container = this.nodeDiv.querySelector(".shacl-wizard-container")
        container.style.cursor = "default"
        container.addEventListener("mousedown", event => event.stopPropagation())
    }
}
