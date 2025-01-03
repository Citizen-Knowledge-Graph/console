// Adapted from ChatGPT

const canvasCtxMenuItems = [
    {
        label: "Input",
        submenu: [
            {
                label: "Prefixes", action: "PrefixesNode",
                submenu: [
                    { label: "Example: Prefixes", action: "ex_PrefixesNode_ff" }
                ]
            },
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
        ]
    },
    {
        label: "View",
        submenu: [
            { label: "Output Viewer", action: "OutputViewNode" },
            { label: "Output Viewer (no out-port)", action: "OutputViewLeafNode" }
        ]
    },
    {
        label: "Edit",
        submenu: [
            { label: "SHACL Form Editor (dev)", action: "ShaclFormNode" },
            { label: "shacl-form lib Editor (dev)", action: "ShaclFormLibNode" }
        ]
    }
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
    { label: "Add input port", action: "AddInputPortAction" }
]

const multipleNodesHeaderCtxMenuItems = (count) => {
    return [
        { label: `Action on ${count} Nodes` },
        { label: "Hide Content of Nodes", action: "MultipleHideContentAction" },
        { label: "Copy subgraph as shareable link", action: "SubgraphBase64" },
        { label: "Delete Nodes", action: "MultipleDeleteNodeAction" },
        {
            label: "Duplicate Nodes", action: "MultipleDuplicateNodeAction",
            submenu: [
                { label: "including Edges", action: "MultipleDuplicateNodeWithEdgesAction" }
            ]
        }
    ]
}

function buildMenu(items, disabledItems) {
    return items.map(item => {
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
                '<div class="submenu">' + buildMenu(item.submenu, disabledItems) + '</div>' +
                '</div>'
        } else {
            if (!item.action) classes.push("no-action-menu-item")
            let classAttr = classes.length > 0 ? ' class="' + classes.join(" ") + '"' : ''
            return '<div' + classAttr + actionAttr + labelAttr + '>' + item.label + '</div>'
        }
    }).join("")
}

export function setupCanvasContextMenu(event, disabledItems, callback) {
    setupContextMenu(event, canvasCtxMenuItems, disabledItems, callback)
}

export function setupNodeHeaderContextMenu(event, disabledItems, callback) {
    setupContextMenu(event, nodeHeaderCtxMenuItems, disabledItems, callback)
}

export function setupMultipleNodesHeaderContextMenu(event, nodesCount, disabledItems, callback) {
    setupContextMenu(event, multipleNodesHeaderCtxMenuItems(nodesCount), disabledItems, callback)
}

export function setupContextMenu(event, menuItems, disabledItems, callback) {
    if (document.getElementById("ctx-menu")) return
    event.preventDefault()
    let menu = document.createElement("div")
    menu.id = "ctx-menu"
    const del = () => {
        menu.remove()
        document.removeEventListener("click", clickHandler)
    }
    const clickHandler = e => del()
    menu.innerHTML = buildMenu(menuItems, disabledItems)
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
