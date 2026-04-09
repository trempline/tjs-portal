-- Dummy notification for artist workspace testing.
-- Run this after db/019_artist_workspace_notifications.sql.

INSERT INTO public.tjs_artist_notifications (
    recipient_role_id,
    sender_profile_id,
    sender_role,
    subject,
    body,
    expires_at
)
SELECT
    roles.id,
    (
        SELECT profiles.id
        FROM public.tjs_profiles profiles
        INNER JOIN public.tjs_user_roles user_roles
            ON user_roles.user_id = profiles.id
        INNER JOIN public.tjs_roles sender_roles
            ON sender_roles.id = user_roles.role_id
        WHERE user_roles.is_active = true
          AND sender_roles.name = 'Admin'
        ORDER BY profiles.created_at
        LIMIT 1
    ) AS sender_profile_id,
    'Admin' AS sender_role,
    'Welcome to the Artist Workspace' AS subject,
    'This is a test notification for all users with the Artist role. Open the notification to verify the sender, full message view, and unread state.' AS body,
    now() + interval '30 days' AS expires_at
FROM public.tjs_roles roles
WHERE roles.name = 'Artist';
