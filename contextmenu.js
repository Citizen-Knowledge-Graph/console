// Adapted from ChatGPT

const canvasCtxMenuItems = [
    {
        label: "Input",
        submenu: [
            /*{
                label: "Prefixes", action: "PrefixesNode",
                submenu: [
                    { label: "Example: Prefixes", action: "ex_PrefixesNode_ff" }
                ]
            },*/
            {
                label: "Turtle Input", action: "TurtleInputNode",
                submenu: [
                    { label: "Example: User profile", action: "ex_TurtleInputNode_UP" },
                    { label: "Example: Requirement profile 1", action: "ex_TurtleInputNode_RP1" },
                    { label: "Example: Requirement profile 2", action: "ex_TurtleInputNode_RP2" },
                ]
            },
            { label: "SPARQL Input", action: "SparqlInputNode",
                submenu: [
                    { label: "Example: Materialization rule", action: "ex_SparqlInputNode_MatRule" },
                    { label: "Example: Select", action: "ex_SparqlInputNode_Select" },
                    { label: "Example: Insert Data", action: "ex_SparqlInputNode_InsertData" },
                    { label: "Example: Delete / Insert", action: "ex_SparqlInputNode_DeleteInsert" },
                ]
            },
            { label: "External Turtle Files", action: "ExternalTurtleFilesInputNode" },
            { label: "External SPARQL Endpoint", action: "ExternalSparqlEndpointInputNode" },
            { label: "JavaScript Input", action: "JavaScriptInputNode" },
            // { label: "Output Viewer with initial input", action: "OutputViewNodeWithInitialInput" },
        ]
    },
    {
        label: "Processors",
        submenu: [
            { label: "Merge triples", action: "MergeTriplesNode" },
            { label: "Run SPARQL SELECT", action: "SparqlSelectExecNode" },
            { label: "Run SPARQL CONSTRUCT", action: "SparqlConstructExecNode" },
            { label: "Run SPARQL INSERT/DELETE", action: "SparqlInsertDeleteExecNode" },
            { label: "Run SHACL validation", action: "ShaclValidationNode" },
            { label: "Run JavaScript", action: "JavaScriptExecNode" },
        ]
    },
    {
        label: "View",
        submenu: [
            { label: "Output Viewer", action: "OutputViewNode" },
            { label: "Markdown Editor/Viewer", action: "MarkdownNode" },
            { label: "Graph Visualizer", action: "GraphVisuNode" },
        ]
    },
    {
        label: "experimental",
        submenu: [
            { label: "SHACL Form Editor", action: "ShaclFormNode" },
            { label: "SHACL Quiz-Form Editor", action: "ShaclQuizFormNode" },
            { label: "SHACL Wizard", action: "ShaclWizardNode" },
            { label: "Output Viewer (only live-view)", action: "OutputViewLeafNode" },
            { label: "Table output Viewer (only live-view)", action: "OutputViewTableLeafNode" },
            // { label: "Turtle Input with copy-paste in-port", action: "TurtleInputNodeWithCopyPasteInPort" },
            // { label: "shacl-form lib Editor (dev)", action: "ShaclFormLibNode" }
        ]
    },
    /*{
        label: "Logic",
        submenu: [
            { label: "Multiplexer (dev)", action: "MultiplexerLogicNode" },
        ]
    }*/
]

const nodeHeaderCtxMenuItems = [
    // { label: "Toggle View Mode", action: "ToggleViewModeAction" },
    { label: "Rename", action: "RenameAction" },
    { label: "Hide Content", action: "HideContentAction" },
    { label: "Delete Node", action: "DeleteNodeAction" },
    { label: "Duplicate Node", action: "DuplicateNodeAction",
        submenu: [
            { label: "including incoming Edges", action: "DuplicateNodeWithIncomingEdgesAction" }
        ]
    },
    { label: "Add input port", action: "AddInputPortAction", onlyVisibleFor: [ "MergeTriplesNode", "ShaclQuizFormNode" ] },
    { label: "Save current as initial value", action: "SaveInitialValueAction", onlyVisibleFor: [ "TurtleInputNodeWithCopyPasteInPort" ] },
    { label: "Info", action: "InfoAction", onlyVisibleFor: [ "ExternalTurtleFilesInputNode", "ExternalSparqlEndpointInputNode" ] },
]

