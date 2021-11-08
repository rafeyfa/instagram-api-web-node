export interface GetUserByUsernameResponseGraphqlRoot {
    seo_category_infos: string[][]
    logging_page_id: string
    show_suggested_profiles: boolean
    show_follow_dialog: boolean
    graphql: GetUserByUsernameResponseGraphql;
    toast_content_on_load: any
    show_view_shop: boolean
    profile_pic_edit_sync_props: ProfilePicEditSyncProps
    always_show_message_button_to_pro_account: boolean
}

export interface GetUserByUsernameResponseGraphql {
    user: User
}

export interface User {
    biography: string
    blocked_by_viewer: boolean
    restricted_by_viewer: boolean
    country_block: boolean
    external_url: string
    external_url_linkshimmed: string
    edge_followed_by: EdgeFollowedBy
    fbid: string
    followed_by_viewer: boolean
    edge_follow: EdgeFollow
    follows_viewer: boolean
    full_name: string
    has_ar_effects: boolean
    has_clips: boolean
    has_guides: boolean
    has_channel: boolean
    has_blocked_viewer: boolean
    highlight_reel_count: number
    has_requested_viewer: boolean
    hide_like_and_view_counts: boolean
    id: string
    is_business_account: boolean
    is_professional_account: boolean
    is_joined_recently: boolean
    business_address_json: any
    business_contact_method: string
    business_email: any
    business_phone_number: any
    business_category_name: any
    overall_category_name: any
    category_enum: any
    category_name: string
    is_private: boolean
    is_verified: boolean
    edge_mutual_followed_by: EdgeMutualFollowedBy
    profile_pic_url: string
    profile_pic_url_hd: string
    requested_by_viewer: boolean
    should_show_category: boolean
    should_show_public_contacts: boolean
    username: string
    connected_fb_page: any
    pronouns: any[]
    edge_felix_video_timeline: EdgeFelixVideoTimeline
    edge_owner_to_timeline_media: EdgeOwnerToTimelineMedia
    edge_saved_media: EdgeSavedMedia
    edge_media_collections: EdgeMediaCollections
}

export interface EdgeFollowedBy {
    count: number
}

export interface EdgeFollow {
    count: number
}

export interface EdgeMutualFollowedBy {
    count: number
    edges: Edge[]
}

export interface Edge {
    node: Node
}

export interface Node {
    username: string
}

export interface EdgeFelixVideoTimeline {
    count: number
    page_info: PageInfo
    edges: any[]
}

export interface PageInfo {
    has_next_page: boolean
    end_cursor: any
}

export interface EdgeOwnerToTimelineMedia {
    count: number
    page_info: PageInfo2
    edges: Edge2[]
}

export interface PageInfo2 {
    has_next_page: boolean
    end_cursor: string
}

export interface Edge2 {
    node: Node2
}

export interface Node2 {
    __typename: string
    id: string
    shortcode: string
    dimensions: Dimensions
    display_url: string
    edge_media_to_tagged_user: EdgeMediaToTaggedUser
    fact_check_overall_rating: any
    fact_check_information: any
    gating_info: any
    sharing_friction_info: SharingFrictionInfo
    media_overlay_info: any
    media_preview?: string
    owner: Owner
    is_video: boolean
    has_upcoming_event: boolean
    accessibility_caption: string
    edge_media_to_caption: EdgeMediaToCaption
    edge_media_to_comment: EdgeMediaToComment
    comments_disabled: boolean
    taken_at_timestamp: number
    edge_liked_by: EdgeLikedBy
    edge_media_preview_like: EdgeMediaPreviewLike
    location?: Location
    thumbnail_src: string
    thumbnail_resources: ThumbnailResource[]
    coauthor_producers: any[]
    edge_sidecar_to_children?: EdgeSidecarToChildren
}

export interface Dimensions {
    height: number
    width: number
}

export interface EdgeMediaToTaggedUser {
    edges: Edge3[]
}

export interface Edge3 {
    node: Node3
}

export interface Node3 {
    user: User2
    x: number
    y: number
}

export interface User2 {
    full_name: string
    followed_by_viewer: boolean
    id: string
    is_verified: boolean
    profile_pic_url: string
    username: string
}

export interface SharingFrictionInfo {
    should_have_sharing_friction: boolean
    bloks_app_url: any
}

export interface Owner {
    id: string
    username: string
}

export interface EdgeMediaToCaption {
    edges: Edge4[]
}

export interface Edge4 {
    node: Node4
}

export interface Node4 {
    text: string
}

export interface EdgeMediaToComment {
    count: number
}

export interface EdgeLikedBy {
    count: number
}

export interface EdgeMediaPreviewLike {
    count: number
}

export interface Location {
    id: string
    has_public_page: boolean
    name: string
    slug: string
}

export interface ThumbnailResource {
    src: string
    config_width: number
    config_height: number
}

export interface EdgeSidecarToChildren {
    edges: Edge5[]
}

export interface Edge5 {
    node: Node5
}

export interface Node5 {
    __typename: string
    id: string
    shortcode: string
    dimensions: Dimensions2
    display_url: string
    edge_media_to_tagged_user: EdgeMediaToTaggedUser2
    fact_check_overall_rating: any
    fact_check_information: any
    gating_info: any
    sharing_friction_info: SharingFrictionInfo2
    media_overlay_info: any
    media_preview: string
    owner: Owner2
    is_video: boolean
    has_upcoming_event: boolean
    accessibility_caption: string
}

export interface Dimensions2 {
    height: number
    width: number
}

export interface EdgeMediaToTaggedUser2 {
    edges: Edge6[]
}

export interface Edge6 {
    node: Node6
}

export interface Node6 {
    user: User3
    x: number
    y: number
}

export interface User3 {
    full_name: string
    followed_by_viewer: boolean
    id: string
    is_verified: boolean
    profile_pic_url: string
    username: string
}

export interface SharingFrictionInfo2 {
    should_have_sharing_friction: boolean
    bloks_app_url: any
}

export interface Owner2 {
    id: string
    username: string
}

export interface EdgeSavedMedia {
    count: number
    page_info: PageInfo3
    edges: any[]
}

export interface PageInfo3 {
    has_next_page: boolean
    end_cursor: any
}

export interface EdgeMediaCollections {
    count: number
    page_info: PageInfo4
    edges: any[]
}

export interface PageInfo4 {
    has_next_page: boolean
    end_cursor: any
}

export interface ProfilePicEditSyncProps {
    show_change_profile_pic_confirm_dialog: boolean
    show_profile_pic_sync_reminders: boolean
    identity_id: string
    remove_profile_pic_header: any
    remove_profile_pic_subtext: any
    remove_profile_pic_confirm_cta: any
    remove_profile_pic_cancel_cta: any
    is_business_central_identity: boolean
    change_profile_pic_actions_screen_header: string[]
    change_profile_pic_actions_screen_subheader: string[]
    change_profile_pic_actions_screen_upload_cta: string[]
    change_profile_pic_actions_screen_remove_cta: string[]
    change_profile_pic_actions_screen_cancel_cta: string[]
}
