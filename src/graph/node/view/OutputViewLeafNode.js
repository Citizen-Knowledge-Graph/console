import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class OutputViewLeafNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.ANY ], [], TYPE.VIEW_LEAF)
    }

    instantShowValue(value, mode) {
        this.codeMirror.setOption("mode", mode)
        this.setValue(value)
    }

    isReadyToRun() { return false }
    // run() should not be called because isReadyToRun() is always false, but better make sure
    run() {}
}
