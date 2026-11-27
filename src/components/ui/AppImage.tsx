import NextImage, { type ImageProps } from 'next/image';
import { withBasePath } from '@/lib/utils/basePath';

/**
 * `next/image` that also works under a base path: the default loader prefixes `/_next/image`
 * with `basePath`, but not a string `src`, which the optimizer then fails to find.
 */
export default function Image({ src, ...props }: ImageProps) {
  return <NextImage src={typeof src === 'string' ? withBasePath(src) : src} {...props} />;
}
