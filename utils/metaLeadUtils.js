
export const fetchAllLeads = async (url) => {
  let allLeads = [];
  let nextUrl = url;

  while (nextUrl) {
    try {
        // Makes a request to the current page URL
        // Parses the JSON response
      const response = await fetch(nextUrl);
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      allLeads = [...allLeads, ...result.data]; //Combines the current page’s leads into the master array allLeads
      nextUrl = result.paging?.next || null; // Handle Pagination

    //   Small delay (200ms) between requests to avoid hitting Meta rate limits
      if (nextUrl) await new Promise(res => setTimeout(res, 200));
    } catch (error) {
      console.error('fetchAllLeads error:', error.message);
      throw error;
    }
  }

//   Returns the complete list of leads once all pages are fetched
  return allLeads;
};
