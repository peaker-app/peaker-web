export const authErrorCodes = [
  "User.EmailEmpty",
  "User.EmailInvalid",
  "User.EmailTooLong",
  "User.UsernameEmpty",
  "User.UsernameInvalid",
  "User.PasswordHashMissing",
  "User.PasswordBreached",
  "User.UsernameAlreadyRegistered",
  "User.InvalidCredentials",
  "User.EmailAlreadyConfirmed",
  "User.AlreadyDeleted",
  "User.NotFound",
  "RefreshToken.InvalidOrExpired",
  "EmailConfirmation.InvalidOrExpired",
  "EmailConfirmation.ResendTooSoon",
  "EmailConfirmation.DeliveryFailed",
  "EmailConfirmation.RecipientQuotaExceeded",
  "EmailConfirmation.GlobalQuotaExceeded",
] as const;

export const profileErrorCodes = [
  "Profile.DisplayNameEmpty",
  "Profile.DisplayNameTooLong",
  "Profile.BioTooLong",
  "Profile.CountryCodeInvalid",
  "Profile.SlugInvalid",
  "Profile.SlugAlreadyTaken",
  "Profile.AvatarTooLarge",
  "Profile.AvatarFormatNotSupported",
  "Profile.AvatarUploadFailed",
  "Profile.NotFound",
  "Profile.AlreadyExists",
] as const;

export const peakErrorCodes = [
  "Peak.NotFound",
  "Peak.LatitudeOutOfRange",
  "Peak.LongitudeOutOfRange",
  "Peak.RadiusOutOfRange",
  "Peak.AltitudeRangeInvalid",
  "Peak.CountryCodeInvalid",
  "Peak.RegionTooLong",
] as const;

export const ascentErrorCodes = [
  "Ascent.DateInFuture",
  "Ascent.DateTooOld",
  "Ascent.CompanionsTooLong",
  "Ascent.RouteNotesTooLong",
  "Ascent.UnsupportedPhotoFormat",
  "Ascent.PhotoTooLarge",
  "Ascent.PhotoLimitReached",
  "Ascent.EmailNotConfirmed",
  "Ascent.NotOwned",
  "Ascent.NotFound",
  "Ascent.PhotoNotFound",
  "Ascent.PeakNotFound",
  "Ascent.ProfileNotVisible",
  "Ascent.PhotoUploadFailed",
  "Ascent.PeakCatalogUnavailable",
  "Ascent.ProfileDirectoryUnavailable",
] as const;

export const collectionErrorCodes = [
  "Collection.NameRequired",
  "Collection.NameTooLong",
  "Collection.DescriptionTooLong",
  "Collection.NameAlreadyUsed",
  "Collection.DefaultNotEditable",
  "Collection.DefaultNotDeletable",
  "Collection.PeakAlreadyAdded",
  "Collection.PeakLimitReached",
  "Collection.CollectionLimitReached",
  "Collection.PeakRequired",
  "Collection.PeakNameRequired",
  "Collection.PeakNameTooLong",
  "Collection.PeakCatalogUnavailable",
  "Collection.NotFound",
  "Collection.PeakNotFound",
  "Collection.PeakNotInCollection",
] as const;

export const paginationErrorCodes = [
  "Pagination.PageOutOfRange",
  "Pagination.SizeOutOfRange",
] as const;

export const knownErrorCodes = [
  ...authErrorCodes,
  ...profileErrorCodes,
  ...peakErrorCodes,
  ...ascentErrorCodes,
  ...collectionErrorCodes,
  ...paginationErrorCodes,
] as const;

export type KnownErrorCode = (typeof knownErrorCodes)[number];

export const isKnownErrorCode = (value: string): value is KnownErrorCode =>
  (knownErrorCodes as readonly string[]).includes(value);
