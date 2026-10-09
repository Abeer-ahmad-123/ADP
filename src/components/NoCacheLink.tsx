import type { ComponentProps } from "react";
import NextLink from "next/link";

export default function NoCacheLink(props: ComponentProps<typeof NextLink>) {
  return <NextLink {...props} prefetch={false} />;
}
