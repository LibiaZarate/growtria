export type Provider = "gemini" | "openai" | "claude";

export interface UserData {
    id: string;
    email: string;
    username?: string;
}

export interface AnalysisResult {
    runId: string;
    status: string;
    insights: {
        summary: string;
        top_posts_analysis: string;
        patterns: string[];
        recommendations: string[];
        avatar_analysis?: {
            desires: string[];
            fears: string[];
            frustrations: string[];
            key_angles: string[];
        };
        predictions?: {
            trend: string;
            next_big_thing: string;
            estimated_growth: string;
        };
    };
    topPosts: {
        url: string;
        thumbnail: string;
        impactScore: number;
        likes: number;
        comments: number;
        shares: number;
        plays: number;
    }[];
}

export interface RunHistoryItem {
    id: string;
    instagram_url: string;
    provider: string;
    status: string;
    thumbnail_url: string;
    created_at: string;
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

export type View = "dashboard" | "editor" | "products" | "videos" | "analyze" | "history" | "settings" | "chat" | "metrics";

export interface UserSettings {
    instagram_url: string;
    ai_provider: Provider;
    ai_api_key: string;
    apify_token: string;
    brand_values?: string;
    brand_personality?: string;
    brand_vision?: string;
    product_service?: string;
    big_promise?: string;
    problems_solved?: string;
    unique_mechanism?: string;
    // New AZXION Personal Brand OS Layers
    core_identity?: string;
    core_problem?: string;
    initial_niche?: string;
    brand_archetype?: string;
    brand_narrative?: string;
    content_distribution?: string;
    jiro_prompt?: string;
    jiro_knowledge?: string;
    has_facebook_token?: boolean;
    has_ai_api_key?: boolean;
    has_apify_token?: boolean;
}

export interface SummaryStats {
    totalRuns: number;
    completedRuns: number;
    avgImpact: number;
    totalPosts: number;
    latestInsights: {
        summary: string;
        patterns_json: string;
        recommendations_json: string;
    } | null;
}

export interface HubData {
    slug: string;
    title: string;
    avatar_url: string;
    specialty: string;
    bio_text: string;
    intro_video_url: string;
    products_json: string;
    certifications_json: string;
    whatsapp_number: string;
}
