import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../nodeFactory.js"
import { Store } from "../../assets/bundle.js"
import { addRdfStringToStore, serializeStoreToTurtle } from "../../utils.js"

export class MergeTriplesNode extends CodeNode {
    constructor(name, x, y, editor, nodesMap) {
        super(name, [ PORT.TURTLE, PORT.TURTLE ], [ PORT.TURTLE ], x, y, editor, nodesMap, TYPE.PROCESSOR)
        super.initCodemirror("turtle")
    }

    getBottomMenuHtml() {
        return `<div class="bottom-menu"><div class="add-input">Add input port</div></div>`
    }

    postRender() {
        super.postRender()
        document.getElementById("node-" + this.id).querySelector(".add-input").addEventListener("click", () => this.addInputPort())
    }

    async processIncomingData() {
        let store = new Store()
        for (let port of this.incomingData) {
            await addRdfStringToStore(port.data, store)
        }
        return await serializeStoreToTurtle(store)
    }

    addInputPort() {
        super.addInputPortOfType(PORT.TURTLE)
    }
}
