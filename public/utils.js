async function fetchAsset(relPath) {
    const response = await fetch("assets/" + relPath, {
        method: "GET",
        cache: "reload"
    })
    return await response.text()
}

// type: "text/turtle"
async function download(content, type, filename) {
    let blob = new Blob([content], {type: type})
    let url = URL.createObjectURL(blob)
    let a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
}
