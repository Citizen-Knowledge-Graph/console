import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class MultiplexerLogicNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.ANY, PORT.ANY ], [ PORT.ANY ], TYPE.LOGIC)
        this.input1previous = ""
        this.input2previous = ""
        this.lastChoice = 0
    }

    enoughIncomingDataAvailable() {
        return this.hasAsMuchIncomingDataAvailableAsIncomingEdges()
    }

    async processIncomingData() {
        let type = this.incomingData[0].dataType
        let mode = "text/plain"
        if (type === PORT.SPARQL) mode = "sparql"
        if (type === PORT.TURTLE) mode = "turtle"
        this.codeMirror.setOption("mode", mode)

        let input1 = this.incomingData[0].data
        if (this.incomingData.length === 1 || this.input1previous !== input1) {
            this.input1previous = input1
            this.lastChoice = 0
            return input1
        }
        let input2 = this.incomingData[1].data
        if (this.input2previous !== input2) {
            this.input2previous = input2
            this.lastChoice = 1
            return input2
        }
        return this.lastChoice === 0 ? input1 : input2
    }
}
