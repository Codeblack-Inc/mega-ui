import { MegaIcon, megaIconNames, type MegaIconName } from '@mega-ui/react';

export const iconNames = megaIconNames;
export function ExampleIcon({ name = 'grid' }: { name?: MegaIconName }) {
  return <MegaIcon name={name} />;
}
