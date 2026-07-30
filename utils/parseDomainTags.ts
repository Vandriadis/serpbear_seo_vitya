/**
 * Parse domain tags from DB JSON string or array into a clean string[].
 */
const parseDomainTags = (tags: unknown): string[] => {
   if (Array.isArray(tags)) {
      return tags.map((t) => String(t).trim()).filter(Boolean);
   }
   if (typeof tags === 'string' && tags.trim()) {
      try {
         const parsed = JSON.parse(tags);
         if (Array.isArray(parsed)) {
            return parsed.map((t) => String(t).trim()).filter(Boolean);
         }
      } catch {
         return tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
   }
   return [];
};

export default parseDomainTags;
