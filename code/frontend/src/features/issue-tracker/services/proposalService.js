import axiosInstance from '@/api/axiosConfig'

/**
 * Proposal & Discussion Service
 * Connects to the Task Proposal API for collaborative checklist discussions.
 *
 * API Base: /api/v1
 */
export const proposalService = {
  /**
   * Fetch all proposals for a task.
   * GET /v1/tasks/{taskId}/proposals
   */
  getProposals: async (taskId) => {
    const res = await axiosInstance.get(`/v1/tasks/${taskId}/proposals`)
    return res.data.data
  },

  /**
   * Submit a new proposal for a task.
   * POST /v1/tasks/{taskId}/proposals
   * Body: { content: string }
   */
  createProposal: async (taskId, content) => {
    const res = await axiosInstance.post(`/v1/tasks/${taskId}/proposals`, { content })
    return res.data.data
  },

  /**
   * Vote on a proposal (upvote or downvote). Toggles if already voted same way.
   * POST /v1/proposals/{proposalId}/vote
   * Body: { upvote: boolean }
   */
  vote: async (proposalId, isUpvote) => {
    const res = await axiosInstance.post(`/v1/proposals/${proposalId}/vote`, { upvote: isUpvote })
    return res.data.data
  },

  /**
   * Add a comment reply to a proposal.
   * POST /v1/proposals/{proposalId}/comments
   * Body: { content: string }
   */
  addComment: async (proposalId, content) => {
    const res = await axiosInstance.post(`/v1/proposals/${proposalId}/comments`, { content })
    return res.data.data
  },

  /**
   * Leader approves a proposal → automatically added to task checklist.
   * PATCH /v1/proposals/{proposalId}/approve
   */
  approve: async (proposalId) => {
    const res = await axiosInstance.patch(`/v1/proposals/${proposalId}/approve`)
    return res.data.data
  },

  /**
   * Leader rejects a proposal.
   * PATCH /v1/proposals/{proposalId}/reject
   */
  reject: async (proposalId) => {
    const res = await axiosInstance.patch(`/v1/proposals/${proposalId}/reject`)
    return res.data.data
  },

  /**
   * Update a proposal content (description & checklist).
   * PUT /v1/proposals/{proposalId}
   */
  updateProposal: async (proposalId, content) => {
    const res = await axiosInstance.put(`/v1/proposals/${proposalId}`, { content })
    return res.data.data
  },

  /**
   * Fetch all direct general comments for a task.
   */
  getTaskComments: async (taskId) => {
    const res = await axiosInstance.get(`/v1/tasks/${taskId}/comments`)
    return res.data.data
  },

  /**
   * Add a direct general comment to a task.
   */
  addTaskComment: async (taskId, content) => {
    const res = await axiosInstance.post(`/v1/tasks/${taskId}/comments`, { content })
    return res.data.data
  },

  /**
   * Vote on a direct task comment (upvote/downvote).
   */
  voteTaskComment: async (commentId, isUpvote) => {
    const res = await axiosInstance.post(`/v1/comments/${commentId}/vote`, { upvote: isUpvote })
    return res.data.data
  },

  /**
   * Add a nested reply to a direct task comment.
   */
  addCommentReply: async (commentId, content) => {
    const res = await axiosInstance.post(`/v1/comments/${commentId}/replies`, { content })
    return res.data.data
  },

  /**
   * Fetch overall vote stats for the task proposal.
   */
  getTaskVotes: async (taskId) => {
    const res = await axiosInstance.get(`/v1/tasks/${taskId}/votes`)
    return res.data.data
  },

  /**
   * Vote on the overall task proposal.
   */
  voteTask: async (taskId, isUpvote) => {
    const res = await axiosInstance.post(`/v1/tasks/${taskId}/vote`, { upvote: isUpvote })
    return res.data.data
  }
}

export default proposalService
