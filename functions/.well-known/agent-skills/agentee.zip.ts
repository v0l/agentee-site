import { archive, skillZip } from '../../../edge/skill';

export const onRequestGet = async (ctx: Parameters<typeof skillZip>[0]) => archive(await skillZip(ctx));
