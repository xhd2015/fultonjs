import { createHash } from 'crypto';

export function md5(s) {
    if (!s) {
        return '';
    }
    return createHash('md5').update(s).digest('hex');
}
