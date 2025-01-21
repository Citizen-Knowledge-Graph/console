import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { Store } from "../../../assets/bundle.js"
import { addRdfStringToStore, serializeStoreToTurtle } from "../../../utils.js"

export class ExternalTurtleFilesInputNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [], [ PORT.TURTLE ], TYPE.INPUT)
        this.value = ""
    }

    getValue() {
        return this.value
    }

    getValueForExport() {
        return this.codeMirror.getValue()
    }

    getInfo() {
        return `Each line must point to an external Turtle file.<br>If multiple lines are provided, all Turtle files<br>will be fetched and their contents merged.`
    }

    async inputNodePreRun() {
        try {
            let sources = this.codeMirror.getValue().split(/\r?\n/).filter(line => line.trim() !== "")
            if (sources.length === 1) {
                let response = await fetch(sources[0])
                this.value = await response.text()
            }
            if (sources.length > 1) {
                let store = new Store()
                for (let source of sources) {
                    let response = await fetch(source)
                    await addRdfStringToStore(await response.text(), store)
                }
                this.value = await serializeStoreToTurtle(store)
            }
        } catch (err) {
            return this.handleError(err.message)
        }
    }
}
