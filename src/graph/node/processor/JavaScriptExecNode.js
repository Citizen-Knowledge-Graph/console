import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { newStore, addTripleToStore, storeToTurtle } from "../../../assets/bundle.js"

export class JavaScriptExecNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.ANY, PORT.JAVASCRIPT ], [ PORT.ANY ], TYPE.PROCESSOR)
    }

    async processIncomingData() {
        try {
            let js = this.incomingData.filter(port => port.dataType === PORT.JAVASCRIPT)[0].data
            let input = this.incomingData.filter(port => port.dataType !== PORT.JAVASCRIPT)[0].data
            // support multiple input ports TODO
            // tell user that input is available as "input" variable TODO
            const execute = new Function("input", "newStore", "addTripleToStore", "storeToTurtle", js)
            return execute(input, newStore, addTripleToStore, storeToTurtle)
        } catch (err) {
            return this.handleError(err.message)
        }
    }
}
