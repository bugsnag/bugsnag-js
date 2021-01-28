export enum UrlType {
  NOTIFY = 'notify',
  SESSIONS = 'sessions',
  UPLOAD = 'upload',
  BUILD = 'build',
}

export type OnPremiseUrls = Partial<Record<UrlType, string>>
