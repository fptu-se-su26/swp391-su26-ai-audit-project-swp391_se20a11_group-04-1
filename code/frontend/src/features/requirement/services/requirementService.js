import { requirementApi } from './requirementApi';

/**
 * requirementService – higher-level wrapper around requirementApi.
 * Used by components that need simple, project-scoped helpers.
 */
export const requirementService = {
  /**
   * Fetch all requirements for a given project.
   * Backend returns paginated: { items: [...], currentPage, totalItems, ... }
   * @param {string|number} projectId
   * @returns {Promise<Array>}
   */
  getRequirements: async (projectId) => {
    const result = await requirementApi.getAllRequirements({ projectId, size: 200 });
    // Paginated response { items: [...] }
    if (result && Array.isArray(result.items)) return result.items;
    // Plain array fallback
    if (Array.isArray(result)) return result;
    return [];
  },

  getRequirementById: async (id) => {
    return requirementApi.getRequirementById(id);
  },

  createRequirement: async (data) => {
    return requirementApi.createRequirement(data);
  },

  updateRequirement: async (id, data) => {
    return requirementApi.updateRequirement(id, data);
  },

  deleteRequirement: async (id) => {
    return requirementApi.deleteRequirement(id);
  },
};
