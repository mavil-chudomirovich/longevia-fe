export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  USERS: {
    ME: '/users/me',
    HEALTH_PROFILE: '/users/me/health-profile',
    DIET_PREFERENCES: '/users/me/diet-preferences',
    DIET_SCHEDULE: '/users/me/diet-schedule',
  },
  DIET_RULES: {
    PREVIEW: '/diet-rules/preview',
  },
  CATEGORIES: {
    TREE: '/categories',
  },
  INGREDIENTS: {
    LIST: '/ingredients',
    RESOLVE: '/ingredients/resolve',
  },
  ADMIN_CATALOG: {
    CATEGORIES: {
      LIST: '/admin/categories',
      CREATE: '/admin/categories',
      UPDATE: (id: string) => `/admin/categories/${id}`,
      ARCHIVE: (id: string) => `/admin/categories/${id}`,
    },
    INGREDIENTS: {
      LIST: '/admin/ingredients',
      CREATE: '/admin/ingredients',
      UPDATE: (id: string) => `/admin/ingredients/${id}`,
      ARCHIVE: (id: string) => `/admin/ingredients/${id}`,
      ALIASES: (id: string) => `/admin/ingredients/${id}/aliases`,
      ALIAS: (id: string, aliasId: string) => `/admin/ingredients/${id}/aliases/${aliasId}`,
    },
  },
  FOOD_DATA: {
    NUTRIENTS: (ingredientId: string) => `/food-data/ingredients/${ingredientId}/nutrients`,
    REFERENCE_INTAKES: '/food-data/reference-intakes',
    GUIDELINES: '/food-data/ingredient-guidelines',
    COOKING_METHODS: '/food-data/cooking-methods',
    INTERACTIONS: '/food-data/interaction-rules',
  },
  ADMIN_FOOD_DATA: {
    RECORDS: '/admin/food-data/records',
    RECORD: (id: string) => `/admin/food-data/records/${id}`,
    IMPORT_PREVIEW: '/admin/food-data/imports/preview',
    IMPORT_COMMIT: '/admin/food-data/imports',
  },
  POSTS: {
    LIST: '/posts',
    DETAIL: (idOrSlug: string) => `/posts/${idOrSlug}`,
    CREATE: '/posts',
    UPDATE: (id: string) => `/posts/${id}`,
    DELETE: (id: string) => `/posts/${id}`,
    RELATED: (id: string) => `/posts/${id}/related`,
  },
  UPLOADS: {
    /** @deprecated Backend Phase 15 removed signature in favor of reservations */
    SIGNATURE: '/uploads/signature',
    RESERVATIONS: '/uploads/reservations',
    COMMIT: (id: string) => `/uploads/reservations/${id}/commit`,
    RELEASE: (id: string) => `/uploads/reservations/${id}`,
  },
  STORAGE: {
    ME: '/storage/me',
    ASSET: (id: string) => `/storage/assets/${id}`,
  },
  ADMIN_STORAGE: {
    ACCOUNTS: '/admin/storage/accounts',
    POLICIES: '/admin/storage/policies',
    POLICY: (id: string) => `/admin/storage/policies/${id}`,
    ADJUSTMENTS: '/admin/storage/adjustments',
    ACCOUNT_ADJUSTMENTS: (userId: string) => `/admin/storage/accounts/${userId}/adjustments`,
  },
  CONTENT_REVIEW: {
    SUBMIT: (postId: string) => `/posts/${postId}/submit`,
    HISTORY: (postId: string) => `/posts/${postId}/review-history`,
  },
  ADMIN_CONTENT_REVIEW: {
    LIST: '/admin/content-review',
    DETAIL: (revisionId: string) => `/admin/content-review/${revisionId}`,
    DECISION: (revisionId: string) => `/admin/content-review/${revisionId}`,
  },
  /** @deprecated Backend Phase 16 deprecated in favor of ADMIN_CONTENT_REVIEW */
  REVIEW_QUEUE: {
    LIST: '/review-queue/posts',
    APPROVE: (id: string) => `/review-queue/posts/${id}/approve`,
    REJECT: (id: string) => `/review-queue/posts/${id}/reject`,
  },
  MEAL_PLANS: {
    GENERATE: '/meal-plans/generate',
    LIST: '/meal-plans',
    DETAIL: (id: string) => `/meal-plans/${id}`,
    SWAP: (id: string, itemId: string) => `/meal-plans/${id}/items/${itemId}/swap`,
    MANUAL_ADD: (id: string, itemId: string) => `/meal-plans/${id}/items/${itemId}/manual-add`,
    DELETE: (id: string) => `/meal-plans/${id}`,
    ANALYZE: (id: string) => `/meal-plans/${id}/analyze`,
    ANALYSIS: (id: string) => `/meal-plans/${id}/analysis`,
  },
  CHAT: {
    SESSIONS: '/chat/sessions',
    SESSION_MESSAGES: (id: string) => `/chat/sessions/${id}/messages`,
    MESSAGE_FEEDBACK: (id: string) => `/chat/messages/${id}/feedback`,
  },
  RECOMMENDATIONS: {
    EVENTS: '/behavior-events',
    CONSENT: '/users/me/personalization',
    HOME: '/recommendations/home',
  },
  // BE Phase 06 COMPLETED — Community interactions live (comments, votes, ratings, bookmarks)
  COMMUNITY: {
    COMMENTS: (postId: string) => `/posts/${postId}/comments`,
    COMMENT: (id: string) => `/comments/${id}`,
    SUMMARY: (postId: string) => `/posts/${postId}/community-summary`,
    VOTE: (postId: string) => `/posts/${postId}/vote`,
    RATING: (postId: string) => `/posts/${postId}/rating`,
    BOOKMARK: (postId: string) => `/posts/${postId}/bookmark`,
    MY_BOOKMARKS: '/users/me/bookmarks',
  },
  // BE Phase 08 COMPLETED — Moderation admin live (reports, users, comments)
  MODERATION_ADMIN: {
    REPORTS: '/admin/reports',
    REPORT_RESOLVE: (id: string) => `/admin/reports/${id}/resolve`,
    USERS: '/admin/users',
    USER_STATUS: (id: string) => `/admin/users/${id}/status`,
    COMMENTS: '/admin/comments',
    COMMENT_STATUS: (id: string) => `/admin/comments/${id}/status`,
  },
  // BE Phase 07 COMPLETED — Contributor applications live
  CONTRIBUTOR: {
    APPLY: '/contributor-applications',
    MY_APPLICATIONS: '/contributor-applications/me',
  },
  ADMIN_CONTRIBUTOR: {
    LIST: '/admin/contributor-applications',
    REVIEW: (id: string) => `/admin/contributor-applications/${id}/review`,
    INVITE: '/admin/contributor-invitations',
    REVOKE: (userId: string) => `/admin/contributors/${userId}/revoke`,
  },
  // BE Phase 08 COMPLETED — Trust-safety live (reports, behavior history)
  SAFETY: {
    REPORTS: '/reports',
    BEHAVIOR_HISTORY: '/users/me/behavior-history',
  },
  // Phase 23 — AI Artifacts & Contributor Verification (BE COMPLETED)
  AI_ARTIFACTS: {
    BASE: '/ai-artifacts',
    PUBLIC: '/ai-artifacts/public',
    BY_ID: (id: string) => `/ai-artifacts/${id}`,
    VISIBILITY: (id: string) => `/ai-artifacts/${id}/visibility`,
    SUBMIT: (id: string) => `/ai-artifacts/${id}/submit`,
    VERIFICATIONS: (id: string) => `/ai-artifacts/${id}/verifications`,
  },
  AI_VERIFICATIONS_ADMIN: {
    ACTION: (id: string) => `/admin/ai-verifications/${id}`,
  },
  /** @deprecated Dùng `AI_ARTIFACTS` thay thế từ Phase 23 */
  CHAT_SHARING: {
    SHARE: (id: string) => `/ai-artifacts/${id}/visibility`,
    PUBLIC_LIST: '/ai-artifacts/public',
    VERIFY: (id: string) => `/ai-artifacts/${id}/verifications`,
  },
  // Phase 25 — In-app Notifications (BE READY)
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
  },
  // TODO(BE-READY): Restaurants/location còn PLANNED — 3 nhánh dưới CHƯA được import ở đâu.
  RESTAURANTS: {
    NEARBY: '/restaurants/nearby',
    SEARCH: '/restaurants/search',
    DETAIL: (id: string) => `/restaurants/${id}`,
    SUBMIT: '/restaurants',
  },
  LOCATION: {
    GEOCODE: '/location/geocode',
  },
  ADMIN_RESTAURANTS: {
    QUEUE: '/admin/restaurants',
    LIST: '/admin/restaurants',
    REVIEW: (id: string) => `/admin/restaurants/${id}/review`,
  },
  // Phase 26: Admin AI Governance & Safety (READY)
  AI_GOVERNANCE: {
    HEALTH: '/admin/ai/health',
    METRICS: '/admin/ai/metrics',
    REQUESTS: '/admin/ai/requests',
    FLAGS: '/admin/ai/flags',
    FEATURES: '/admin/ai/features',
    FEATURES_AUDIT: '/admin/ai/features/audit',
    FEATURE_TOGGLE: (feature: string) => `/admin/ai/features/${feature}`,
  },
  // Custom meals Phase 17 — phục vụ món ăn cá nhân (Owner-scoped)
  CUSTOM_MEALS: {
    LIST: '/custom-meals',
    CREATE: '/custom-meals',
    DETAIL: (id: string) => `/custom-meals/${id}`,
    UPDATE: (id: string) => `/custom-meals/${id}`,
    DELETE: (id: string) => `/custom-meals/${id}`,
    ATTACH_PHOTO: (id: string) => `/custom-meals/${id}/photos`,
    REMOVE_PHOTO: (id: string, assetId: string) => `/custom-meals/${id}/photos/${assetId}`,
    REORDER_PHOTOS: (id: string) => `/custom-meals/${id}/photos/order`,
    // Backward compatibility
    ATTACH_MEDIA: (id: string) => `/custom-meals/${id}/photos`,
    DELETE_MEDIA: (id: string, photoId: string) => `/custom-meals/${id}/photos/${photoId}`,
  },
  // TODO(BE-READY): Multi-week Meal Programs Phase 19 — Lộ trình dinh dưỡng nhiều tuần
  MEAL_PROGRAMS: {
    LIST: '/meal-programs',
    CREATE: '/meal-programs',
    DETAIL: (id: string) => `/meal-programs/${id}`,
    UPDATE: (id: string) => `/meal-programs/${id}`,
    REGENERATE_WEEK: (id: string, weekNumber: number) =>
      `/meal-programs/${id}/weeks/${weekNumber}/regenerate`,
    REANALYZE: (id: string) => `/meal-programs/${id}/reanalyze`,
    UPDATE_PROGRESS: (id: string, weekNumber: number) =>
      `/meal-programs/${id}/weeks/${weekNumber}/progress`,
  },
  // Phase 13: Cooking-aware Recipe Nutrition
  RECIPE_NUTRITION: {
    PREVIEW: (id: string) => `/posts/${id}/nutrition/preview`,
    RECALCULATE: (id: string) => `/posts/${id}/nutrition/recalculate`,
    CURRENT: (id: string) => `/posts/${id}/nutrition/current`,
    HISTORY: (id: string) => `/posts/${id}/nutrition/history`,
    STATUS: (id: string) => `/posts/${id}/nutrition/status`,
  },
  // Phase 20: Pantry Inventory Management
  PANTRY: {
    ITEMS: '/pantry/items',
    ITEM_DETAIL: (id: string) => `/pantry/items/${id}`,
    EXPIRING_SOON: '/pantry/items/expiring-soon',
    ADJUSTMENTS: (id: string) => `/pantry/items/${id}/adjustments`,
    MERGE_PREVIEW: '/pantry/merge-preview',
    MERGE: '/pantry/merge',
  },
  // Phase 21: Multi-image Fridge Recognition
  INGREDIENT_RECOGNITION: {
    JOBS: '/ingredient-recognition/jobs',
    JOB_DETAIL: (id: string) => `/ingredient-recognition/jobs/${id}`,
    UPDATE_CANDIDATE: (id: string, candidateId: string) =>
      `/ingredient-recognition/jobs/${id}/candidates/${candidateId}`,
    CONFIRM: (id: string) => `/ingredient-recognition/jobs/${id}/confirm`,
    CANCEL: (id: string) => `/ingredient-recognition/jobs/${id}/cancel`,
    RETRY: (id: string) => `/ingredient-recognition/jobs/${id}/retry`,
  },
  // Phase 22: Receipt Analysis & Shopping Gaps
  RECEIPT_JOBS: {
    JOBS: '/receipt-jobs',
    JOB_DETAIL: (id: string) => `/receipt-jobs/${id}`,
    UPDATE_CANDIDATE: (id: string, candidateId: string) =>
      `/receipt-jobs/${id}/candidates/${candidateId}`,
    CONFIRM: (id: string) => `/receipt-jobs/${id}/confirm`,
    CANCEL: (id: string) => `/receipt-jobs/${id}/cancel`,
    RETRY: (id: string) => `/receipt-jobs/${id}/retry`,
  },
  SHOPPING_LISTS: {
    PREVIEW: '/shopping-lists/preview',
  },
} as const;
