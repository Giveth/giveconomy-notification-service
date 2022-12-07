import { config as stagingConfig } from '@/monitorConfig/staging';
import { config as productionConfig } from '@/monitorConfig/production';
import { getEnv } from '@/src/configuration/utils';

export default getEnv() === 'staging' ? stagingConfig : productionConfig;