const multipleNodesHeaderCtxMenuItems = (count) => {
    let processorsSubmenu = canvasCtxMenuItems[1].submenu
    let wireIntoNewNodeSubmenu = processorsSubmenu.map(item => {
        return { label: item.label, action: "WireIntoNew_" + item.action }
    })
    return [
        { label: `Action on ${count} Nodes` },
        { label: "Hide Content of Nodes", action: "MultipleHideContentAction" },
        { label: "Copy subgraph as shareable link", action: "SubgraphBase64" },
        { label: "Wire these into a new processor node", submenu: wireIntoNewNodeSubmenu },
        { label: "Delete Nodes", action: "MultipleDeleteNodeAction" },
        {
            label: "Duplicate Nodes", action: "MultipleDuplicateNodeAction",
            submenu: [
                { label: "including Edges", action: "MultipleDuplicateNodeWithEdgesAction" }
            ]
        }
    ]
}

function buildMenu(items, nodeType, disabledItems) {
    return items.map(item => {
        if (nodeType && item.onlyVisibleFor && !item.onlyVisibleFor.includes(nodeType)) return ""
        let hasSub = item.submenu && item.submenu.length > 0
        let actionAttr = item.action ? ' data-action="' + item.action + '" ' : ''
        let labelAttr = ' data-label="' + item.label + '" '
        let classes = []
        if (disabledItems.includes(item.action)) classes.push("disabled")
        if (hasSub) {
            classes.push("sub")
            let classAttr = ' class="' + classes.join(" ") + '"'
            return '<div' + classAttr + actionAttr + labelAttr + '>' +
                item.label + ' &#8250;' +
                '<div class="submenu">' + buildMenu(item.submenu, nodeType, disabledItems) + '</div>' +
                '</div>'
        } else {
            if (!item.action) classes.push("no-action-menu-item")
            let classAttr = classes.length > 0 ? ' class="' + classes.join(" ") + '"' : ''
            return '<div' + classAttr + actionAttr + labelAttr + '>' + item.label + '</div>'
        }
    }).join("")
}

export function setupCanvasContextMenu(event, disabledItems, callback) {
    setupContextMenu(event, canvasCtxMenuItems, null, disabledItems, callback)
}

export function setupNodeHeaderContextMenu(event, nodeType, disabledItems, callback) {
    setupContextMenu(event, nodeHeaderCtxMenuItems, nodeType, disabledItems, callback)
}

export function setupMultipleNodesHeaderContextMenu(event, nodesCount, disabledItems, callback) {
    setupContextMenu(event, multipleNodesHeaderCtxMenuItems(nodesCount), null, disabledItems, callback)
}

export function setupContextMenu(event, menuItems, nodeType, disabledItems, callback) {
    if (document.getElementById("ctx-menu")) return
    event.preventDefault()
    let menu = document.createElement("div")
    menu.id = "ctx-menu"
    const del = () => {
        menu.remove()
        document.removeEventListener("click", clickHandler)
    }
    const clickHandler = e => del()
    menu.innerHTML = buildMenu(menuItems, nodeType, disabledItems)
    menu.pos = { x: event.pageX, y: event.pageY }
    menu.style.left = event.pageX + "px"
    menu.style.top = event.pageY + "px"
    menu.addEventListener("click", e => {
        let action = e.target.getAttribute("data-action")
        let label = e.target.getAttribute("data-label")
        if (action && !disabledItems.includes(action)) callback(action, label, menu.pos.x, menu.pos.y)
        del(menu)
    })
    document.body.appendChild(menu)
    document.addEventListener("click", clickHandler)
}
