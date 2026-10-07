import { description, json, skill } from '../../../edge/skill';

export const onRequestGet = async (ctx: Parameters<typeof skill>[0]) =>
  json({ skills: [{ name: 'agentee', description: description(await skill(ctx)), files: ['SKILL.md'] }] });
