import prompts, { PromptObject } from 'prompts'
import { UrlType, OnPremiseUrls } from '../lib/OnPremise'
import onCancel from '../lib/OnCancel'

export default async function run (...requiredUrls: UrlType[]): Promise<OnPremiseUrls> {
  const { isUsingOnPremise } = await prompts({
    type: 'confirm',
    name: 'isUsingOnPremise',
    message: 'Are you using Bugsnag on-premise?',
    initial: false
  }, { onCancel })

  if (!isUsingOnPremise) {
    return {}
  }

  // Remove prompts that aren't relevant to the currently running command
  const requiredPrompts = urlPrompts.filter(prompt => requiredUrls.includes(prompt.name as UrlType))

  return prompts(requiredPrompts, { onCancel })
}

const urlPrompts: PromptObject[] = [
  {
    type: 'text',
    name: UrlType.NOTIFY,
    message: 'What is your Bugsnag notify endpoint?',
    validate: value => value.length > 0
  },
  {
    type: 'text',
    name: UrlType.SESSIONS,
    message: 'What is your Bugsnag sessions endpoint?',
    validate: value => value.length > 0
  },
  {
    type: 'text',
    name: UrlType.UPLOAD,
    message: 'What is your Bugsnag upload endpoint?',
    validate: value => value.length > 0
  },
  {
    type: 'text',
    name: UrlType.BUILD,
    message: 'What is your Bugsnag build endpoint?',
    validate: value => value.length > 0
  }
]
