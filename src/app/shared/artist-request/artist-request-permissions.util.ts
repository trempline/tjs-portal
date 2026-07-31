export type ArtistRequestWorkflowStatus =
  | 'new_request'
  | 'accepted_by_host'
  | 'host_proposed'
  | 'artist_proposed'
  | 'artist_accepted'
  | 'approved'
  | 'published'
  | 'rejected';

/**
 * Statuses where a request has not yet been accepted by a host, so every artist
 * taking part in it may still change it. Once a host accepts, only the workflow
 * actions (accept / propose new dates) remain.
 */
const COLLABORATOR_EDITABLE_STATUSES: ArtistRequestWorkflowStatus[] = [
  'new_request',
  'host_proposed',
  'artist_proposed',
];

/** The request owner keeps editing until the request has been published as an event. */
export function canOwnerEditRequest(status: ArtistRequestWorkflowStatus): boolean {
  return status !== 'published';
}

/** Artists invited onto someone else's request may edit it until a host accepts it. */
export function canCollaboratorEditRequest(status: ArtistRequestWorkflowStatus): boolean {
  return COLLABORATOR_EDITABLE_STATUSES.includes(status);
}

export function canEditArtistRequest(
  status: ArtistRequestWorkflowStatus,
  isOwner: boolean,
): boolean {
  return isOwner ? canOwnerEditRequest(status) : canCollaboratorEditRequest(status);
}

/** Message shown when an invited artist opens a request that has moved past acceptance. */
export const COLLABORATOR_LOCKED_MESSAGE =
  'This request can no longer be edited because it has already been accepted.';
