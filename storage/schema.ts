
/**
 * Device data that's specific to the device and does not vary based account
 */
export type Device = {
  lastNuxDialog: string | undefined
  activitySubscriptionsNudged?: boolean
}

export type Account = {
  searchTermHistory?: string[]
  searchAccountHistory?: string[]
}