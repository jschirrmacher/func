import { MailTemplate, SMTPConfiguration } from "useful-typescript-functions"

export type MailConfig = {
  onSuccess?: string
  onError?: string
} & MailTemplate

export type SubscriptionTarget = {
  name: string
  from: string
  admin: string
  request: MailConfig
  confirm: MailConfig
}

export type BackendConfig = {
  dataDir: string
  baseUrl: string
  smtp: SMTPConfiguration
  subscriptionTargets: Record<string, SubscriptionTarget>
}
