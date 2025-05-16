import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"
import { Parser } from "../../../assets/bundle.js"

export class TurtleInputNode extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [], [ PORT.TURTLE ], TYPE.INPUT)
    }

    inputNodePreRun() {
        this.testParseTurtle()
            .then()
            .catch(err => this.handleError(err))
    }

    testParseTurtle() {
        return new Promise((resolve, reject) => {
            const parser = new Parser()
            parser.parse(this.getValue(), (error, quad) => {
                if (error) {
                    reject(error)
                } else if (!quad) {
                    resolve()
                }
            })
        })
    }
}
