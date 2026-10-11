import { markdown, skillFile } from '../../../../edge/skill';

export const onRequestGet = async (ctx: Parameters<typeof skillFile>[0]) =>
  markdown(await skillFile(ctx, 'practice.md'));
