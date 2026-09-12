import { FeatureMedia, MediaItem, ProjectMedia, TicketMedia } from '../../../domain/port/iMediaLibrary';

// La forme rendue par l'API est celle que le port décrit : la nommer deux fois inviterait
// les deux définitions à diverger.
export type MediaImageDto = MediaItem;
export type TicketImagesDto = TicketMedia;
export type FeatureImagesDto = FeatureMedia;
export type ProjectImagesDto = ProjectMedia;
