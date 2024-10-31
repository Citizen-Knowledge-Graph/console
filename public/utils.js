async function fetchAsset(relPath) {
    const response = await fetch("assets/" + relPath, {
        method: "GET",
        cache: "reload"
    })
    return await response.text()
}
