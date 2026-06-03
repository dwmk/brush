(async () => {
    console.log("🚀 Starting API traversal...");

    const baseUrl = "https://boracle.app/api/materials";
    let currentCursor = ""; 
    let allItems = [];
    let pageCount = 0;
    let hasMore = true;

    while (hasMore) {
        pageCount++;
        // Construct the paginated URL
        const url = currentCursor 
            ? `${baseUrl}?cursor=${currentCursor}` 
            : baseUrl;

        try {
            console.log(`📦 Fetching Page ${pageCount}... [Cursor: ${currentCursor || 'Initial'}]`);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.items && data.items.length > 0) {
                allItems = allItems.concat(data.items);
                console.log(`✅ Retrieved ${data.items.length} items (Total collected: ${allItems.length})`);
            } else {
                console.log("ℹ️ No items returned in this batch.");
            }

            // Check if a valid next cursor exists and is different from the current one
            if (data.nextCursor && data.nextCursor !== currentCursor) {
                currentCursor = data.nextCursor;
            } else {
                hasMore = false; // Stop looping if nextCursor is null, undefined, or unchanged
            }

            // Polite delay to protect client-side tracking limits / rate-limiting thresholds
            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
            console.error(`❌ Error fetching data on Page ${pageCount}:`, error);
            hasMore = false; // Terminate execution gracefully on error
        }
    }

    console.log(`🎉 Completed! Extracted a total of ${allItems.length} records.`);

    if (allItems.length > 0) {
        // Automatically download the aggregated JSON dataset
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allItems, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "boracle_all_materials_api.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        console.log("💾 Download triggered successfully.");
    } else {
        console.warn("⚠️ No data was collected, skipping download.");
    }
})();