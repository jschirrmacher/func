import { MailTemplate, SMTPConfiguration } from "useful-typescript-functions"

export type MailConfig = {
  onSuccess?: string
  onError?: string
} & MailTemplate

export type SubscriptionTarget = {
  title: string
  from: string
  recipient: string
  optIn: MailConfig
  confirmed: MailConfig
}

export type BackendConfig = {
  dataDir: string
  baseUrl: string
  smtp: SMTPConfiguration
  subscriptionConfig: Record<string, SubscriptionTarget>
}
