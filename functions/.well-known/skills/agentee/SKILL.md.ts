import { markdown, skill } from '../../../../edge/skill';

export const onRequestGet = async (ctx: Parameters<typeof skill>[0]) => markdown(await skill(ctx));
