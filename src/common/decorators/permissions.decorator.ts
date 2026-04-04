import { SetMetadata } from '@nestjs/common';

export const ADMIN_PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(ADMIN_PERMISSIONS_KEY, permissions);
